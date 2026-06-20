import sys

file_path = r'd:\resturant wahtsapp ordering\Restaurant-Order-Taking-System-main\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

confirm_start = content.find('{/* CONFIRMATION MODAL */}')
create_portal_start = content.find('{createPortal(', confirm_start)

new_cart = """      {/* CART FULL PAGE */}
      {showCart && (
        <div className="fixed inset-0 bg-background z-[100] flex flex-col w-full h-full" onClick={() => { setShowCart(false); setShowConfirmModal(false); }}>
          <div
            className="bg-card w-full max-w-xl mx-auto flex flex-col h-full sm:h-auto sm:max-h-screen sm:my-4 sm:rounded-[28px] sm:border sm:border-secondary/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── PINNED: Header ── */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md flex items-center px-4 py-3 flex-shrink-0 border-b border-secondary/20 z-10 shadow-sm sm:rounded-t-[28px]">
              <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="flex items-center justify-between w-full max-w-[220px] relative mt-1">
                   {/* Progress Line */}
                   <div className="absolute left-[10%] right-[10%] top-[12px] h-[3px] bg-gray-200 z-0 rounded-full"></div>
                   <div className={`absolute left-[10%] top-[12px] h-[3px] bg-gray-900 z-0 rounded-full transition-all duration-500 ease-in-out ${showConfirmModal ? 'w-[80%]' : 'w-[40%]'}`}></div>
                   
                   {/* Step 1: Menu */}
                   <div 
                     className="z-10 flex flex-col items-center justify-start w-14 cursor-pointer transition-all active:scale-95"
                     onClick={() => { setShowCart(false); setShowConfirmModal(false); }}
                   >
                     <div className="w-10 h-7 rounded-[8px] flex items-center justify-center border-[2px] mb-1 transition-all duration-300 shadow-sm bg-white border-gray-800 text-gray-800">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                     </div>
                     <span className="text-[9px] font-extrabold text-gray-800">Menu</span>
                   </div>

                   {/* Step 2: Checkout */}
                   <div 
                     className={`z-10 flex flex-col items-center justify-start w-14 transition-all ${showConfirmModal ? 'cursor-pointer active:scale-95 hover:opacity-80' : ''}`}
                     onClick={() => { if(showConfirmModal) setShowConfirmModal(false); }}
                   >
                     <div className={`w-10 h-7 rounded-[8px] flex items-center justify-center border-[2px] mb-1 transition-all duration-300 shadow-sm ${!showConfirmModal ? 'bg-gray-900 border-gray-900 text-white scale-110 shadow-gray-400' : 'bg-white border-gray-800 text-gray-800'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                     </div>
                     <span className={`text-[9px] font-extrabold ${!showConfirmModal ? 'text-gray-900 scale-105' : 'text-gray-600'}`}>Checkout</span>
                   </div>

                   {/* Step 3: Confirm */}
                   <div className="z-10 flex flex-col items-center justify-start w-14 transition-all">
                     <div className={`w-10 h-7 rounded-[8px] flex items-center justify-center border-[2px] mb-1 transition-all duration-300 shadow-sm ${showConfirmModal ? 'bg-gray-900 border-gray-900 text-white scale-110 shadow-gray-400' : 'bg-white border-gray-300 text-gray-400'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     </div>
                     <span className={`text-[9px] font-extrabold ${showConfirmModal ? 'text-gray-900 scale-105' : 'text-gray-400'}`}>Confirm</span>
                   </div>
                 </div>
              </div>
            </div>

            {showConfirmModal ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 text-sm text-heading font-medium">
                  <h2 className="text-xl font-black text-heading mb-4 text-center">Confirm Your Order</h2>
                  <div className="border-b border-secondary/20 pb-2 mb-2 flex text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    <span className="flex-1">Item</span>
                    <span className="w-10 text-center">Qty</span>
                    <span className="w-16 text-right">Price</span>
                  </div>
                  <div className="space-y-3">
                    {cartFood.map((m) => (
                      <div key={`conf-${m.item_id}`} className="flex items-start gap-2">
                        <span className="flex-1 text-xs font-bold leading-tight">{m.item_name}</span>
                        <span className="w-10 text-center text-xs font-bold">{m.quantity}</span>
                        <span className="w-16 text-right text-xs font-bold text-red-700">Rs {(m.price * m.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {cartDeals.map((d) => (
                      <div key={`conf-d-${d.deal_id}`} className="flex items-start gap-2">
                        <span className="flex-1 text-xs font-bold leading-tight">{d.deal_name}</span>
                        <span className="w-10 text-center text-xs font-bold">{qty["d_" + d.deal_id]}</span>
                        <span className="w-16 text-right text-xs font-bold text-red-700">Rs {(d.deal_price * qty["d_" + d.deal_id]).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-secondary/20 bg-white">
                  <div className="px-1 text-[11px] space-y-1 mb-3">
                    <div className="flex justify-between items-center text-black font-extrabold">
                      <span>Subtotal</span>
                      <span className="text-red-700">Rs {cartTotal.toLocaleString()}</span>
                    </div>
                    {discountAvailable && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>Discount ({discountPercent}%)</span>
                        <span className="text-red-700">- Rs {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {orderType === 'Delivery' && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>Delivery Charges</span>
                        <span className="text-red-700">Rs {deliveryCharge.toLocaleString()}</span>
                      </div>
                    )}
                    {orderType === 'DineIn Reservation' && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>{serviceChargeLabel}</span>
                        <span className="text-red-700">Rs {serviceCharge.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-black font-extrabold text-xs pt-1.5 border-t border-dashed border-gray-300 mt-1">
                      <span>Total</span>
                      <span className="text-red-700">Rs {Math.round(totalWithService).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => setShowConfirmModal(false)} disabled={submitting} className="flex-1 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-sm transition-all">Back</button>
                    <button onClick={confirmAndSubmitOrder} disabled={submitting} className={`flex-[2] py-2.5 rounded-full bg-gradient-to-r from-red-900 to-red-500 text-white font-black text-sm shadow-md transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-red-800 hover:to-red-400 active:scale-[0.98]'}`}>{submitting ? 'Sending to WhatsApp...' : 'Confirm Order'}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-secondary/20">
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-sm bg-red-50 text-red-700 text-[11px] font-black border border-red-200 shadow-sm uppercase tracking-wide">
                      {orderType === "Delivery" ? "🚚 Delivery" : orderType === "Pick-UP" ? "🛍️ Pick-UP" : "🍽️ Dine-In"}
                    </span>
                    
                    {orderType === 'Delivery' && (
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-extrabold shadow-sm transition-all active:scale-95 ${
                          currentCoords
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        }`}
                      >
                        {currentCoords ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Located ✓
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                            Share Live Location
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-1.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-body uppercase tracking-wide mb-0.5">Name</label>
                      <input type="text" className={`w-full p-1.5 border rounded-md text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 ${fieldErrors.customerName ? 'border-red-500' : 'border-secondary/30'}`} placeholder="Your name" value={customerName} onChange={(e)=>{ setCustomerName(e.target.value); setFieldErrors((prev) => ({ ...prev, customerName: undefined })); }} />
                      {fieldErrors.customerName && <p className="text-[8px] text-red-600 mt-0.5">{fieldErrors.customerName}</p>}
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-body uppercase tracking-wide mb-0.5">Phone</label>
                      <input type="tel" className={`w-full p-1.5 border rounded-md text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 ${fieldErrors.customerPhone ? 'border-red-500' : 'border-secondary/30'}`} placeholder="Phone number" value={customerPhone} onChange={(e)=>{ setCustomerPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, customerPhone: undefined })); }} />
                      {fieldErrors.customerPhone && <p className="text-[8px] text-red-600 mt-0.5">{fieldErrors.customerPhone}</p>}
                    </div>
                  </div>
                  {orderType === 'Delivery' && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[9px] font-semibold text-body uppercase tracking-wide mb-0.5">
                          Delivery Address
                          {!currentCoords && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {currentCoords && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <span className="text-[9px] font-bold text-emerald-700">📍 Live location shared</span>
                            <button onClick={() => { setCurrentCoords(null); setLocationStatus(""); }} className="ml-auto text-[9px] text-red-400 hover:text-red-600 font-bold">✕</button>
                          </div>
                        )}
                        {locationStatus && !currentCoords && (
                          <p className="text-[8px] text-amber-600 mb-0.5">{locationStatus}</p>
                        )}
                        <input
                          type="text"
                          className={`w-full p-1.5 border rounded-md text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                            fieldErrors.customerAddress ? 'border-red-500' : 'border-secondary/30'
                          }`}
                          placeholder={currentCoords ? "Optional landmark" : "Full delivery address"}
                          value={customerAddress}
                          onChange={(e) => { setCustomerAddress(e.target.value); setFieldErrors((prev) => ({ ...prev, customerAddress: undefined })); }}
                        />
                        {fieldErrors.customerAddress && (
                          <p className="text-[8px] text-red-600 mt-0.5">{fieldErrors.customerAddress}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-body uppercase tracking-wide mb-0.5">Extra Note</label>
                        <textarea rows="2" className="w-full p-1.5 border rounded-md text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 border-secondary/30 resize-none" placeholder="Any note for the order?" value={extraNote} onChange={(e) => setExtraNote(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {orderType !== 'Delivery' && (
                    <div>
                      <label className="block text-[9px] font-semibold text-body uppercase tracking-wide mb-0.5">Extra Note</label>
                      <textarea rows="2" className="w-full p-1.5 border rounded-md text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 border-secondary/30 resize-none" placeholder="Any note for the order?" value={extraNote} onChange={(e) => setExtraNote(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 min-h-0 pb-2 mt-2">
                  {cartFood.length === 0 && cartDeals.length === 0 ? (
                    <p className="text-center text-body text-xs py-4">Your cart is empty.</p>
                  ) : (
                    <div className="divide-y divide-secondary/10 py-0.5">
                      {cartFood.map((m) => (
                        <div key={m.item_id} className="flex items-start py-2 gap-2.5">
                          <div className="w-[50px] h-[50px] bg-gray-100 rounded-[8px] overflow-hidden flex-shrink-0 border border-gray-200">
                             {(m.img_url || m.image) ? (
                                <img src={m.img_url || m.image} alt={m.item_name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-bold uppercase">Img</div>
                             )}
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-between h-[50px] py-0.5 min-w-0">
                             <span className="font-black text-xs text-heading truncate">{m.item_name}</span>
                             <div className="flex items-center gap-2 rounded border border-secondary/30 bg-white px-2 py-0.5 shadow-sm w-max mt-auto">
                                <button className="text-heading hover:text-red-600 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty(m.item_id, -1)} disabled={!editable}>
                                  {m.quantity === 1 ? (
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  ) : "−"}
                                </button>
                                <span className="w-4 text-center text-xs font-black text-heading">{m.quantity}</span>
                                <button className="text-heading hover:text-red-600 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty(m.item_id, 1)} disabled={!editable}>+</button>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end justify-center h-[50px] flex-shrink-0">
                             <span className="font-extrabold text-xs text-red-700">Rs. {(m.price * m.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {cartDeals.map((d) => (
                        <div key={d.deal_id} className="flex items-start py-2 gap-2.5">
                          <div className="w-[50px] h-[50px] bg-red-50 rounded-[8px] overflow-hidden flex-shrink-0 border border-red-200 flex items-center justify-center">
                             {(d.img_url || d.image) ? (
                                <img src={d.img_url || d.image} alt={d.deal_name} className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-[10px] font-black text-red-800 text-center uppercase leading-tight px-1">Deal</span>
                             )}
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-between h-[50px] py-0.5 min-w-0">
                             <span className="font-black text-xs text-heading truncate">{d.deal_name}</span>
                             <div className="flex items-center gap-2 rounded border border-secondary/30 bg-white px-2 py-0.5 shadow-sm w-max mt-auto">
                                <button className="text-heading hover:text-red-600 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty("d_" + d.deal_id, -1)} disabled={!editable}>
                                  {qty["d_" + d.deal_id] === 1 ? (
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  ) : "−"}
                                </button>
                                <span className="w-4 text-center text-xs font-black text-heading">{qty["d_" + d.deal_id]}</span>
                                <button className="text-heading hover:text-red-600 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty("d_" + d.deal_id, 1)} disabled={!editable}>+</button>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end justify-center h-[50px] flex-shrink-0">
                             <span className="font-extrabold text-xs text-red-700">Rs. {(d.deal_price * qty["d_" + d.deal_id]).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-secondary/20 bg-white">
                  <div className="px-1 text-[11px] space-y-1 mb-3">
                    <div className="flex justify-between items-center text-black font-extrabold">
                      <span>Subtotal</span>
                      <span className="text-red-700">Rs {cartTotal.toLocaleString()}</span>
                    </div>
                    {discountAvailable && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>Discount ({discountPercent}%)</span>
                        <span className="text-red-700">- Rs {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {orderType === 'Delivery' && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>Delivery Charges</span>
                        <span className="text-red-700">Rs {deliveryCharge.toLocaleString()}</span>
                      </div>
                    )}
                    {orderType === 'DineIn Reservation' && (
                      <div className="flex justify-between items-center text-black font-extrabold">
                        <span>{serviceChargeLabel}</span>
                        <span className="text-red-700">Rs {serviceCharge.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-black font-extrabold text-xs pt-1.5 border-t border-dashed border-gray-300 mt-1">
                      <span>Total</span>
                      <span className="text-red-700">Rs {Math.round(totalWithService).toLocaleString()}</span>
                    </div>
                  </div>
                  {statusMsg && (
                    <p className={`text-center font-bold text-[10px] ${statusType === "success" ? "text-green-600" : "text-red-600"}`}>
                      {statusMsg}
                    </p>
                  )}
                  <button
                    className="w-full bg-gradient-to-r from-red-900 to-red-500 text-white py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:from-red-800 hover:to-red-400 active:scale-[0.98] transition-all disabled:bg-secondary/20 disabled:cursor-not-allowed shadow-md"
                    onClick={submitOrder}
                    disabled={cartCount === 0}
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
"""

new_content = content[:confirm_start] + new_cart + content[create_portal_start:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Replaced correctly')
