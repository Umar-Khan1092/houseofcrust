import React from "react";

const FoodCard = React.memo(({ 
  m, id, qtyVal, inactive, imageSrc, editable, imgError, onImgError, changeQty 
}) => {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[24px] border-2 border-red-500/60 bg-card shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${inactive ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="relative h-36 sm:h-44 w-full shrink-0 bg-white overflow-hidden">
        {!imgError && imageSrc ? (
          <img 
            src={imageSrc}
            alt={m.item_name}
            className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
            onError={() => onImgError(id)}
          />
        ) : (
          <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center text-body text-[10px] font-bold">No Image</div>
        )}
        {inactive && (
          <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            Unavailable
          </div>
        )}
        <div className="absolute inset-x-0 top-0 p-2.5">
          <div className="inline-block max-w-[90%] rounded-[14px] bg-black/60 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
            <h3 className="text-white text-[12px] sm:text-sm font-black leading-tight">{m.item_name}</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-3 sm:p-4 bg-card border-t border-secondary/15 z-10">
        <div className="mb-3">
          <h3 className="text-heading text-sm sm:text-base font-black leading-tight line-clamp-2">{m.item_name}</h3>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-secondary/10">
          <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500">Rs {m.price}</span>
          {qtyVal === 0 ? (
            <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`h-8 px-4 rounded-full bg-gradient-to-r from-red-900 to-red-500 text-[11px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>+ Add</button>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-secondary/30 bg-white px-3 py-1 shadow-sm">
              <button onClick={() => changeQty(id, -1)} disabled={!editable} className="text-heading hover:text-red-600 text-lg font-black flex items-center justify-center leading-none">
                {qtyVal === 1 ? (
                  <svg className="w-[18px] h-[18px] text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : "−"}
              </button>
              <span className="w-5 text-center text-[13px] font-black text-heading">{qtyVal}</span>
              <button onClick={() => changeQty(id, 1)} disabled={!editable} className="text-heading hover:text-red-600 text-lg font-black flex items-center justify-center leading-none">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FoodCard;
