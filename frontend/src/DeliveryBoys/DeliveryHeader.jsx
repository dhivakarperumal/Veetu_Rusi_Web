import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Package,
  X,
  AlertTriangle,
  TrendingDown,
  MapPin,
  Share2,
  Clock,
  XCircle,
  Banknote,
  Gift,
  Award,
  Info
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

const pageTitles = {
  "/delivery": "Dashboard",
  "/delivery/orders": "Orders",
  "/delivery/new-orders": "New Orders",
  "/delivery/accepted-orders": "Accepted Orders",
  "/delivery/picked-up-orders": "Picked Up Orders",
  "/delivery/delivered-orders": "Delivered Orders",
  "/delivery/live-tracking": "Live Tracking",
  "/delivery/earnings": "Earnings",
  "/delivery/incentives": "Incentives",
  "/delivery/ratings": "Ratings",
  "/delivery/notifications": "Notifications",
  "/delivery/attendance": "Attendance",
  "/delivery/profile": "Profile",
  "/delivery/settings": "Settings",
};

const Header = ({ onMenuClick, isOnline, lastOnline, toggleOnlineStatus }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState({ today: [], earlier: [] });
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const searchWrapperRef = useRef(null);

  // Low stock state
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const lowStockRef = useRef(null);

  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ✅ CORRECT AUTH VALUES
  const { profileName, role, email, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 350); // wait for animation
    }
  }, [showSearch]);

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }
    return "Dashboard";
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // 1. Fetch real pending orders (New Orders)
      let pendingOrders = [];
      try {
        const response = await api.get("/orders");
        const data = response.data || [];
        pendingOrders = Array.isArray(data)
          ? data.filter(o => o.status?.trim() === "Order Placed" || o.status?.trim() === "New")
          : [];
      } catch (err) {
        console.error("Failed to fetch real orders", err);
      }

      const now = new Date();
      const pastTime = (minutes) => new Date(now.getTime() - minutes * 60000).toISOString();

      // Formulate notification objects
      let allNotifs = pendingOrders.map(o => ({
        id: `ord_${o.id}`,
        type: "New Order",
        title: `Order #ORD-0${o.id}`,
        message: `New order assigned. Pickup from ${o.restaurant_name || 'Restaurant'}`,
        amount: o.total_amount,
        created_at: o.created_at || o.order_date || o.date || new Date().toISOString(),
        read: false,
        rawId: o.id
      }));

      // 2. Add mock notifications for the requested types
      const mockNotifs = [
        {
          id: 'mock_cancel_1',
          type: "Order Cancelled",
          title: "Order #ORD-0123 Cancelled",
          message: "Customer cancelled the order. No action required.",
          created_at: pastTime(15),
          read: false
        },
        {
          id: 'mock_pay_1',
          type: "Payment Received",
          title: "Payment Credited",
          message: "Weekly payout of ₹4,250 has been transferred to your wallet.",
          amount: 4250,
          created_at: pastTime(120),
          read: false
        },
        {
          id: 'mock_bonus_1',
          type: "Bonus Added",
          title: "Weekend Surge Bonus",
          message: "Surge pricing active! Earn extra ₹20 on every delivery today.",
          amount: 20,
          created_at: pastTime(300),
          read: false
        },
        {
          id: 'mock_inc_1',
          type: "Incentives",
          title: "Target Achieved!",
          message: "You completed 15 deliveries today. ₹250 incentive unlocked.",
          amount: 250,
          created_at: pastTime(1440),
          read: true
        },
        {
          id: 'mock_sys_1',
          type: "System Updates",
          title: "App Update Available",
          message: "Version 2.4 is available. Please update the app for better location accuracy.",
          created_at: pastTime(2880),
          read: true
        }
      ];

      allNotifs = [...allNotifs, ...mockNotifs];

      // Sort by date descending
      allNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Get today's date parts in local time
      const todayY = now.getFullYear();
      const todayM = now.getMonth();
      const todayD = now.getDate();

      const isSameDay = (dateValue) => {
        if (!dateValue) return false;
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return false;
        return (d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD);
      };

      const categorized = allNotifs.reduce((acc, notif) => {
        if (isSameDay(notif.created_at)) {
          acc.today.push(notif);
        } else {
          acc.earlier.push(notif);
        }
        return acc;
      }, { today: [], earlier: [] });

      setNotifications(categorized);
      setUnreadCount(allNotifs.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Pre-fetch orders for search on mount
  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        const res = await api.get("/orders");
        setAllOrders(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to preload orders for search", e);
      }
    };
    loadAllOrders();
  }, []);

  // Live search filter
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearchLoading(true);
    const lower = q.toLowerCase().trim();
    const matched = allOrders.filter(o => {
      const orderId = `ORD-0${o.id}`;
      const name = (o.customer_name || "").toLowerCase();
      const phone = (o.customer_phone || "").toLowerCase();
      return (
        orderId.toLowerCase().includes(lower) ||
        String(o.id).includes(lower) ||
        name.includes(lower) ||
        phone.includes(lower)
      );
    }).slice(0, 6);
    setSearchResults(matched);
    setShowSearchResults(true);
    setSearchLoading(false);
  };

  const handleSearchResultClick = (orderId) => {
    navigate(`/delivery/orders/${orderId}`);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Search
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSearchResults(false);
        // If search is open but empty, close the search bar too
        if (showSearch && !searchQuery.trim()) {
          setShowSearch(false);
        }
      }
      
      // Low Stock
      if (lowStockRef.current && !lowStockRef.current.contains(e.target)) {
        setShowLowStock(false);
      }
      
      // Notifications
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      
      // Profile Dropdown
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch, searchQuery]); // Dependencies to check search state

  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    try {
      const res = await api.get("/products");
      const products = Array.isArray(res.data) ? res.data : [];
      const alerts = products.filter(p => {
        const stock = parseInt(p.total_stock ?? p.stock ?? 0);
        return stock <= 10; // low stock threshold
      }).sort((a, b) => {
        const sa = parseInt(a.total_stock ?? a.stock ?? 0);
        const sb = parseInt(b.total_stock ?? b.stock ?? 0);
        return sa - sb; // worst first
      });
      setLowStockItems(alerts);
    } catch (e) {
      console.error("Failed to fetch low stock", e);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
    const interval = setInterval(fetchLowStockProducts, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notif) => {
    if (notif.type === "New Order" && notif.rawId) {
      navigate(`/delivery/orders/${notif.rawId}`);
    } else {
      // Mark as read in a real app, here we just close it
    }
    setShowNotifications(false);
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case "New Order": return { icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      case "Order Cancelled": return { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
      case "Payment Received": return { icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case "Bonus Added": return { icon: Gift, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" };
      case "Incentives": return { icon: Award, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "System Updates": return { icon: Info, color: "text-slate-300", bg: "bg-slate-700/50", border: "border-slate-600/30" };
      default: return { icon: Bell, color: "text-slate-300", bg: "bg-slate-800", border: "border-slate-700" };
    }
  };

  // ✅ Safe values
  const userName = profileName || "Admin";

  const userRole =
    role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "Administrator";

  const handleShareLocation = () => {
    if (!isOnline) {
      toast.error("You must be online to share live location.");
      return;
    }
    const trackingLink = `https://veeturusi.com/track/${userName.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`;
    navigator.clipboard.writeText(trackingLink);
    toast.success("Live location link copied to clipboard!");
  };

  return (
    <header className="sticky top-0 z-30 bg-[#07110f]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.18)]">

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-slate-900/80 text-slate-100 border border-white/10 shadow-sm hover:bg-slate-900 transition-all active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate leading-none">
              {getPageTitle()}
            </h1>
            <p className="hidden sm:block text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-1 opacity-85">
              Delivery Partner Workspace
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* ONLINE STATUS TOGGLE & LAST ONLINE */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <button
              onClick={toggleOnlineStatus}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                isOnline 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-slate-800 text-slate-400 border border-white/10 hover:text-slate-300"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" : "bg-slate-500"}`} />
              {isOnline ? "Online" : "Offline"}
            </button>
            {!isOnline && (
              <span className="text-[9px] text-slate-500 font-bold mt-1 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last: {lastOnline}
              </span>
            )}
          </div>

          {/* SHARE LOCATION */}
          <button
            onClick={handleShareLocation}
            title="Share Live Location"
            className="p-2 rounded-xl bg-slate-900/80 text-blue-400 hover:text-blue-300 hover:bg-slate-900 border border-white/10 shadow-sm transition-all active:scale-95 flex items-center gap-1"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* SEARCH */}
          <div className="relative flex items-center" ref={searchWrapperRef}>
            <div className={`flex items-center transition-all duration-300 overflow-visible ${showSearch ? 'w-56 sm:w-72 opacity-100 mr-2' : 'w-0 opacity-0 pointer-events-none'}`}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  placeholder="Order ID, name, phone..."
                  className="w-full bg-slate-950/90 border border-white/10 rounded-xl pl-9 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-slate-100 transition-all"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-xs text-slate-400 font-bold">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                        <div className="px-4 py-2 bg-slate-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{searchResults.length} Result{searchResults.length > 1 ? 's' : ''} found</p>
                        </div>
                        {searchResults.map(order => (
                          <button
                            key={order.id}
                            onClick={() => handleSearchResultClick(order.id)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-900/80 transition-all text-left group"
                          >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shrink-0 shadow">
                              {(order.customer_name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-black text-slate-100 truncate">{order.customer_name || "Unknown"}</p>
                                <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">ORD-0{order.id}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-bold truncate">{order.customer_phone || "No phone"}</span>
                                <span className="text-[9px] text-slate-300">•</span>
                                <span className="text-[10px] font-black text-emerald-600">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <div>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${order.status === 'Order Placed' ? 'bg-slate-800 text-slate-100 border border-white/10' :
                                order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                                  order.status === 'Cancelled' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                                    'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                }`}>{order.status}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Search className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No orders found</p>
                        <p className="text-[9px] text-slate-300 mt-1">Try name, phone or order ID</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => { setShowSearch(p => !p); if (showSearch) clearSearch(); }}
              className={`p-2 rounded-xl transition-all active:scale-95 border ${showSearch ? 'text-emerald-300 bg-slate-900/80 border-emerald-500/20 shadow-md shadow-emerald-500/10' : 'bg-slate-900/80 text-slate-100 hover:bg-slate-900 border-white/10 shadow-sm'}`}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* LOW STOCK ALERT */}
          <div className="relative" ref={lowStockRef}>
            <button
              onClick={() => { setShowLowStock(p => !p); setShowNotifications(false); }}
              className={`relative p-2 rounded-xl transition-all active:scale-95 border ${showLowStock ? 'bg-amber-500/10 text-amber-300 border-amber-400/20 shadow-md shadow-amber-500/10' : 'bg-slate-900/80 text-slate-100 hover:bg-slate-900 border-white/10 shadow-sm'}`}
              title="Low Stock Alerts"
            >
              <AlertTriangle className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {lowStockItems.length > 9 ? '9+' : lowStockItems.length}
                </span>
              )}
            </button>

            {showLowStock && (
              <div className="absolute right-0 mt-4 w-80 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">

                  {/* Header */}
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">Low Stock</h3>
                    </div>
                    <span className="text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase">
                      {lowStockItems.length} Alert{lowStockItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                    {lowStockItems.length > 0 ? lowStockItems.map(product => {
                      const stock = parseInt(product.total_stock ?? product.stock ?? 0);
                      const isOut = stock <= 0;
                      const img = (product.variants?.[0]?.images?.[0]) ||
                        (product.images?.[0]) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`;
                      return (
                        <button
                          key={product.id}
                          onClick={() => { navigate('/delivery'); setShowLowStock(false); }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50/40 transition-all text-left group"
                        >
                          {/* Product image */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                            <img src={img} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-100 truncate">{product.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">{product.category || product.product_code || '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${isOut ? 'text-red-600' : 'text-amber-600'}`}>
                              {stock}
                            </p>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isOut ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                              {isOut ? 'Out' : 'Low'}
                            </span>
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="px-6 py-10 text-center">
                        <Package className="mx-auto w-10 h-10 opacity-10 mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All stock healthy</p>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/delivery"
                    onClick={() => setShowLowStock(false)}
                    className="block w-full py-3.5 text-center text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] bg-slate-900/80 hover:bg-slate-900 transition-colors border-t border-white/10"
                  >
                    View Delivery Dashboard →
                  </Link>
                </div>
            )}
          </div>

          {/* NOTIFICATION */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(p => !p)}
              className={`relative p-2 rounded-xl transition-all active:scale-95 border ${showNotifications ? 'bg-slate-900/80 text-emerald-300 border-emerald-400/20 shadow-md shadow-emerald-500/10' : 'bg-slate-900/80 text-slate-100 hover:bg-slate-900 border-white/10 shadow-sm'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">

                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90 sticky top-0">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Notifications
                    </h3>
                    <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg uppercase">
                      {unreadCount} Unread
                    </span>
                  </div>

                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {notifications.today?.length > 0 || notifications.earlier?.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {/* Today Section */}
                        {notifications.today?.length > 0 && (
                          <>
                            <div className="px-5 py-2 bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Today</p>
                            </div>
                            {notifications.today.map((notif) => {
                              const style = getNotificationStyle(notif.type);
                              const Icon = style.icon;
                              return (
                                <button
                                  key={notif.id}
                                  onClick={() => handleNotificationClick(notif)}
                                  className={`w-full px-5 py-4 flex items-start gap-4 hover:bg-slate-800/50 transition-all text-left group ${!notif.read ? 'bg-slate-900/40' : 'opacity-80'}`}
                                >
                                  <div className={`w-10 h-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center ${style.color} shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[13px] font-black text-white tracking-tight truncate">{notif.title}</p>
                                      {notif.amount && <p className={`text-[12px] font-black ${style.color}`}>₹{Number(notif.amount).toLocaleString('en-IN')}</p>}
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center justify-between">
                                      <span>{notif.type}</span>
                                      <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        )}

                        {/* Earlier Section */}
                        {notifications.earlier?.length > 0 && (
                          <>
                            <div className="px-5 py-2 bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Earlier</p>
                            </div>
                            {notifications.earlier.map((notif) => {
                              const style = getNotificationStyle(notif.type);
                              const Icon = style.icon;
                              return (
                                <button
                                  key={notif.id}
                                  onClick={() => handleNotificationClick(notif)}
                                  className={`w-full px-5 py-4 flex items-start gap-4 hover:bg-slate-800/50 transition-all text-left group opacity-70 hover:opacity-100`}
                                >
                                  <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center ${style.color} shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[13px] font-black text-white tracking-tight truncate">{notif.title}</p>
                                      {notif.amount && <p className={`text-[12px] font-black text-slate-400`}>₹{Number(notif.amount).toLocaleString('en-IN')}</p>}
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center justify-between">
                                      <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                                      <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center text-slate-400">
                        <Bell className="mx-auto w-12 h-12 opacity-10 mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                          All caught up
                        </p>
                      </div>
                    )}
                  </div>

                  {(notifications.today?.length > 0 || notifications.earlier?.length > 0) && (
                    <Link
                      to="/delivery/orders"
                      onClick={() => setShowNotifications(false)}
                      className="block w-full py-4 text-center text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] bg-slate-900/80 hover:bg-slate-900 transition-colors border-t border-white/10"
                    >
                      View All Manifests
                    </Link>
                  )}
                </div>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowDropdown(p => !p)}
              className={`flex items-center gap-3 px-2 py-1.5 sm:px-3 rounded-2xl transition-all active:scale-95 border ${showDropdown ? 'bg-slate-900/90 border-emerald-400/20 text-white' : 'bg-slate-900/80 border-white/10 text-slate-100 hover:bg-slate-900'}`}
            >
              <div className="w-8 h-8 rounded-xl 
                bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-black text-white">
                  {userName}
                </p>
                <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest opacity-80">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-300
                ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-4 w-52 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden">

                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {email}
                    </p>
                  </div>

                  <Link
                    to="/delivery/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900/80 text-sm text-slate-100 transition font-bold"
                  >
                    <User className="w-4 h-4 opacity-50" /> Profile
                  </Link>

                  <Link
                    to="/delivery/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900/80 text-sm text-slate-100 transition font-bold"
                  >
                    <Settings className="w-4 h-4 opacity-50" /> Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/20 text-sm text-red-300 w-full transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
