import sys
import re

file_path = r'd:\resturant wahtsapp ordering\Restaurant-Order-Taking-System-main\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add back button logic & Midnight deals check
# We will inject a useEffect near the top of App component.
app_start = content.find('function App() {')
hooks_start = content.find('const [showCart, setShowCart]', app_start)

injection = """
  // BACK BUTTON LOGIC
  useEffect(() => {
    const handlePopState = (e) => {
      if (showConfirmModal) {
        setShowConfirmModal(false);
        window.history.pushState(null, '', window.location.href);
      } else if (showCart) {
        setShowCart(false);
        window.history.pushState(null, '', window.location.href);
      } else if (showOrderTypeModal) {
        setShowOrderTypeModal(false);
        window.history.pushState(null, '', window.location.href);
      } else if (showMenu) {
        setShowMenu(false);
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showConfirmModal, showCart, showOrderTypeModal, showMenu]);

  // MIDNIGHT DEALS LOGIC
  const isMidnightDealAvailable = () => {
    if (!dealsData.category_rules || !dealsData.category_rules["Midnight Deals"]) return true;
    
    // Get time in Pakistan
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const timeStr = formatter.format(now);
    const [h, m] = timeStr.split(':').map(Number);
    const currentMins = h * 60 + m;

    const timings = dealsData.category_rules["Midnight Deals"].timings;
    for (const t of timings) {
      const [sh, sm] = t.start.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const [eh, em] = t.end.split(':').map(Number);
      const endMins = eh * 60 + em;

      if (startMins < endMins) {
        if (currentMins >= startMins && currentMins <= endMins) return true;
      } else {
        // Crosses midnight (e.g. 22:30 to 01:30)
        if (currentMins >= startMins || currentMins <= endMins) return true;
      }
    }
    return false;
  };
"""
content = content[:hooks_start] + injection + "\n  " + content[hooks_start:]

# Inject pushState calls
content = content.replace('setShowCart(true)', 'setShowCart(true); window.history.pushState({modal: "cart"}, "", window.location.href);')
content = content.replace('setShowConfirmModal(true)', 'setShowConfirmModal(true); window.history.pushState({modal: "confirm"}, "", window.location.href);')
content = content.replace('setShowOrderTypeModal(true)', 'setShowOrderTypeModal(true); window.history.pushState({modal: "ordertype"}, "", window.location.href);')
content = content.replace('setShowMenu(true)', 'setShowMenu(true); window.history.pushState({modal: "menu"}, "", window.location.href);')

# 2. Add Cross button to Cart Header
cart_header_target = """<div className="flex-1 flex flex-col items-center justify-center">"""
cart_header_replacement = """
              {/* CROSS BUTTON */}
              <button 
                onClick={() => { setShowCart(false); setShowConfirmModal(false); }}
                className="absolute left-4 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all z-20 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex-1 flex flex-col items-center justify-center">"""
content = content.replace(cart_header_target, cart_header_replacement, 1)

# 3. Add Midnight Deals label and check
# Find where categories are rendered for deals.
deals_target = """<h2 className="text-xl font-black text-heading pl-2 border-l-4 border-red-600 mb-4">{cat}</h2>"""
deals_replacement = """<h2 className="text-xl font-black text-heading pl-2 border-l-4 border-red-600 mb-2">{cat}</h2>
                  {cat === "Midnight Deals" && dealsData.category_rules?.["Midnight Deals"] && (
                    <div className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md mb-4 inline-block shadow-sm">
                      🕒 {dealsData.category_rules["Midnight Deals"].label}
                    </div>
                  )}"""
content = content.replace(deals_target, deals_replacement, 1)

# We also need to block changeQty if it's a midnight deal and not available
change_qty_start = content.find('const changeQty = (id, delta) => {')
if change_qty_start != -1:
    body_start = content.find('{', change_qty_start) + 1
    qty_inj = """
    // Midnight Deals Validation
    const isDealId = String(id).startsWith("d_");
    if (isDealId) {
      const dealId = id.slice(2);
      const deal = deals.find(d => String(d.deal_id) === String(dealId));
      if (deal && deal.deal_category === "Midnight Deals" && delta > 0 && !isMidnightDealAvailable()) {
        setStatusMsg("Sorry, Midnight Deals are not available at this time.");
        setStatusType("error");
        setTimeout(() => setStatusMsg(""), 3000);
        return;
      }
    }
"""
    content = content[:body_start] + qty_inj + content[body_start:]

# Inject initial history state so first back works
init_state_inj = """
    // Initial history state
    if (!window.history.state) {
      window.history.replaceState({ root: true }, "", window.location.href);
    }
"""
init_eff = content.find('useEffect(() => {')
if init_eff != -1:
    content = content[:init_eff+18] + init_state_inj + content[init_eff+18:]


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Patch applied successfully')
