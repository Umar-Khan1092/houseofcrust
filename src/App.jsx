import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

const logo = "https://res.cloudinary.com/do3pfwdv5/image/upload/v1780941886/houseofcrust_u5fhjt.png";
const bannerImg = "https://res.cloudinary.com/do3pfwdv5/image/upload/w_900,q_auto,f_auto,dpr_auto/v1780715052/banner_fkh5lf.jpg";
const heroImg = "https://res.cloudinary.com/do3pfwdv5/image/upload/v1781178550/housecrsuthero_vwocly.avif";
const busyRestaurantImg = "https://res.cloudinary.com/do3pfwdv5/image/upload/w_700,q_auto,f_auto,dpr_auto/v1780718075/dininggroup_algfey.jpg";
const birthdayPartyImg = "https://res.cloudinary.com/do3pfwdv5/image/upload/w_700,q_auto,f_auto,dpr_auto/v1780715072/Birthday_r6pfed.png";
const sittingImg = "https://res.cloudinary.com/do3pfwdv5/image/upload/w_700,q_auto,f_auto,dpr_auto/v1780715070/sideimage_ml9n5c.png";
import deliveryConfig from "./deliveryConfig.json";
import PizzaCard from "./components/PizzaCard";
import FoodCard from "./components/FoodCard";
import DealCard from "./components/DealCard";
import PlatterCard from "./components/PlatterCard";
import itemsData from "../data/items.json";
import dealsData from "../data/deals.json";
import pizzaData from "../data/pizza.json";
import plattersData from "../data/platters.json";
import beverageData from "../data/beverage.json";
/* ================= CONFIG ================= */
const EDIT_WINDOW_MINUTES = 3;
/* ================= UI CONSTANTS ================= */
const makeId = (prefix, value, index) => `${prefix}-${String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`;

const normalizeLocalMenuItem = (item, index, source) => {
  const name = item.item_name || item.subcategory_name || item.deal_name || "Item";
  const category = item.category_name || item.category || (source === "platters" ? "Platters" : "General");
  const image = item.image || item.img_url || "";
  const available = String(item.available ?? item.active ?? "yes");
  const sizeOptions = item.sizes && typeof item.sizes === "object"
    ? Object.entries(item.sizes).map(([sizeLabel, sizePrice]) => ({
        key: sizeLabel,
        label: sizeLabel.replace(/_/g, " "),
        price: Number(sizePrice) || 0,
        id: `${item.item_id || makeId(source, name, index)}__${sizeLabel}`,
      }))
    : [];
  const basePrice = Number(item.price ?? (sizeOptions.length ? Math.min(...sizeOptions.map((entry) => entry.price)) : 0));

  return {
    ...item,
    item_id: item.item_id || makeId(source, name, index),
    item_name: name,
    category,
    price: Number.isFinite(basePrice) ? basePrice : 0,
    img_url: image,
    image,
    active: available,
    available,
    source,
    sizeOptions,
    hasSizes: sizeOptions.length > 0,
  };
};

const normalizeLocalDealItem = (item, index) => {
  const name = item.item_name || item.deal_name || "Deal";
  const category = item.category_name || item.category || "Deals";
  const image = item.image || item.img_url || "";
  const includes = Array.isArray(item.includes)
    ? item.includes.filter(Boolean)
    : typeof item.items === "string"
      ? item.items.split(",").map((entry) => entry.trim()).filter(Boolean)
      : [];

  return {
    ...item,
    deal_id: item.deal_id || makeId("deal", name, index),
    deal_name: name,
    deal_price: Number(item.price ?? item.deal_price ?? 0),
    deal_category: category,
    img_url: image,
    image,
    includes,
    active: String(item.available ?? item.active ?? "yes"),
    available: String(item.available ?? item.active ?? "yes"),
    items: includes.join(", "),
  };
};

