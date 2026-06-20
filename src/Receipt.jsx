import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";

export default function Receipt() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Clean URL format (Database Fetch)
    if (id) {
      fetch(`/api/get-receipt?id=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Re-map it just in case it's in the old short format
            const p = data.data;
            const isOldFormat = !!p.orderId;
            setOrderData({
              orderId: isOldFormat ? p.orderId : p.id,
              name: isOldFormat ? p.name : p.nm,
              phone: isOldFormat ? p.phone : p.ph,
              address: isOldFormat ? p.address : p.ad,
              orderType: isOldFormat ? p.orderType : p.ty,
              total: isOldFormat ? p.total : p.tt,
              date: isOldFormat ? p.date : p.dt,
              items: isOldFormat 
                ? p.items.map(item => ({
                    name: item.name,
                    qty: item.qty,
                    customizations: item.customizations,
                    totalPrice: item.totalPrice
                  }))
                : p.it.map(item => ({
                    name: item.n,
                    qty: item.q,
                    customizations: item.c,
                    totalPrice: item.p
                  }))
            });
          } else {
            setError("Receipt not found or has expired.");
          }
        })
        .catch(err => {
          console.error(err);
          setError("Failed to load receipt from secure server.");
        });
      return;
    }

    // 2. Legacy fallback: Try to get data from Hash first (cleanest URL)
    let rawData = window.location.hash.replace('#', '');
    
    // 3. Fallback to 'd' or 'data' query params (for cached browsers)
    if (!rawData) {
      rawData = searchParams.get("d") || searchParams.get("data");
    }

    if (!rawData) {
      setError("No receipt data found in URL.");
      return;
    }

    try {
      let decodedString;
      try {
        decodedString = decodeURIComponent(escape(atob(rawData)));
      } catch (e) {
        decodedString = decodeURIComponent(atob(rawData));
      }

      const p = JSON.parse(decodedString);
      const isOldFormat = !!p.orderId;

      setOrderData({
        orderId: isOldFormat ? p.orderId : p.id,
        name: isOldFormat ? p.name : p.nm,
        phone: isOldFormat ? p.phone : p.ph,
        address: isOldFormat ? p.address : p.ad,
        orderType: isOldFormat ? p.orderType : p.ty,
        total: isOldFormat ? p.total : p.tt,
        date: isOldFormat ? p.date : p.dt,
        subtotal: isOldFormat ? undefined : p.st,
        deliveryCharge: isOldFormat ? undefined : p.dc,
        serviceCharge: isOldFormat ? undefined : p.sc,
        items: isOldFormat 
          ? p.items.map(item => ({
              name: item.name,
              qty: item.qty,
              customizations: item.customizations,
              totalPrice: item.totalPrice
            }))
          : p.it.map(item => ({
              name: item.n,
              qty: item.q,
              customizations: item.c,
              totalPrice: item.p
            }))
      });
    } catch (err) {
      console.error("Failed to decode receipt:", err);
      setError("Invalid or corrupted receipt link.");
    }
  }, [id, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-6 font-outfit">
        <p className="text-red-700 font-semibold mb-4 text-center">{error}</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center font-outfit">
        <p className="animate-pulse text-neutral-600">Loading secure receipt...</p>
      </div>
    );
  }

  // Calculate totals robustly with fallbacks for legacy receipts
  const subtotal = orderData.subtotal !== undefined ? orderData.subtotal : orderData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const fallbackCharge = orderData.total - subtotal;
  const isDelivery = orderData.orderType === "Delivery";
  
  const deliveryCharge = orderData.deliveryCharge !== undefined ? orderData.deliveryCharge : (isDelivery ? fallbackCharge : 0);
  const serviceCharge = orderData.serviceCharge !== undefined ? orderData.serviceCharge : (!isDelivery ? fallbackCharge : 0);

  return (
    <div className="h-screen w-full bg-[#FFF9F0] font-outfit text-neutral-800 overflow-hidden flex flex-col items-center justify-center">
      <div className="w-full h-full max-w-lg bg-[#FFF9F0] flex flex-col">
        
        {/* Top Header & Customer Name */}
        <div className="pt-6 pb-4 px-6 text-center shrink-0 border-b border-gray-200">
           <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">{orderData.orderType}</p>
           <h1 className="text-xl md:text-2xl font-black text-neutral-800">HOUSE OF CRUST</h1>
           <p className="text-sm md:text-base text-neutral-500 mt-2 font-medium">Customer: <span className="font-bold text-neutral-700">{orderData.name}</span></p>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_50px_80px] gap-4 px-6 py-3 border-b border-gray-200 shrink-0 bg-[#FFF9F0] z-10">
          <div className="text-xs font-bold tracking-wider text-neutral-500">ITEM</div>
          <div className="text-xs font-bold tracking-wider text-neutral-500 text-center">QTY</div>
          <div className="text-xs font-bold tracking-wider text-neutral-500 text-right">PRICE</div>
        </div>

        {/* Items List (Scrollable Area) */}
        <div className="px-6 py-2 overflow-y-scroll flex-1 relative shadow-inner">
          {orderData.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_50px_80px] gap-4 py-3 border-b-2 border-dashed border-gray-200 last:border-0">
              <div>
                <p className="font-semibold text-neutral-800 text-sm md:text-base leading-tight">
                  {item.name}
                </p>
                {item.customizations && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {item.customizations}
                  </p>
                )}
              </div>
              <div className="font-semibold text-neutral-800 text-center text-sm md:text-base">
                {item.qty}
              </div>
              <div className="font-semibold text-[#B91C1C] text-right text-sm md:text-base whitespace-nowrap">
                Rs {item.totalPrice}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Section */}
        <div className="px-6 pb-8 pt-4 shrink-0 border-t border-dashed border-gray-300 bg-[#FFF9F0]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-600 text-sm md:text-base">Subtotal</span>
              <span className="font-bold text-[#B91C1C] text-sm md:text-base">Rs {subtotal}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-600 text-sm md:text-base">Delivery Charges</span>
                <span className="font-bold text-[#B91C1C] text-sm md:text-base">Rs {deliveryCharge}</span>
              </div>
            )}
            {serviceCharge > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-600 text-sm md:text-base">Service Charges (5%)</span>
                <span className="font-bold text-[#B91C1C] text-sm md:text-base">Rs {serviceCharge}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-black text-neutral-900 text-lg md:text-xl">Total</span>
            <span className="font-black text-[#B91C1C] text-lg md:text-xl">Rs {orderData.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