/* ================= APP ================= */
export default function App() {
  const [menu, setMenu] = useState([]);
  const [deals, setDeals] = useState([]);
  const [qty, setQty] = useState({});
  const [initialQty, setInitialQty] = useState({});
  const [search, setSearch] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [savedCustomers, setSavedCustomers] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("food");
  const [expandedDeals, setExpandedDeals] = useState({});
  const toggleDealExpand = (dealId, e) => {
    e.stopPropagation();
    setExpandedDeals((prev) => ({ ...prev, [dealId]: !prev[dealId] }));
  };
  const [submitting, setSubmitting] = useState(false);
  const [orderTime, setOrderTime] = useState(null);
  const [orderType, setOrderType] = useState("Delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState("success");
  
  const [showCart, setShowCart] = useState(() => {
    const saved = sessionStorage.getItem('kebabishShowCart');
    if (saved !== null) return JSON.parse(saved);
    return false;
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [orderTypeSelected, setOrderTypeSelected] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loaderPointer, setLoaderPointer] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [originalMinutes, setOriginalMinutes] = useState(0);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  const [imgErrors, setImgErrors] = useState({});
  const [customizations, setCustomizations] = useState({});
  const [customPizzaSauce, setCustomPizzaSauce] = useState({});
  const [customPizzaChicken, setCustomPizzaChicken] = useState({});
  const [customPizzaToppings, setCustomPizzaToppings] = useState({});
  const [showMenu, setShowMenu] = useState(() => {
    const saved = sessionStorage.getItem('kebabishShowMenu');
    if (saved !== null) return JSON.parse(saved);
    return deliveryConfig.appSettings?.showHomePage === "yes" ? false : true;
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const menuSectionRef = useRef(null);
  const menuVersionRef = useRef(0);
  const goHome = () => {
    if (deliveryConfig.appSettings?.showHomePage !== "yes") return;
    setShowMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openMenu = () => {
    setShowCart(false);
    if (orderTypeSelected) {
      setShowMenu(true); window.history.pushState({modal: "menu"}, "", window.location.href);;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowOrderTypeModal(true); window.history.pushState({modal: "ordertype"}, "", window.location.href);;
    }
  };

  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [isPreparingMenu, setIsPreparingMenu] = useState(false);

  useEffect(() => {
    if (isInstalling) {
      const interval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.floor(Math.random() * 3) + 4;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setInstallProgress(0);
    }
  }, [isInstalling]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsPWAInstalled(true);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check if app is already installed
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalling(true);
          // Force it to show for ~8.5 seconds
          setTimeout(() => {
            setInstallProgress(100);
            setTimeout(() => {
              setIsInstalling(false);
              setIsPWAInstalled(true);
            }, 1500);
          }, 8500);
        }
        setDeferredPrompt(null);
      });
    } else {
      // Show install guide for iOS/Safari and devices where prompt isn't available
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    if (loading) return;
    
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) return;

    const isVisible = (item) => {
      const rect = item.getBoundingClientRect();
      return rect.top < window.innerHeight - 40 && rect.bottom > 0;
    };

    const showItem = (item) => {
      if (!item.classList.contains("reveal-visible")) {
        item.classList.add("reveal-visible");
      }
    };

    const handleScroll = () => {
      revealItems.forEach((item) => {
        if (isVisible(item)) showItem(item);
      });
    };

    handleScroll();
    const revealTimeout = window.setTimeout(handleScroll, 120);

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) showItem(entry.target);
          });
        },
        { threshold: 0.12 }
      );

      revealItems.forEach((item) => observer.observe(item));

      return () => {
        observer.disconnect();
        window.clearTimeout(revealTimeout);
      };
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, showMenu]);

  useEffect(() => {
    sessionStorage.setItem('kebabishShowMenu', JSON.stringify(showMenu));
  }, [showMenu]);

  useEffect(() => {
    sessionStorage.setItem('kebabishShowCart', JSON.stringify(showCart));
  }, [showCart]);

  const handleLoaderPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setLoaderPointer({ x, y });
  };

  const resetLoaderPointer = () => setLoaderPointer({ x: 0, y: 0 });

  const loadingStepMessages = [
    "Selecting ingredients...",
    "Preparing your menu...",
    "Loading fresh deals...",
    "Perfecting your experience...",
  ];

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingStepMessages.length);
    }, 1400);

    return () => clearInterval(interval);
  }, [loading]);

  /* ================= PERSIST CART & CUSTOMER DATA ================= */
  useEffect(() => {
    const stored = localStorage.getItem('kebabishCart');
    if (stored) {
      const { qty, initialQty, orderTime, orderType, customerName, customerPhone, customerAddress, orderTypeSelected, customizations, customPizzaSauce, customPizzaChicken, customPizzaToppings } = JSON.parse(stored);
      setQty(qty || {});
      setInitialQty(initialQty || {});
      setOrderTime(orderTime ? new Date(orderTime) : null);
      if (orderType) setOrderType(orderType);
      if (orderTypeSelected) setOrderTypeSelected(true);
      setCustomerName(customerName || "");
      setCustomerPhone(customerPhone || "");
      setCustomerAddress(customerAddress || "");
      setCustomizations(customizations || {});
      setCustomPizzaSauce(customPizzaSauce || {});
      setCustomPizzaChicken(customPizzaChicken || {});
      setCustomPizzaToppings(customPizzaToppings || {});
    }

    
    // Load order count and saved customers
    const orderCountData = localStorage.getItem('kebabishOrderCount');
    const count = orderCountData ? parseInt(orderCountData) : 0;
    setOrderCount(count);
    
    const customersData = localStorage.getItem('kebabishCustomers');
    const customers = customersData ? JSON.parse(customersData) : {};
    setSavedCustomers(customers);
    
    // Auto-populate customer info if phone matches saved customer
    if (customerPhone && customers[customerPhone.replace(/\\D/g, '')]) {
      const saved = customers[customerPhone.replace(/\\D/g, '')];
      if (!customerName) setCustomerName(saved.name);
      if (!customerAddress) setCustomerAddress(saved.address);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('kebabishCart', JSON.stringify({ qty, initialQty, orderTime, orderType, customerName, customerPhone, customerAddress, orderTypeSelected, customizations, customPizzaSauce, customPizzaChicken, customPizzaToppings }));
  }, [qty, initialQty, orderTime, orderType, customerName, customerPhone, customerAddress, orderTypeSelected, customizations, customPizzaSauce, customPizzaChicken, customPizzaToppings]);
  /* ================= LOAD DATA ================= */
  // BACK BUTTON LOGIC
  useEffect(() => {

    // Initial history state
    if (!window.history.state) {
      window.history.replaceState({ root: true }, "", window.location.href);
    }
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


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const localBeverageItems = [];
        if (beverageData && beverageData.items) {
          beverageData.items.forEach(category => {
            if (category.brands) {
              category.brands.forEach(brand => {
                brand.sizes.forEach(size => {
                  localBeverageItems.push({
                    item_id: `bev_${brand.name}_${size.size}`.replace(/\s+/g, '_'),
                    item_name: `${brand.name} ${size.size}`,
                    price: size.price,
                    category: "Beverages",
                    category_name: "Beverages",
                    active: size.available && brand.available && category.available ? "yes" : "no",
                    img_url: beverageData.image_url || ""
                  });
                });
              });
            } else if (category.sizes) {
              category.sizes.forEach(size => {
                localBeverageItems.push({
                  item_id: `bev_${category.name}_${size.size}`.replace(/\s+/g, '_'),
                  item_name: `${category.name} ${size.size}`,
                  price: size.price,
                  category: "Beverages",
                  category_name: "Beverages",
                  active: size.available && category.available ? "yes" : "no",
                  img_url: beverageData.image_url || ""
                });
              });
            }
          });
        }

        const localMenuItems = [
          ...itemsData.menu.map((item, index) => normalizeLocalMenuItem(item, index, "items")),
          ...pizzaData.menu.map((item, index) => normalizeLocalMenuItem(item, index, "pizza")),
          ...plattersData.items.map((item, index) => normalizeLocalMenuItem({
            ...item,
            category_name: item.category_name || plattersData.category_name || "Platters",
          }, index, "platters")),
          ...localBeverageItems,
        ];

        const localDealItems = dealsData.menu.map((item, index) => normalizeLocalDealItem(item, index));
        const mergedMenu = [...localMenuItems];
        const mergedDeals = [...localDealItems];

        setMenu(mergedMenu);
        setDeals(mergedDeals);

        setQty((prev) => {
          const newQty = { ...prev };
          Object.keys(newQty).forEach((id) => {
            const isDeal = id.startsWith("d_");
            const itemId = isDeal ? id.slice(2) : id;
            const item = isDeal
              ? mergedDeals.find((d) => d.deal_id === itemId)
              : mergedMenu.find((m) => m.item_id === itemId);

            if (item?.active?.toLowerCase() === "no" || !item) {
              delete newQty[id];
            }
          });
          return newQty;
        });
      } catch (err) {
        setError(err.message || 'An unknown error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  

  /* ================= MAPS ================= */
  const menuMap = useMemo(() => {
    const map = {};
    menu.forEach((m) => {
      map[m.item_id] = m;
      (m.sizeOptions || []).forEach((option) => {
        map[option.id] = {
          ...m,
          item_id: option.id,
          item_name: `${m.item_name} (${option.label})`,
          price: option.price,
          sizeLabel: option.label,
          sizeKey: option.key,
          parentItemId: m.item_id,
        };
      });
    });
    return map;
  }, [menu]);
  const dealMap = useMemo(() => {
    const map = {};
    deals.forEach((d) => {
      if (!map[d.deal_id]) map[d.deal_id] = [];
      map[d.deal_id].push(d);
    });
    return map;
  }, [deals]);
  const dealCategoryNames = useMemo(() => {
    return [...new Set(deals.map((item) => item.deal_category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [deals]);

  const platterCategoryNames = useMemo(() => {
    return [...new Set(menu.filter((m) => m.source === "platters" || m.category === "Platters").map((m) => m.category || "Platters"))];
  }, [menu]);

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map((m) => m.category).filter(Boolean)), ...dealCategoryNames, ...platterCategoryNames];
    const drinkKeywords = ["chai", "kahwa", "coffee", "falooda", "shake", "juice", "tea", "mint", "drinks", "beverage", "soda"];

    return cats.sort((a, b) => {
      const isADrink = drinkKeywords.some((kw) => a.toLowerCase().includes(kw));
      const isBDrink = drinkKeywords.some((kw) => b.toLowerCase().includes(kw));

      if (isADrink && !isBDrink) return 1;
      if (!isADrink && isBDrink) return -1;
      return a.localeCompare(b);
    });
  }, [menu, dealCategoryNames, platterCategoryNames]);

  const activeNav = activeCategory;

  const visibleCategories = useMemo(() => {
    if (activeCategory === "All") {
      return categories.filter(cat => !["Deals", "Family Deals", "Midnight Deals", "Platters"].includes(cat));
    }
    return categories.filter((cat) => cat === activeCategory);
  }, [activeCategory, categories]);

  // Build a compact, unique list of categories including All and Deals,
  // and split into two rows for compact horizontal display.
  const displayCategories = useMemo(() => {
    const baseOrder = [
      "Burgers", "Wraps", "Fries", "Hot Wings", "Traditional Pizza", 
      "Premium Special Pizza", "Premium Spicial Pizza", "Chicken Nuggets", "Deals", 
      "Family Deals", "Midnight Deals", "Platters"
    ];
    
    const presentCats = categories.filter(c => c !== "General");
    
    const sortedCategories = presentCats.sort((a, b) => {
      const idxA = baseOrder.indexOf(a);
      const idxB = baseOrder.indexOf(b);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
      return a.localeCompare(b);
    });
    
    const arr = ["All", ...sortedCategories];
    const uniqueCats = Array.from(new Set(arr));
    
    if (!search) return uniqueCats;
    const searchLower = search.toLowerCase();
    
    return uniqueCats.filter(cat => {
      if (cat === "All") return true;
      if (cat.toLowerCase().includes(searchLower)) return true;
      return menu.some(m => m.category === cat && m.item_name.toLowerCase().includes(searchLower));
    });
  }, [categories, search, menu]);

  const categoryRows = useMemo(() => {
    const midpoint = Math.ceil(displayCategories.length / 2);
    return [displayCategories.slice(0, midpoint), displayCategories.slice(midpoint)];
  }, [displayCategories]);

  useEffect(() => {
    if (activeCategory !== "All" && !categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, categories]);


  /* ================= CART ================= */
  const changeQty = (id, delta) => {
    // Midnight Deals Validation
    const isDealId = String(id).startsWith("d_");
    if (isDealId) {
      const dealId = id.slice(2);
      const deal = deals.find(d => String(d.deal_id) === String(dealId));
      if (deal && deal.deal_category === "Midnight Deals" && delta > 0 && !isMidnightDealAvailable()) {
        setStatusMsg("Sorry, Midnight Deals are not available at this time.");
        setStatusType("error");
        setTimeout(() => setStatusMsg(""), 3000);
        const el = document.getElementById("cat-midnight-deals");
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    if (delta < 0 && !editable) return; // Prevent decreasing if not editable
    let item;
    if (id.startsWith("d_")) {
      const dealId = id.slice(2);
      item = dealMap[dealId]?.[0];
    } else {
      item = menuMap[id];
    }
    const inactive = item?.active?.toLowerCase() === "no";
    if (inactive) return;
    
    setQty((prev) => {
      const newQ = (prev[id] || 0) + delta;
      if (newQ < 0) {
        return prev;
      }
      if (newQ === 0) {
        const next = { ...prev };
        delete next[id];
        
        // Clean up customizations if this was the last size of a pizza
        if (!id.startsWith("d_")) {
          const parentId = getParentItemId(id);
          const remainingQties = Object.entries(next).filter(([key]) => getParentItemId(key) === parentId);
          if (remainingQties.length === 0) {
            // This was the last size for this item, clean up customization
            setCustomizations(prev => {
              const next = { ...prev };
              delete next[parentId];
              return next;
            });
          }
        }
        
        return next;
      }
      return { ...prev, [id]: newQ };
    });
  };
  const cartFood = Object.entries(qty)
    .filter(([id]) => !id.startsWith("d_"))
    .map(([id, quantity]) => ({
      ...menuMap[id],
      item_id: id,
      quantity,
      price: menuMap[id]?.price ?? 0,
    }))
    .filter((item) => item && item.item_id && item.quantity > 0);
  const platterItems = useMemo(() => menu.filter((m) => m.source === "platters" || m.category === "Platters"), [menu]);
  const cartDeals = Object.values(dealMap)
    .map((rows) => rows[0])
    .filter((d) => qty["d_" + d.deal_id] > 0);
  const cartCount = cartFood.reduce((sum, m) => sum + m.quantity, 0) + cartDeals.reduce((sum, d) => sum + qty["d_" + d.deal_id], 0);
  const cartItemCount = cartFood.length + cartDeals.length; // unique selected items
  const cartTotal =
    cartFood.reduce((s, m) => s + m.price * m.quantity, 0) +
    cartDeals.reduce(
      (s, d) => s + d.deal_price * qty["d_" + d.deal_id],
      0
    );

  const toRad = (value) => (value * Math.PI) / 180;
  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDeliveryCharge = (distanceKm = 0) => {
    const isDistanceBased = deliveryConfig.deliveryPricing?.distance_based_charges === "yes";
    if (!isDistanceBased) {
      return deliveryConfig.deliveryPricing?.fixedDeliveryCharge || 0;
    }
    const tiers = deliveryConfig.deliveryPricing?.tiers || [];
    const baseFee = deliveryConfig.deliveryPricing?.baseFee || 0;
    if (!tiers.length) return baseFee;
    const matchedTier = tiers.find((tier) => distanceKm >= tier.fromKm && distanceKm < tier.toKm) || tiers[tiers.length - 1];
    return Math.round(baseFee + matchedTier.ratePerKm * distanceKm);
  };

  const availableBranches = useMemo(() => {
    const branches = deliveryConfig.branches || [];
    const activeBranches = branches.filter(b => b.available === "yes");
    if (activeBranches.length === 0) {
      return [{
        name: deliveryConfig.restaurant.name || "Main",
        lat: deliveryConfig.restaurant.lat,
        lng: deliveryConfig.restaurant.lng,
        whatsappNumber: deliveryConfig.restaurant.whatsappNumber
      }];
    }
    return activeBranches;
  }, [deliveryConfig]);

  const nearestBranch = useMemo(() => {
    if (!currentCoords) return availableBranches[0];
    let minDistance = Infinity;
    let closest = availableBranches[0];
    for (const b of availableBranches) {
      const dist = calculateDistanceKm(b.lat, b.lng, currentCoords.latitude, currentCoords.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = b;
      }
    }
    return closest;
  }, [currentCoords, availableBranches]);

  useEffect(() => {
    if (currentCoords && nearestBranch && orderType === "Delivery") {
      const fetchDrivingDistance = async () => {
        try {
          const lng1 = nearestBranch.lng;
          const lat1 = nearestBranch.lat;
          const lng2 = currentCoords.longitude;
          const lat2 = currentCoords.latitude;
          
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`);
          const data = await res.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            setDistanceKm(data.routes[0].distance / 1000);
            return;
          }
        } catch (error) {
          console.error("Error fetching driving distance:", error);
        }
        // Fallback to aerial distance
        setDistanceKm(calculateDistanceKm(nearestBranch.lat, nearestBranch.lng, currentCoords.latitude, currentCoords.longitude));
      };
      
      fetchDrivingDistance();
    } else {
      setDistanceKm(0);
    }
  }, [currentCoords, nearestBranch, orderType]);
  const deliveryCharge = orderType === "Delivery" ? calculateDeliveryCharge(distanceKm) : 0;
  const serviceCharge = orderType === "DineIn Reservation" ? Math.round(cartTotal * (deliveryConfig.serviceCharge?.rate || 0.03)) : 0;
  const serviceChargeLabel = deliveryConfig.serviceCharge?.label || "Service Charges";

  // ── Discount calculation ──
  const discountConfig = deliveryConfig.discount || {};
  const discountAvailable = discountConfig.available === "yes";
  const discountPercent = discountAvailable ? (discountConfig.percent || 0) : 0;
  const discountAmount = discountPercent > 0 ? Math.round(cartTotal * discountPercent / 100) : 0;
  const totalWithService = Math.round(cartTotal - discountAmount + deliveryCharge + serviceCharge);
  const deliveryRouteUrl = orderType === "Delivery"
    ? currentCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${nearestBranch.lat},${nearestBranch.lng}&destination=${currentCoords.latitude},${currentCoords.longitude}`
      : customerAddress
        ? `https://www.google.com/maps/dir/?api=1&origin=${nearestBranch.lat},${nearestBranch.lng}&destination=${encodeURIComponent(customerAddress)}`
        : null
    : null;
  const editable =
    (!orderTime ||
    (new Date() - new Date(orderTime)) / 1000 / 60 < EDIT_WINDOW_MINUTES);
  const hasChanges = JSON.stringify(qty) !== JSON.stringify(initialQty);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by this browser.");
      return;
    }

    setLocationStatus("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentCoords(position.coords);
        setLocationStatus("Location captured.");
      },
      () => {
        setLocationStatus("Location access was denied. You can still use the address field.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    let interval;
    if (orderTime && editable) {
      interval = setInterval(() => {
        const remaining = EDIT_WINDOW_MINUTES - (new Date() - new Date(orderTime)) / 1000 / 60;
        setRemainingTime(remaining > 0 ? remaining : 0);
        if (remaining <= 0 && interval) clearInterval(interval);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [orderTime, editable]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= SUBMIT ================= */
  // Normalise to international format: strip leading 0, prepend 92 (Pakistan)
  const rawPhone = nearestBranch.whatsappNumber || deliveryConfig.restaurant?.whatsappNumber || "923277343906";
  const WHATSAPP_PHONE = rawPhone.startsWith("0")
    ? "92" + rawPhone.slice(1)
    : rawPhone.startsWith("+")
    ? rawPhone.slice(1)
    : rawPhone;

  // Helper to extract parent item ID from sized item ID
  const getParentItemId = (itemId) => {
    // If item has sizes, the ID format is parentId__sizeKey
    // If it's a regular item without sizes, just return the itemId
    return itemId.includes('__') ? itemId.split('__')[0] : itemId;
  };

  const buildOrderMessage = (prefix = "New Order") => {
    const restaurantName = (deliveryConfig.restaurant?.name || "House of Crust").toUpperCase();

    // ── Order-type label for header ──────────────────────────────
    const orderTypeLabels = {
      "Delivery":           "Delivery Order",
      "Pick-UP":            "Pick-Up Order",
      "DineIn Reservation": "Dine-In Reservation",
    };
    const orderLabel = orderTypeLabels[orderType] || orderType;

    // ── Estimated time calculation ───────────────────────────────
    const timeConfig = deliveryConfig.orderTimes?.[orderType];
    const timeAvailable = timeConfig?.available === "yes";
    const extraMinutes  = timeConfig?.minutes || 0;
    const closingMsg    = timeConfig?.message || "";

    const now = new Date();
    now.setMinutes(now.getMinutes() + extraMinutes);
    const estHour   = now.getHours();
    const estMin    = now.getMinutes();
    const ampm      = estHour >= 12 ? "PM" : "AM";
    const h12       = estHour % 12 === 0 ? 12 : estHour % 12;
    const minPadded = String(estMin).padStart(2, "0");
    const estTimeStr = `${h12}:${minPadded} ${ampm}`;

    // ── Emoji/label per order type ───────────────────────────────
    const timeEmoji = { "Delivery": "🛵", "Pick-UP": "🏃", "DineIn Reservation": "🍽️" };
    const timeLabel = { "Delivery": "Estimated Delivery Time", "Pick-UP": "Ready for Pickup By", "DineIn Reservation": "Table Ready By" };

    // ── Build items list ─────────────────────────────────────────
    const itemsByParent = {};
    cartFood.forEach(m => {
      const parentId = m.parentItemId || getParentItemId(m.item_id);
      if (!itemsByParent[parentId]) itemsByParent[parentId] = [];
      itemsByParent[parentId].push(m);
    });

    const itemLines = [
      ...Object.entries(itemsByParent).map(([parentId, items]) => {
        let lines = items.map(m => `• ${m.item_name} × ${m.quantity} (Rs ${(m.price * m.quantity).toLocaleString()})`).join("\n");
        let customizationText = customizations[parentId];
        if (!customizationText) {
          for (const [key, value] of Object.entries(customizations)) {
            if ((key.includes(parentId) || parentId.includes(key)) && value?.trim()) {
              customizationText = value;
              break;
            }
          }
        }
        // Include sauce and chicken selections for custom pizza
        const sauce = customPizzaSauce[parentId];
        const chicken = customPizzaChicken[parentId];
        const toppings = customPizzaToppings[parentId];
        if (sauce) lines += `\n  🍅 Sauce: ${sauce}`;
        if (chicken) lines += `\n  🍗 Chicken: ${chicken}`;
        if (toppings && toppings.length > 0) lines += `\n  🍕 Toppings: ${toppings.join(", ")}`;
        if (customizationText?.trim()) {
          lines += `\n  ✏️ Note: ${customizationText.trim()}`;
        }
        return lines;
      }),
      ...cartDeals.map(d => `• ${d.deal_name} × ${qty["d_" + d.deal_id]} (Rs ${(d.deal_price * qty["d_" + d.deal_id]).toLocaleString()})`),
    ].join("\n");

    // ── Bill details ─────────────────────────────────────────────
    const subtotalFormatted = Number(cartTotal).toLocaleString();
    const discountFormatted = Number(discountAmount).toLocaleString();
    const totalFormatted    = Number(Math.round(totalWithService)).toLocaleString();

    // ── Assemble message ─────────────────────────────────────────
    const divider = "------------------------------------------";

    let msg = "";
    msg += `🔴 *${restaurantName} — New ${orderLabel} Received* 🔴\n`;
    msg += `${divider}\n\n`;

    // Customer details section
    msg += `*CUSTOMER DETAILS:*\n`;
    msg += `👤 *Name:* ${customerName}\n`;
    msg += `📞 *Phone:* ${customerPhone}\n`;
    if (orderType === "Delivery") {
      if (currentCoords) {
        const mapsUrl = `${deliveryConfig.liveLocation?.googleMapsUrlPrefix || "https://maps.google.com/?q="}${currentCoords.latitude},${currentCoords.longitude}`;
        msg += `Current Location : ${mapsUrl}\n`;
      }
      msg += `📍 *Address:* ${customerAddress}\n`;
    }
    if (orderType === "DineIn Reservation") {
      msg += `🍽️ *Type:* Dine-In Reservation\n`;
    }
    if (extraNote?.trim()) {
      msg += `📝 *Note:* ${extraNote.trim()}\n`;
    }

    msg += `\n${divider}\n`;

    // Order summary section
    msg += `*ORDER SUMMARY:*\n`;
    msg += `${itemLines}\n`;
    msg += `\n${divider}\n`;

    // Bill details section
    msg += `*BILL DETAILS:*\n`;
    msg += `💵 *Subtotal:* Rs ${subtotalFormatted}\n`;
    if (discountAvailable && discountAmount > 0) {
      msg += `🎉 *Discount (${discountPercent}%):* -Rs ${discountFormatted}\n`;
    }
    if (orderType === "Delivery") {
      msg += `🛵 *Delivery Charges:* Rs ${Number(deliveryCharge).toLocaleString()}\n`;
    }
    if (orderType === "DineIn Reservation" && serviceCharge > 0) {
      msg += `🧾 *${serviceChargeLabel}:* Rs ${Number(serviceCharge).toLocaleString()}\n`;
    }
    msg += `💰 *Estimated Total:* *Rs ${totalFormatted}*\n`;

    // Estimated time section — only if available: yes
    if (timeAvailable) {
      msg += `\n${divider}\n`;
      msg += `🕒 *${timeLabel[orderType] || "Estimated Time"}:* ${estTimeStr}\n`;
      if (closingMsg) {
        // Only use the JSON message directly, don't inject the customer's address text
        msg += `${timeEmoji[orderType] || "⏱️"} _${closingMsg} Thank you for choosing ${deliveryConfig.restaurant?.name || "House of Crust"}!_\n`;
      }
    }

    return msg;
  };


  const submitOrder = async () => {
    setStatusMsg(null);
    setFieldErrors({});


    if (cartCount === 0) {
      setStatusType("error");
      setStatusMsg("Please add items to cart");
      return;
    }
    const errors = {};
    if (!customerName.trim()) errors.customerName = "Name is required.";
    if (!customerPhone.trim()) errors.customerPhone = "Phone number is required.";
    // For Delivery: live location AND address/landmark are REQUIRED
    if (orderType === "Delivery") {
      if (!currentCoords) {
        errors.customerAddress = "📍 Live location is required for Delivery. Please tap 'Share Live Location' at the top.";
      } else if (!customerAddress.trim()) {
        errors.customerAddress = "🏠 Landmark or Street address is required even after sharing live location.";
      }
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatusType("error");
      setStatusMsg("Please complete the required fields.");
      return;
    }
    setShowConfirmModal(true); window.history.pushState({modal: "confirm"}, "", window.location.href);;
  };

  const confirmAndSubmitOrder = async () => {
    try {
      setSubmitting(true);
      
      // --- 🔐 Generate Order Verification Code ---
      const orderId = `HOC-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // --- Build Message with Verification Code ---
      let msg = buildOrderMessage("New Order");
      msg += `\n🔐 *Verification Code:* ${orderId}\n`;

      const items = [];
      cartFood.forEach(c => {
        let name = c.item_name || c.name || "Unknown Item";
        if (c.size) name += ` (${c.size})`;
        let price = c.price * c.quantity;
        let mods = [];
        const parentId = c.parentItemId || getParentItemId(c.item_id);
        
        let customizationText = customizations[parentId];
        if (!customizationText) {
          for (const [key, value] of Object.entries(customizations)) {
            if ((key.includes(parentId) || parentId.includes(key)) && value?.trim()) {
              customizationText = value;
              break;
            }
          }
        }
        
        if (customPizzaSauce[parentId]) mods.push(`Sauce: ${customPizzaSauce[parentId]}`);
        if (customPizzaChicken[parentId]) mods.push(`Chicken: ${customPizzaChicken[parentId]}`);
        if (customPizzaToppings[parentId] && customPizzaToppings[parentId].length > 0) mods.push(`Toppings: ${customPizzaToppings[parentId].join(', ')}`);
        if (customizationText?.trim()) mods.push(`Note: ${customizationText.trim()}`);
        
        items.push({
          n: name,
          q: c.quantity,
          c: mods.join(' | '),
          p: price
        });
      });
      cartDeals.forEach(d => {
        items.push({
          n: d.name || d.deal_name || "Deal",
          q: qty["d_" + d.deal_id] || 1,
          p: d.price * (qty["d_" + d.deal_id] || 1)
        });
      });

      const receiptPayload = {
         id: orderId,
         nm: customerName,
         ph: customerPhone,
         ad: customerAddress,
         ty: orderType,
         it: items,
         st: cartTotal,
         dc: deliveryCharge,
         sc: serviceCharge,
         tt: totalWithService,
         dt: new Date().toISOString()
      };

      // Create the short URL payload (for the database and fallback)
      const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(receiptPayload))));
      
      let receiptUrl;
      try {
        // Try to save to Upstash Database for clean URL
        const dbRes = await fetch('/api/save-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, data: receiptPayload })
        });
        const dbData = await dbRes.json();
        
        if (dbData.success) {
          receiptUrl = `${window.location.origin}/receipt/${orderId}`;
        } else {
          // Fallback if DB not configured yet
          receiptUrl = `${window.location.origin}/receipt#${encodedData}`;
        }
      } catch (err) {
        receiptUrl = `${window.location.origin}/receipt#${encodedData}`;
      }

      const headerIcon = orderType === "Delivery" ? "🛵" : orderType.includes("Dine") ? "🍽️" : "🛍️";
      let deliveryText = "";
      if (orderType === "Delivery") {
        if (currentCoords) {
          const mapsUrl = `${deliveryConfig.liveLocation?.googleMapsUrlPrefix || "https://maps.google.com/?q="}${currentCoords.latitude},${currentCoords.longitude}`;
          deliveryText += `Current Location : ${mapsUrl}\n`;
        }
        deliveryText += `📍 *Address:* ${customerAddress}\n`;
      }

      const orderConfig = deliveryConfig.orderTimes[orderType] || { minutes: 30, message: "Your order is being processed. Thank you for choosing House of Crust!" };
      const completionTime = new Date(Date.now() + orderConfig.minutes * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const timeLabel = orderType === "Delivery" ? "Estimated Delivery Time" : orderType === "Pick-UP" ? "Estimated Pick-UP Time" : "Estimated Serving Time";
      
      const shortGreeting = `🍕 *HOUSE OF CRUST — New ${orderType} Received* 🍕
------------------------------------------

*CUSTOMER DETAILS:*
👤 *Name:* ${customerName}
📞 *Phone:* ${customerPhone}
${headerIcon} *Type:* ${orderType}
${deliveryText}------------------------------------------
Bill Reciept :
${receiptUrl}
------------------------------------------
⏰ *${timeLabel}:* ${completionTime}
_${orderConfig.message}_`;

      const wa = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(shortGreeting)}`;      

      // --- Save Cart to Local Storage for Tamper Evidence ---
      const orderDetails = {
         orderId,
         cartFood,
         cartDeals,
         total: totalWithService,
         date: new Date().toISOString()
      };
      const pastOrders = JSON.parse(localStorage.getItem('hocOrderHistory') || '[]');
      pastOrders.push(orderDetails);
      localStorage.setItem('hocOrderHistory', JSON.stringify(pastOrders));

      // --- Update Spam Timer ---
      localStorage.setItem('hocLastOrderTime', Date.now().toString());
      
      // Save customer info for future use
      const phoneKey = customerPhone.replace(/\D/g, '');
      setSavedCustomers(prev => ({
        ...prev,
        [phoneKey]: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          orderType: orderType,
          lastOrder: new Date().toISOString()
        }
      }));
      localStorage.setItem('kebabishCustomers', JSON.stringify({
        ...savedCustomers,
        [phoneKey]: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          orderType: orderType,
          lastOrder: new Date().toISOString()
        }
      }));
      
      // Increment order count
      const newOrderCount = orderCount + 1;
      setOrderCount(newOrderCount);
      localStorage.setItem('kebabishOrderCount', newOrderCount.toString());
      
      if (cartCount > 0 && orderTime) {
        localStorage.removeItem("orderCart");
        localStorage.removeItem("orderTime");
      }
      
      setTimeout(() => {
        // Clear cart after successful order
        setQty({});
        setInitialQty({});
        setOrderTime(null);
        setCustomizations({});
        setCustomPizzaSauce({});
        setCustomPizzaChicken({});
        setCustomPizzaToppings({});
        
        setSubmitting(false);
        setShowConfirmModal(false);
        setShowCart(false);
        window.open(wa, "_blank");
      }, 2500);
    } catch (e) {
      setSubmitting(false);
      setStatusType("error");
      setStatusMsg("Failed to connect to WhatsApp.");
    }
  };

  const goToMenuFromCart = () => {
    setShowCart(false);
    setShowConfirmModal(false);
    if (!showMenu) {
      setShowMenu(true);
      window.history.pushState({modal: "menu"}, "", window.location.href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateOrder = async () => {
    if (cartCount === 0) {
      setStatusType("error");
      setStatusMsg("Cart is empty.");
      return;
    }
    try {
      setSubmitting(true);
      const msg = buildOrderMessage("Update Order");
      const wa = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
      window.open(wa, "_blank");
      setStatusType("success");
      setStatusMsg(editable ? "✅ Order update prepared for WhatsApp" : "✅ Items prepared for WhatsApp");
      if (editable) setOrderTime(new Date());
      setInitialQty({ ...qty });
    } catch {
      setStatusType("error");
      setStatusMsg("❌ Failed to prepare WhatsApp update.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = () => {
    setQty({});
    setInitialQty({});
    setOrderTime(null);
    setStatusType("error");
    setStatusMsg("❌ Order cleared locally");
  };
  /* ================= BACK TO TOP ================= */
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  /* ================= DARK MODE ================= */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const formatTime = (seconds, originalMin) => {
    const totalSeconds = Math.floor(seconds);
    const useHours = originalMin > 60;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (useHours) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
      return `${m}:${String(s).padStart(2, '0')}`;
    }
  };
  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-sky-500/30 text-sky-700 rounded px-0.5 font-bold">{part}</span> 
        : part
    );
  };

  /* ================= UI ================= */
  if (loading || isPreparingMenu) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 text-heading">
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Elegant single spinning ring in primary color */}
            <div className="absolute inset-0 rounded-full border-[3px] border-secondary/10 border-t-primary animate-spin" style={{ animationDuration: '1s' }} />
            
            {/* Center logo */}
            <div className="relative z-10 flex items-center justify-center w-20 h-20 overflow-hidden rounded-full p-1 bg-white shadow-lg border-2 border-red-500">
              <img src={logo} alt="House Of Crust" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          <p className="text-sm font-medium text-secondary uppercase tracking-[0.2em] animate-pulse">
            Preparing Menu...
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-heading">
        <div className="text-xl sm:text-2xl font-bold text-red-500">Error: {error}. Please try refreshing.</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-24 text-heading">
      <div className="max-w-7xl mx-auto px-2 py-2 sm:px-4 sm:py-3">
        <div className="mb-2 sm:mb-3 border-b border-secondary/20 pb-2 sm:pb-3">
          <div className="flex justify-center w-full">
            <div className="flex flex-col items-center gap-1 sm:gap-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:scale-95 select-none w-full" onClick={goHome}>
              <div className="flex items-center justify-center gap-3 sm:gap-4 w-full relative">
                {showMenu && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); goHome(); }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-black hover:text-red-600 transition-colors z-20"
                    aria-label="Go back to Home"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </button>
                )}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-red-500 shadow-md shrink-0 bg-white">
                  <img src={logo} alt="House Of Crust Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-red-700 font-black text-2xl sm:text-4xl tracking-tight">House</span>
                  <span className="text-gray-700 font-black text-2xl sm:text-4xl tracking-tight">&#160;Of&#160;</span>
                  <span className="text-yellow-600 font-black text-2xl sm:text-4xl tracking-tight">Crust</span>
                </div>
              </div>
            </div>
          </div>
          {/* Discount Offer + Order Type — shown only in menu view */}
          {showMenu && (
            <div className="flex items-center justify-between w-full mt-2 gap-2 px-1">
              {/* Left: Discount label */}
              {discountAvailable ? (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-400/30 rounded-md px-2 py-0.5">
                  <span className="text-xs">🎉</span>
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 text-[11px] sm:text-xs tracking-wide">{discountConfig.label || `Get ${discountPercent}% Off on All Orders!`}</span>
                </div>
              ) : <div />}
              {/* Right: Order Type selector */}
              <div className="relative">
                <select
                  value={orderType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setOrderType(newType);
                    setLocationStatus("");
                    setFieldErrors((prev) => ({ ...prev, customerAddress: undefined }));
                  }}
                  className="appearance-none bg-white border-2 border-red-300 rounded-lg pl-3 pr-8 py-1.5 text-xs sm:text-sm font-bold text-heading shadow-md hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer transition-all w-[140px] sm:w-[160px]"
                >
                  <option value="Delivery">🚚 Delivery</option>
                  <option value="Pick-UP">🛍️ Pick-UP</option>
                  <option value="DineIn Reservation">🍽️ Dine-In</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-red-600">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          )}
        </div>
        {!showMenu && (
          <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner & Logo Overlay */}
            <div className="relative w-full rounded-3xl overflow-visible mb-16">
              <img src={bannerImg} alt="Banner" className="w-full h-48 sm:h-80 object-cover rounded-3xl shadow-lg" />
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-10">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mt-6 mb-8">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="text-[#CC0000] font-black text-5xl sm:text-7xl leading-none drop-shadow-sm">House</span>
                <span className="text-gray-800 font-black text-5xl sm:text-7xl leading-none">&#160;Of&#160;</span>
                <span className="text-[#D4A017] font-black text-5xl sm:text-7xl leading-none drop-shadow-sm">Crust</span>
              </div>
              <p className="mt-5 text-lg sm:text-2xl font-black text-red-700 tracking-[0.15em] uppercase">✦ Har Bite Mein Mohabbat ✦</p>
              {discountAvailable && (
                <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-full shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                  <span className="text-lg">🎉</span>
                  <span className="font-extrabold text-sm sm:text-base tracking-wide">{discountConfig.bannerText || `Get ${discountPercent}% Off`}</span>
                </div>
              )}
            </div>

            {/* Hero Section (Image) */}
            <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl mb-12 border-4 border-[#CC0000]/20 bg-black">
              <img 
                src={heroImg} 
                alt="House of Crust Hero"
                className="w-full h-[400px] sm:h-[500px] object-cover opacity-90 scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
            </div>

            
            <div className="text-center px-4 mb-16 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-red-900 leading-tight mb-4">Authentic Taste, Unforgettable Moments</h2>
              <p className="text-gray-800 text-lg md:text-xl font-medium leading-relaxed">Experience the true essence of Pakistani dining. We bring you hand-crafted flavors, rich spices, and a welcoming environment perfect for sharing meals with your loved ones.</p>
            </div>

            {/* Sitting Area */}
            <div className="flex flex-col md:flex-row items-center gap-8 py-12">
              <div data-reveal="left" className="reveal-item reveal-left flex-1 space-y-6 order-2 md:order-1">
                <h2 className="text-4xl md:text-5xl font-black text-red-900 leading-tight">Comfortable Dine-In Experience</h2>
                <p className="text-gray-800 text-xl font-medium leading-relaxed">Enjoy your meal in our beautifully designed seating area. Whether you are coming with friends or family, our cozy ambiance guarantees a wonderful dining experience.</p>
              </div>
              <div className="flex-1 w-full order-1 md:order-2">
                <img data-reveal="right" src={sittingImg} alt="Sitting Area" loading="lazy" decoding="async" className="reveal-item reveal-right w-full h-80 object-cover rounded-3xl shadow-2xl transition-transform duration-700 hover:scale-[1.03]" />
              </div>
            </div>

            {/* Birthday Party */}
            <div className="flex flex-col md:flex-row items-center gap-8 py-12">
              <div className="flex-1 w-full">
                <img data-reveal="left" src={birthdayPartyImg} alt="Birthday Party" loading="lazy" decoding="async" className="reveal-item reveal-left w-full h-80 object-cover rounded-3xl shadow-2xl transition-transform duration-700 hover:scale-[1.03]" />
              </div>
              <div data-reveal="right" className="reveal-item reveal-right flex-1 space-y-6">
                <h2 className="text-4xl md:text-5xl font-black text-red-900 leading-tight">Celebrate with Us</h2>
                <p className="text-gray-800 text-xl font-medium leading-relaxed">Make your special occasions memorable. We offer tailored arrangements for birthdays and gatherings, ensuring a fun-filled and delicious celebration.</p>
              </div>
            </div>

            {/* Busy Restaurant */}
            <div className="flex flex-col md:flex-row items-center gap-8 py-12">
              <div data-reveal="left" className="reveal-item reveal-left flex-1 space-y-6 order-2 md:order-1">
                <h2 className="text-4xl md:text-5xl font-black text-red-900 leading-tight">The Heart of the City</h2>
                <p className="text-gray-800 text-xl font-medium leading-relaxed">Join the buzz at House of Crust. Our energetic atmosphere and top-notch service make us the favorite spot for food lovers to connect and enjoy amazing food.</p>
              </div>
              <div className="flex-1 w-full order-1 md:order-2">
                <img data-reveal="right" src={busyRestaurantImg} alt="Busy Restaurant" loading="lazy" decoding="async" className="reveal-item reveal-right w-full h-80 object-cover rounded-3xl shadow-2xl transition-transform duration-700 hover:scale-[1.03]" />
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-16 bg-gradient-to-br from-red-950 to-red-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-8 border-b-8 border-red-600">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-5">
                  <img src={logo} alt="Logo" className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-md object-cover" />
                  <div>
                    <h3 className="text-2xl font-black text-yellow-400 tracking-wide">House of Crust</h3>
                    <p className="text-sm font-semibold text-red-200 mt-1 uppercase tracking-widest">Har Bite Mein Mohabbat</p>
                  </div>
                </div>
                {/* Social Links - driven by deliveryConfig available yes/no */}
                <div className="flex items-center gap-3 mt-2 justify-center md:justify-start">
                  {deliveryConfig.socialLinks?.instagram?.available === "yes" && (
                    <a href={deliveryConfig.socialLinks.instagram.url} target="_blank" rel="noopener noreferrer" title="Instagram" className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-full hover:scale-110 transition-transform shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                  )}
                  {deliveryConfig.socialLinks?.tiktok?.available === "yes" && (
                    <a href={deliveryConfig.socialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" title="Threads / TikTok" className="bg-black p-2.5 rounded-full hover:scale-110 transition-transform shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                    </a>
                  )}
                  {deliveryConfig.socialLinks?.facebook?.available === "yes" && (
                    <a href={deliveryConfig.socialLinks.facebook.url} target="_blank" rel="noopener noreferrer" title="Facebook" className="bg-blue-600 p-2.5 rounded-full hover:scale-110 transition-transform shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                  )}
                </div>
              </div>
              <div className="text-center md:text-right space-y-3">
                <p className="font-bold flex items-center justify-center md:justify-end gap-2 text-lg">
                  <span>📞</span> 0304-4322333  <br />0305-4322333
                </p>
                <p className="text-sm font-medium text-red-100 max-w-sm flex items-start justify-center md:justify-end gap-2 leading-relaxed">
                  <span className="mt-1">📍</span> Dewan Wali Pulli Civil Hospital Road, Near Allama Iqbal Town Gate N0-1 Bahawalpur.
                </p>
              </div>
            </footer>
          </div>
        )}
        {showMenu && (
          <div ref={menuSectionRef} className="block animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="flex gap-2 md:gap-4 lg:gap-6">
          {/* ========== MAIN CONTENT ========== */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">

            {/* Search Bar + Categories - FIXED sticky at top */}
            <div className="sticky top-0 z-30 bg-background -mx-2 px-2 sm:-mx-4 sm:px-4 shadow-sm will-change-transform transform-gpu pb-1.5 border-b border-secondary/10">
              {/* Search Bar */}
              <div className="relative mb-1.5 pt-1">
                <input 
                  type="text"
                  placeholder="Search items or categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border-2 border-secondary/30 rounded-md py-2 px-5 text-sm sm:text-base text-heading font-medium focus:outline-none focus:border-red-500 shadow-sm pr-10"
                />
                {search && (
                  <button 
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>

            {/* Categories scrollable rows */}
            <div className="">
              <div className="overflow-x-auto pb-1 no-scrollbar">
                <div className="flex flex-col gap-1.5 w-max">
                  {categoryRows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="flex gap-1.5">
                      {row.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            if (["Deals", "Family Deals", "Midnight Deals", "Platters"].includes(cat)) {
                              setActiveTab("offers");
                              setActiveCategory(cat);
                            } else {
                              setActiveTab("food");
                              setActiveCategory(cat === "All" ? "All" : cat);
                            }
                            requestAnimationFrame(() => {
                              document.getElementById(`cat-${cat.replace(/\s+/g, "-").toLowerCase()}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                            });
                          }}
                          className={`w-auto px-4 py-2 md:px-5 md:py-2.5 rounded-md text-[12px] sm:text-sm md:text-base font-extrabold tracking-wide transition-all duration-200 text-center whitespace-nowrap shadow-sm ${
                            activeNav === cat
                              ? 'bg-gradient-to-r from-red-900 to-red-500 text-white shadow-lg border-0'
                              : 'bg-card text-black border border-secondary/30 hover:border-red-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-red-900 hover:to-red-500'
                          }`}
                        >
                          {highlightText(cat, search)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          {/* FOOD */}
          {activeTab === "food" && (
            <div className="space-y-8 sm:space-y-12">
              {visibleCategories.map((cat) => {
                if (cat === "Beverages") {
                  return (
                    <section key={cat} className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-red-400/30 pb-2.5 w-full">
                        <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">Beverages</h2>
                        <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-600 text-xs font-bold uppercase tracking-wider">Refreshing</span>
                      </div>
                      
                      <div className="w-full max-w-3xl mx-auto overflow-hidden rounded-md border-2 border-red-400/30 bg-card shadow-lg transition duration-300">
                        <div className="relative h-48 sm:h-64 w-full bg-white">
                          <img src="https://res.cloudinary.com/do3pfwdv5/image/upload/w_700,q_auto,f_auto,dpr_auto/v1780717392/Beverages_hpb0oc.avif" alt="Beverages" loading="lazy" className="w-full h-full object-cover object-center" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">Cold Drinks & Water</h2>
                          </div>
                        </div>
                        
                        <div className="p-4 sm:p-6 bg-gradient-to-b from-card to-secondary/5">
                          <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-secondary/10">
                            <table className="w-full text-left border-collapse min-w-[340px]">
                              <thead>
                                <tr className="border-b-2 border-secondary/20 bg-slate-50/50">
                                  <th className="py-2 px-1 font-black text-red-900 w-[24%] text-xs sm:text-sm">Brand</th>
                                  {["Buddy", "Half Liter", "1 Liter", "1.5 Liter"].map(s => (
                                    <th key={s} className="py-2 px-0.5 text-center font-black text-red-800 text-xs sm:text-sm">{s}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const knownSizes = ["Buddy", "Half Liter", "1 Liter", "1.5 Liter"];
                                  const bevItems = menu.filter(m => m.category === "Beverages" && m.active === "yes");
                                  
                                  const brandsSet = new Set();
                                  const itemsByBrandSize = {};
                                  
                                  bevItems.forEach(m => {
                                    let brandName = m.item_name;
                                    let itemSize = "";
                                    for (const s of knownSizes) {
                                      if (brandName.endsWith(s)) {
                                        itemSize = s;
                                        brandName = brandName.substring(0, brandName.length - s.length).trim();
                                        break;
                                      }
                                    }
                                    if (!itemSize) return;
                                    brandsSet.add(brandName);
                                    
                                    if (!itemsByBrandSize[brandName]) itemsByBrandSize[brandName] = {};
                                    itemsByBrandSize[brandName][itemSize] = m;
                                  });
                                  
                                  const brandsList = Array.from(brandsSet).sort();
                                  
                                  return brandsList.map((brand, idx) => (
                                    <tr key={brand} className={`${idx !== brandsList.length - 1 ? 'border-b border-secondary/10' : ''} hover:bg-slate-50 transition-colors group`}>
                                      <td className="py-2 px-1 font-black text-heading text-xs sm:text-sm whitespace-nowrap border-r border-secondary/5">{brand}</td>
                                      {knownSizes.map(s => {
                                        const m = itemsByBrandSize[brand]?.[s];
                                        if (!m) return <td key={s} className="py-2 px-0.5 text-center text-secondary/40 text-[10px] font-semibold border-r border-secondary/5 last:border-r-0">-</td>;
                                        
                                        const id = m.item_id;
                                        const qtyVal = qty[id] || 0;
                                        return (
                                          <td key={s} className="py-2 px-0.5 text-center align-middle border-r border-secondary/5 last:border-r-0">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-800 to-red-500 text-xs sm:text-sm tracking-tight">Rs {m.price}</span>
                                              {qtyVal === 0 ? (
                                                <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`h-6 px-3 rounded-md bg-gradient-to-r from-red-900 to-red-500 text-[9px] sm:text-[10px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 mx-auto block ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>+ Add</button>
                                              ) : (
                                                <div className="flex items-center gap-2 rounded-md border border-secondary/30 bg-white px-2 py-0.5 shadow-sm mx-auto w-max">
                                                  <button onClick={() => changeQty(id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">
                                                    {qtyVal === 1 ? (
                                                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                      </svg>
                                                    ) : "−"}
                                                  </button>
                                                  <span className="w-4 text-center text-[12px] font-black text-heading">{qtyVal}</span>
                                                  <button onClick={() => changeQty(id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">+</button>
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Render Standalone Beverage Items */}
                        {(() => {
                          const knownSizes = ["Buddy", "Half Liter", "1 Liter", "1.5 Liter"];
                          const standaloneItems = menu.filter(m => {
                            if (m.category !== "Beverages" || m.active !== "yes") return false;
                            for (const s of knownSizes) {
                              if (m.item_name.endsWith(s)) return false;
                            }
                            return true;
                          });

                          if (standaloneItems.length === 0) return null;

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 px-4 pb-4">
                              {standaloneItems.map(m => {
                                const id = m.item_id;
                                const qtyVal = qty[id] || 0;
                                return (
                                  <article
                                    key={id}
                                    className="relative flex flex-col bg-card rounded-md shadow-md overflow-hidden border-2 border-red-500/60 hover:shadow-lg transition-all"
                                  >
                                    <div className="relative h-28 sm:h-32 w-full bg-white overflow-hidden">
                                      <img src={m.img_url || beverageData.image_url} alt={m.item_name} loading="lazy" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                        <h3 className="text-sm font-black text-white leading-tight drop-shadow-md">{m.item_name}</h3>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-gradient-to-b from-card to-secondary/5 flex-1 flex flex-col justify-between">
                                      <div className="mb-2 text-center">
                                        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-800 to-red-500 text-sm tracking-tight">Rs {m.price}</span>
                                      </div>
                                      {qtyVal === 0 ? (
                                        <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`w-full py-1.5 rounded-md bg-gradient-to-r from-red-900 to-red-500 text-[11px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 flex items-center justify-center gap-1 ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>
                                          + Add
                                        </button>
                                      ) : (
                                        <div className="flex items-center justify-between bg-white px-1.5 py-0.5 rounded-md border border-secondary/30 shadow-sm mx-auto w-max gap-2">
                                          <button onClick={() => changeQty(id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none shadow-sm transition-colors">
                                            {qtyVal === 1 ? (
                                              <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            ) : "−"}
                                          </button>
                                          <span className="font-black text-heading text-[12px] w-4 text-center">{qtyVal}</span>
                                          <button onClick={() => changeQty(id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none shadow-sm transition-colors">+</button>
                                        </div>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </section>
                  );
                }

                const items = menu.filter(
                  (m) =>
                    m.category === cat &&
                    (m.item_name.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase()))
                );
                if (!items.length) return null;
                return (
                  <div id={`cat-${cat.replace(/\s+/g, "-").toLowerCase()}`} key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b-2 border-sky-400/30 w-full flex-wrap gap-2">
                      <div>
                        {(cat === "Traditional Pizza" || cat === "Premium Special Pizza") && (
                          <p className="text-[10px] uppercase tracking-[0.32em] text-primary font-semibold">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md mb-1 inline-block border border-red-200">
                             
                            </span>
                          </p>
                        )}
                        <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                          {highlightText(cat, search)}
                        </h2>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-500 text-xs font-bold uppercase tracking-wider">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className={`${cat.toLowerCase().includes("pizza") ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"} gap-2.5 sm:gap-4`}>
                      {items.map((m) => {
                        const id = m.item_id;
                        const qtyVal = qty[id] || 0;
                        const imageSrc = m.img_url || m.image || "";
                        const sizeOptions = m.sizeOptions || [];
                        const isPizzaCard = sizeOptions.length > 0;
                        const isAvailable = String(m.available ?? m.active ?? "yes").toLowerCase() !== "no";
                        const inactive = !isAvailable || String(m.active || "").toLowerCase() === "no";
                        return (
                          <div
                            key={id}
                            className={`relative flex flex-col bg-card rounded-md shadow-lg overflow-hidden border-2 border-red-500/60 hover:shadow-xl transition-all ${inactive ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            {isPizzaCard ? (
                              <>
                                <div className="relative h-36 sm:h-44 w-full shrink-0 bg-white overflow-hidden">
                                  {!imgErrors[id] && imageSrc ? (
                                    <img 
                                      src={imageSrc}
                                      alt={m.item_name}
                                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                                      onError={() => setImgErrors(prev => ({...prev, [id]: true}))}
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
                                <div className="p-2 sm:p-3 flex flex-col justify-end border-t border-secondary/15 bg-card z-10">
                                  <div className={`grid gap-1.5 ${sizeOptions.length === 2 ? 'grid-cols-2' : sizeOptions.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                                    {sizeOptions.map((option) => {
                                      const optionQty = qty[option.id] || 0;
                                      return (
                                        <div key={option.id} className="flex flex-col items-center justify-between bg-secondary/5 rounded-xl p-1.5 hover:bg-secondary/10 transition-colors border border-secondary/10">
                                          <div className="text-center w-full mb-1">
                                            <p className="text-[10px] sm:text-[11px] font-black text-heading whitespace-nowrap overflow-hidden text-ellipsis">{option.label}</p>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500">Rs {option.price}</p>
                                          </div>
                                          {optionQty === 0 ? (
                                            <button
                                              type="button"
                                              onClick={() => changeQty(option.id, 1)}
                                              disabled={!editable}
                                              className={`w-full h-7 rounded-md bg-gradient-to-r from-red-900 to-red-500 text-white text-[11px] font-black shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 ${!editable ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                              + Add
                                            </button>
                                          ) : (
                                            <div className="flex items-center gap-1 rounded-md border border-secondary/30 bg-white px-1 py-0.5 shadow-sm mx-auto w-max">
                                              <button onClick={() => changeQty(option.id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-5 h-5 text-sm font-black flex items-center justify-center leading-none">
                                                {optionQty === 1 ? (
                                                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                ) : "−"}
                                              </button>
                                              <span className="w-4 text-center text-[11px] font-black text-heading">{optionQty}</span>
                                              <button onClick={() => changeQty(option.id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-5 h-5 text-sm font-black flex items-center justify-center leading-none">+</button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {m.item_name.toLowerCase().includes("custome") && (
                                    <div className={`mt-2 space-y-2 transition-opacity duration-300 ${!sizeOptions.some(opt => (qty[opt.id] || 0) > 0) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                      {/* Sauce Selection */}
                                      <div>
                                        <label className="text-[10px] font-bold text-secondary mb-1 block">🍅 Select Sauce (choose one):</label>
                                        <div className="flex flex-col gap-1">
                                          {["House of Crust Sauce", "Nawabi Sauce", "Peri Peri Sauce"].map(sauce => (
                                            <label key={sauce} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-[10px] font-semibold border ${customPizzaSauce[id] === sauce ? 'border-red-500 bg-red-50 text-red-700' : 'border-secondary/20 bg-white text-heading hover:border-red-300'}`}>
                                              <input
                                                type="radio"
                                                name={`sauce-${id}`}
                                                value={sauce}
                                                checked={customPizzaSauce[id] === sauce}
                                                onChange={() => setCustomPizzaSauce(prev => ({ ...prev, [id]: sauce }))}
                                                className="accent-red-600"
                                                disabled={!editable}
                                              />
                                              {sauce}
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Chicken Selection */}
                                      <div>
                                        <label className="text-[10px] font-bold text-secondary mb-1 block">🍗 Select Chicken (choose one):</label>
                                        <div className="flex flex-col gap-1">
                                          {["Malai Chicken", "BBQ Chicken", "Special Chicken"].map(chicken => (
                                            <label key={chicken} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-[10px] font-semibold border ${customPizzaChicken[id] === chicken ? 'border-red-500 bg-red-50 text-red-700' : 'border-secondary/20 bg-white text-heading hover:border-red-300'}`}>
                                              <input
                                                type="radio"
                                                name={`chicken-${id}`}
                                                value={chicken}
                                                checked={customPizzaChicken[id] === chicken}
                                                onChange={() => setCustomPizzaChicken(prev => ({ ...prev, [id]: chicken }))}
                                                className="accent-red-600"
                                                disabled={!editable}
                                              />
                                              {chicken}
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Toppings Selection */}
                                      <div>
                                        <label className="text-[10px] font-bold text-secondary mb-1 block">🍕 Select Toppings (multiple allowed):</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          {["Capsicum", "Tomato", "Black olive", "Sweet corn", "Mushroom", "Sausages", "Papproni", "Mayo topping"].map(topping => {
                                            const isSelected = (customPizzaToppings[id] || []).includes(topping);
                                            return (
                                              <label key={topping} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-[9px] sm:text-[10px] font-semibold border ${isSelected ? 'border-red-500 bg-red-50 text-red-700' : 'border-secondary/20 bg-white text-heading hover:border-red-300'}`}>
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={(e) => {
                                                    setCustomPizzaToppings(prev => {
                                                      const currentToppings = prev[id] || [];
                                                      if (e.target.checked) {
                                                        return { ...prev, [id]: [...currentToppings, topping] };
                                                      } else {
                                                        return { ...prev, [id]: currentToppings.filter(t => t !== topping) };
                                                      }
                                                    });
                                                  }}
                                                  className="accent-red-600 w-3 h-3"
                                                  disabled={!editable}
                                                />
                                                {topping}
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      {/* Custom note */}
                                      <div>
                                        <label className="text-[10px] font-bold text-secondary mb-1 block">✏️ Additional Customization:</label>
                                        <input
                                          type="text"
                                          placeholder="Extra cheese, no onions, etc..."
                                          value={customizations[id] || ""}
                                          onChange={(e) => {
                                            setCustomizations(prev => ({ ...prev, [id]: e.target.value }));
                                          }}
                                          onBlur={() => {
                                            localStorage.setItem('kebabishCart', JSON.stringify({ qty, initialQty, orderTime, orderType, customerName, customerPhone, customerAddress, orderTypeSelected, customizations: { ...customizations, [id]: customizations[id] }, customPizzaSauce, customPizzaChicken }));
                                          }}
                                          disabled={!editable}
                                          autoComplete="off"
                                          maxLength="200"
                                          className={`w-full px-3 py-2 rounded-lg text-[11px] font-semibold bg-white border-2 border-sky-400/50 text-heading placeholder-secondary focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all ${!editable ? "opacity-50 cursor-not-allowed bg-secondary/5" : ""}`}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="relative h-36 sm:h-44 w-full shrink-0 bg-white overflow-hidden">
                                  {!imgErrors[id] && imageSrc ? (
                                    <img 
                                      src={imageSrc}
                                      alt={m.item_name}
                                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                                      onError={() => setImgErrors(prev => ({...prev, [id]: true}))}
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-body text-[10px] font-bold">No Image</div>
                                  )}
                                  {inactive && (
                                    <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                                      Unavailable
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col flex-1 p-3 sm:p-4 bg-card border-t border-secondary/15 z-10">
                                  <div className="mb-3">
                                    <h3 className="text-heading text-sm sm:text-base font-black leading-tight line-clamp-2">{highlightText(m.item_name, search)}</h3>
                                  </div>
                                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-secondary/10">
                                    <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500">Rs {m.price}</span>
                                    {qtyVal === 0 ? (
                                      <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`h-8 px-4 rounded bg-gradient-to-r from-red-900 to-red-500 text-[11px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>+ Add</button>
                                    ) : (
                                      <div className="flex items-center gap-2 rounded-md border border-secondary/30 bg-white px-2 py-0.5 shadow-sm">
                                        <button onClick={() => changeQty(id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">
                                          {qtyVal === 1 ? (
                                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          ) : "−"}
                                        </button>
                                        <span className="w-4 text-center text-[12px] font-black text-heading">{qtyVal}</span>
                                        <button onClick={() => changeQty(id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">+</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* OFFERS */}
          {activeTab === "offers" && (
            <div className="space-y-10">
              {(["Deals", "Family Deals", "Midnight Deals"].includes(activeCategory) ? (
                <section key={activeCategory} className="w-full">
                  <div className="mb-4 flex items-end justify-between gap-3 border-b border-secondary/20 pb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.32em] text-primary font-semibold">
                        {activeCategory === "Midnight Deals" ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md mb-1 inline-block border border-red-200">
                            {deliveryConfig.appSettings?.midnightDealsMessage || "🕒 Available from 12 PM - 3 PM & 10:30 PM - 1:30 AM"}
                          </span>
                        ) : "Featured"}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-black text-heading mt-1">{highlightText(activeCategory, search)}</h3>
                    </div>
                      <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-500">{deals.filter((item) => item.deal_category === activeCategory && (item.deal_name.toLowerCase().includes(search.toLowerCase()) || activeCategory.toLowerCase().includes(search.toLowerCase()))).length} item{deals.filter((item) => item.deal_category === activeCategory && (item.deal_name.toLowerCase().includes(search.toLowerCase()) || activeCategory.toLowerCase().includes(search.toLowerCase()))).length > 1 ? "s" : ""}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {deals.filter((item) => item.deal_category === activeCategory && (item.deal_name.toLowerCase().includes(search.toLowerCase()) || activeCategory.toLowerCase().includes(search.toLowerCase()))).map((d) => {
                        const id = "d_" + d.deal_id;
                        const qtyVal = qty[id] || 0;
                        const inactive = d.active?.toLowerCase() === "no";
                        const dealItems = Array.isArray(d.includes) && d.includes.length
                          ? d.includes
                          : (typeof d.items === "string" ? d.items.split(",").map((x) => x.trim()).filter(Boolean) : []);
                        const coverImage = d.image || d.img_url || "";
                        const isExpanded = !!expandedDeals[d.deal_id];

                        return (
                          <article
                            key={d.deal_id}
                            className={`relative flex flex-col overflow-hidden rounded-md border-2 border-red-500/60 bg-card shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${inactive ? "opacity-60 pointer-events-none" : ""}`}
                          >
                            <div className="relative h-36 sm:h-44 w-full shrink-0 bg-white overflow-hidden">
                              {!imgErrors[id] && coverImage ? (
                                <img src={coverImage} alt={d.deal_name} loading="lazy" className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" onError={() => setImgErrors((prev) => ({ ...prev, [id]: true }))} />
                              ) : (
                                <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center text-body text-[10px] font-bold">No Image</div>
                              )}
                              {inactive ? (
                                <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">Unavailable</div>
                              ) : null}
                              <div className="absolute inset-x-0 top-0 p-2.5 sm:p-3">
                                <span className="inline-block rounded-full bg-primary/95 px-3 py-1.5 text-xs font-black text-white shadow-lg">{highlightText(d.deal_name, search)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col flex-1 p-3 sm:p-4 bg-card border-t border-secondary/15 z-10">
                              <div className="mb-3">

                                <div className="flex flex-wrap gap-1.5">
                                  {(isExpanded ? dealItems : dealItems.slice(0, 4)).map((item, idx) => (
                                    <span key={`${d.deal_id}-${idx}`} className="bg-secondary/10 border border-secondary/10 text-heading text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{item}</span>
                                  ))}
                                  {dealItems.length > 4 && (
                                    <button type="button" onClick={(e) => toggleDealExpand(d.deal_id, e)} className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500 px-2 py-1">{isExpanded ? "Show less" : `+ ${dealItems.length - 4} more`}</button>
                                  )}
                                </div>
                              </div>
                              <div className="mt-auto flex items-center justify-between pt-3 border-t border-secondary/10">
                                <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500">Rs {d.deal_price}</span>
                                {qtyVal === 0 ? (
                                  <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`h-8 px-4 rounded bg-gradient-to-r from-red-900 to-red-500 text-[11px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>+ Add</button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-md border border-secondary/30 bg-white px-2 py-0.5 shadow-sm">
                                    <button onClick={() => changeQty(id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">
                                      {qtyVal === 1 ? (
                                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      ) : "−"}
                                    </button>
                                    <span className="w-4 text-center text-[12px] font-black text-heading">{qtyVal}</span>
                                    <button onClick={() => changeQty(id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
              ) : null)}

              {activeCategory === "Platters" ? (
              <section className="w-full">
                <div className="mb-4 flex items-end justify-between gap-3 border-b border-secondary/20 pb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-primary font-semibold">Platters</p>
                    <h3 className="text-xl sm:text-2xl font-black text-heading">{highlightText("Platter Collection", search)}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-500">{platterItems.filter((m) => m.item_name.toLowerCase().includes(search.toLowerCase()) || "Platter Collection".toLowerCase().includes(search.toLowerCase()) || "Platters".toLowerCase().includes(search.toLowerCase())).length} item{platterItems.filter((m) => m.item_name.toLowerCase().includes(search.toLowerCase()) || "Platter Collection".toLowerCase().includes(search.toLowerCase()) || "Platters".toLowerCase().includes(search.toLowerCase())).length > 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {platterItems.filter((m) => m.item_name.toLowerCase().includes(search.toLowerCase()) || "Platter Collection".toLowerCase().includes(search.toLowerCase()) || "Platters".toLowerCase().includes(search.toLowerCase())).map((m) => {
                    const id = m.item_id;
                    const qtyVal = qty[id] || 0;
                    const imageSrc = m.img_url || m.image || "";
                    const inactive = String(m.available ?? m.active ?? "yes").toLowerCase() === "no";
                    const platterIncludes = Array.isArray(m.includes) ? m.includes : [];
                    const isExpanded = !!expandedDeals[id];

                    return (
                      <article
                        key={id}
                        className={`relative flex flex-col overflow-hidden rounded-md border-2 border-red-500/60 bg-card shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${inactive ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        <div className="relative h-36 sm:h-44 w-full shrink-0 bg-white overflow-hidden">
                          {!imgErrors[id] && imageSrc ? (
                            <img src={imageSrc} alt={m.item_name} loading="lazy" className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" onError={() => setImgErrors((prev) => ({ ...prev, [id]: true }))} />
                          ) : (
                            <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center text-body text-[10px] font-bold">No Image</div>
                          )}
                          {inactive && (
                            <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">Unavailable</div>
                          )}
                          <div className="absolute inset-x-0 top-0 p-2.5 sm:p-3">
                            <span className="inline-block rounded-full bg-primary/95 px-3 py-1.5 text-xs font-black text-white shadow-lg">{highlightText(m.item_name, search)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col flex-1 p-3 sm:p-4 bg-card border-t border-secondary/15 z-10">
                          <div className="mb-3">
                            <p className="text-[10px] uppercase tracking-[0.32em] text-secondary mb-2 font-bold">Includes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(isExpanded ? platterIncludes : platterIncludes.slice(0, 4)).map((item, idx) => (
                                <span key={`${id}-${idx}`} className="bg-secondary/10 border border-secondary/10 text-heading text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{item}</span>
                              ))}
                              {platterIncludes.length === 0 && <span className="text-secondary text-xs italic">See description</span>}
                              {platterIncludes.length > 4 && (
                                <button type="button" onClick={(e) => toggleDealExpand(id, e)} className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500 px-2 py-1">{isExpanded ? "Show less" : `+ ${platterIncludes.length - 4} more`}</button>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3 border-t border-secondary/10">
                            <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-900 to-red-500">Rs {m.price}</span>
                            {qtyVal === 0 ? (
                              <button onClick={() => changeQty(id, 1)} disabled={!editable} className={`h-8 px-4 rounded bg-gradient-to-r from-red-900 to-red-500 text-[11px] font-black text-white shadow-sm hover:from-red-800 hover:to-red-400 transition-all active:scale-95 ${!editable ? "cursor-not-allowed opacity-50" : ""}`}>+ Add</button>
                            ) : (
                              <div className="flex items-center gap-2 rounded-md border border-secondary/30 bg-white px-2 py-0.5 shadow-sm">
                                <button onClick={() => changeQty(id, -1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">
                                  {qtyVal === 1 ? (
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  ) : "−"}
                                </button>
                                <span className="w-4 text-center text-[12px] font-black text-heading">{qtyVal}</span>
                                <button onClick={() => changeQty(id, 1)} disabled={!editable} className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none">+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
              ) : null}
            </div>
          )}
          </div>
        </div>
      </div>
      )}
            {/* CART FULL PAGE */}
      {showCart && (
        <div className="fixed inset-0 bg-background z-[100] flex flex-col w-full h-full" onClick={goToMenuFromCart}>
          <div
            className="bg-card w-full max-w-xl mx-auto flex flex-col h-full sm:h-auto sm:max-h-screen sm:my-4 sm:rounded-[28px] sm:border sm:border-secondary/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── PINNED: Header ── */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md flex items-center px-4 py-3 flex-shrink-0 border-b border-secondary/20 z-10 shadow-sm sm:rounded-t-[28px]">
              
              {/* CROSS BUTTON */}
              <button 
                onClick={goToMenuFromCart}
                className="absolute left-4 p-1.5 bg-gray-100 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all z-20 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="flex items-center justify-between w-full max-w-[220px] relative mt-1">
                   {/* Progress Line */}
                   <div className="absolute left-[10%] right-[10%] top-[12px] h-[3px] bg-gray-200 z-0 rounded-full"></div>
                   <div className={`absolute left-[10%] top-[12px] h-[3px] bg-gray-900 z-0 rounded-full transition-all duration-500 ease-in-out ${showConfirmModal ? 'w-[80%]' : 'w-[40%]'}`}></div>
                   
                   {/* Step 1: Menu */}
                   <div 
                     className="z-10 flex flex-col items-center justify-start w-14 cursor-pointer transition-all active:scale-95"
                     onClick={goToMenuFromCart}
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
                {submitting ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white px-4">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent border-b-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
                      <div className="absolute inset-2 rounded-full border-4 border-yellow-400 border-l-transparent border-r-transparent animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                      <div className="absolute inset-4 bg-red-50 rounded-full flex items-center justify-center">
                        <span className="text-2xl animate-pulse">🍕</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Preparing Order...</h3>
                    <p className="text-sm font-semibold text-gray-500 text-center animate-pulse">Securing your selections and routing to WhatsApp.</p>
                  </div>
                ) : (
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
                    <button onClick={() => setShowConfirmModal(false)} disabled={submitting} className="flex-1 py-2.5 rounded-md flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-extrabold text-sm transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back
                    </button>
                      <button onClick={confirmAndSubmitOrder} disabled={submitting} className={`flex-[2] py-2.5 rounded-md flex items-center justify-center gap-2 bg-gradient-to-r from-red-900 to-red-500 text-white font-black text-sm shadow-md transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-red-800 hover:to-red-400 active:scale-[0.98]'}`}>
                        Confirm Order <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                    </div>
                  </div>
                  </>
                )}
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
                            Share Current Location
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
                          Landmark / Address
                          <span className="text-red-500 ml-1">*</span>
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
                          placeholder="Full delivery address or Landmark"
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
                    <div className="divide-y divide-dashed divide-secondary/30 py-0.5">
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
                                <button className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty(m.item_id, -1)} disabled={!editable}>
                                  {m.quantity === 1 ? (
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  ) : "−"}
                                </button>
                                <span className="w-4 text-center text-xs font-black text-heading">{m.quantity}</span>
                                <button className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty(m.item_id, 1)} disabled={!editable}>+</button>
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
                                <button className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty("d_" + d.deal_id, -1)} disabled={!editable}>
                                  {qty["d_" + d.deal_id] === 1 ? (
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  ) : "−"}
                                </button>
                                <span className="w-4 text-center text-xs font-black text-heading">{qty["d_" + d.deal_id]}</span>
                                <button className="bg-black hover:bg-gray-800 text-white rounded-md w-6 h-6 text-base font-black flex items-center justify-center leading-none" onClick={() => changeQty("d_" + d.deal_id, 1)} disabled={!editable}>+</button>
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
                    className="w-full bg-gradient-to-r from-red-900 to-red-500 text-white py-2.5 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:from-red-800 hover:to-red-400 active:scale-[0.98] transition-all disabled:bg-secondary/20 disabled:cursor-not-allowed shadow-md"
                    onClick={submitOrder}
                    disabled={cartCount === 0}
                  >
                    Place Order <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
{createPortal(
        <>
          {cartCount > 0 && !showCart && (
            <div className="fixed bottom-0 left-0 right-0 p-3 z-[2147483647] bg-white/90 backdrop-blur-md border-t border-secondary/20 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => {
                  setShowCart(true); window.history.pushState({modal: "cart"}, "", window.location.href);;
                  if ('vibrate' in navigator) navigator.vibrate(50);
                }}
                className="w-full bg-[#cc0000] text-white rounded-[16px] shadow-lg flex items-center justify-between px-5 py-3.5 hover:bg-[#a30000] active:scale-95 transition-all"
                aria-label="Open Cart"
              >
                <div className="border-[1.5px] border-white/80 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-inner bg-white/10">
                  {cartCount}
                </div>
                <div className="flex flex-col items-center flex-1 -mt-0.5">
                  <span className="font-extrabold text-[15px] tracking-wide drop-shadow-sm">View your cart</span>
                  <span className="text-[11px] font-medium text-white/80 mt-0.5">House Of Crust</span>
                </div>
                <div className="font-extrabold text-[15px] tracking-tight drop-shadow-sm">
                  Rs. {Number(totalWithService).toLocaleString()}
                </div>
              </button>
            </div>
          )}
        </>, document.body
      )}

      {/* ORDER TYPE SELECTION MODAL */}
      {showOrderTypeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] px-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-secondary/20 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center text-heading mb-2">Welcome to House of Crust</h2>
            <p className="text-sm text-body text-center mb-6">How would you like to receive your order today?</p>
            <div className="space-y-3">
              {[
                { type: "Delivery", label: "🚚 Delivery", desc: "Prepared in 30 to 40 minutes and delivery time is about 30 minutes." },
                { type: "Pick-UP", label: "🛍️ Pick-UP", desc: "Ready when you arrive" },
                { type: "DineIn Reservation", label: "🍽️ Dine-In", desc: "Reserve your table" }
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setOrderType(opt.type);
                    setOrderTypeSelected(true);
                    setShowOrderTypeModal(false);
                    
                    setIsPreparingMenu(true);
                    setTimeout(() => {
                      setIsPreparingMenu(false);
                      setShowMenu(true); window.history.pushState({modal: "menu"}, "", window.location.href);;
                      setTimeout(() => {
                        menuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }, 2000);
                    if (opt.type === "Delivery") {
                      setLocationStatus("");
                      getCurrentLocation();
                    }
                  }}
                  className="w-full text-left bg-background border border-secondary/20 p-4 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-heading text-lg group-hover:text-sky-500">{opt.label}</div>
                    <div className="text-xs text-body mt-1">{opt.desc}</div>
                  </div>
                  <svg className="w-5 h-5 text-secondary group-hover:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {createPortal(
        <>
          {/* Floating CTAs - Home Page: Menu/Order Now top right, Install App bottom right — absolutely fixed safely */}
          {!showMenu && (
            <>
              {/* Order Now / Menu button - top right */}
              {!showCart && (
                <button
                  onClick={openMenu}
                className="fixed bg-red-600 text-white px-4 py-2.5 rounded-md shadow-[0_0_20px_rgba(220,38,38,0.7)] hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-red-400 font-extrabold tracking-wide text-sm"
                style={{ zIndex: 2147483647, animation: 'pulse-red 2s infinite', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: '16px', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
              >
                {/* Shopping cart icon or Menu icon */}
                <span className="text-[18px]">{Object.keys(qty || {}).length > 0 ? "📋" : "🛒"}</span>
                {Object.keys(qty || {}).length > 0 ? "Select Menu" : "Select Menu"}
              </button>
              )}
              {/* Install App button - fixed bottom right */}
              {deliveryConfig.appSettings?.showPWAInstallButton === "yes" && !isPWAInstalled && !isInstalling && (
                <button
                  onClick={handleInstallApp}
                  className="fixed bg-blue-600 text-white px-3 py-1.5 rounded shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 font-semibold text-xs border border-blue-400"
                  style={{ zIndex: 2147483647, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', right: '16px', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Install App
                </button>
              )}
            </>
          )}

          {/* Install App button - Menu page: fixed bottom right */}
          {showMenu && deliveryConfig.appSettings?.showPWAInstallButton === "yes" && !isPWAInstalled && !showCart && !isInstalling && (
            <button
              onClick={handleInstallApp}
              className="fixed bg-blue-600 text-white px-3 py-1.5 rounded shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 font-semibold text-xs border border-blue-400"
              style={{ zIndex: 2147483647, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', right: '16px', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Install App
            </button>
          )}

          {/* Installation Progress Bar Fixed at Bottom */}
          {/* Installation Fullscreen Overlay */}
          {isInstalling && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-[2147483647]">
              <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-red-500 max-w-sm w-[90%] mx-auto flex flex-col items-center text-center gap-4">
                <img src="https://res.cloudinary.com/do3pfwdv5/image/upload/v1780941886/houseofcrust_u5fhjt.png" className="w-20 h-20 rounded-full border border-secondary/20 shadow-md animate-pulse" alt="App Logo" />
                <h3 className="text-xl font-black text-gray-900">Installing House of Crust...</h3>
                
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner mt-2 relative">
                  <div className="bg-gradient-to-r from-red-900 to-red-500 h-3 rounded-full transition-all duration-300 ease-out absolute left-0 top-0" style={{ width: `${installProgress}%` }}></div>
                </div>
                <span className="text-sm font-black text-red-600 mt-1">{installProgress}%</span>
                
                {installProgress === 100 && (
                   <div className="text-emerald-500 font-bold flex items-center gap-2 mt-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     Successfully Installed!
                   </div>
                )}
              </div>
            </div>
          )}

          {/* PWA Install Guide Modal (for iOS/Safari) */}
          {showInstallGuide && (
            <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[2147483647] pb-6 px-4 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)}>
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900">Install House of Crust</h3>
                  <button onClick={() => setShowInstallGuide(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                </div>
                <p className="text-sm text-gray-600 mb-5">Add this app to your home screen for a native app experience:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Tap the Share button</p>
                      <p className="text-xs text-gray-500 mt-0.5">On iPhone: tap the <strong>⬆ Share</strong> icon at the bottom of Safari. On Android Chrome: tap <strong>⋮ Menu</strong>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Add to Home Screen</p>
                      <p className="text-xs text-gray-500 mt-0.5">Scroll down and tap <strong>"Add to Home Screen"</strong> then tap <strong>Add</strong>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Launch like a native app</p>
                      <p className="text-xs text-gray-500 mt-0.5">The <strong>House of Crust</strong> icon will appear on your home screen. Open it for a full-screen app experience.</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="mt-5 w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors">
                  Got it!
                </button>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      </div>
    </div>
  );
}
