import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  BarChart3,
  X,
  ChevronDown,
  ChevronLeft,
  PlusCircle,
  List,
  Layers,
  Truck,
  XCircle,
  Archive,
  Handshake,
  ChefHat,
  Bike,
  ShoppingBag,
  CreditCard,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  // { path: "/admin/restaurants", label: "Restaurants", icon: Store },
  {
    label: "Home Chefs",
    icon: ChefHat,
    children: [
      { path: "/admin/homechefs", label: "Home Chefs List", icon: List },
      { path: "/admin/homechefs/categories", label: "Category New One", icon: Layers },
    ],
  },
  { path: "/admin/delivery-partners", label: "Delivery Partners", icon: Bike },
  {
    label: "Food Orders",
    icon: ShoppingCart,
    children: [
      { path: "/admin/food-orders/new", label: "New Orders", icon: List },
      { path: "/admin/food-orders/all", label: "All Orders", icon: Archive },
      { path: "/admin/food-orders/delivery", label: "Delivered Orders", icon: Truck },
      { path: "/admin/food-orders/cancelled", label: "Cancelled Orders", icon: XCircle },
    ],
  },
  { path: "/admin/food-products", label: "Food Products", icon: ShoppingBag },
  { path: "/admin/users", label: "User Management", icon: Users },
  { path: "/admin/earnings", label: "Wallet & Earnings", icon: CreditCard },
  { path: "/admin/reviews", label: "Customer Reviews", icon: MessageSquare },
  // { path: "/admin/orders", label: "Order Management", icon: ShoppingBag },
  // { path: "/admin/payouts", label: "Payouts & Earnings", icon: CreditCard },

  {
    label: "Inventory",
    icon: Package,
    children: [
      { path: "/admin/products/all", label: "All Products", icon: List },
      { path: "/admin/products/add", label: "Add Product", icon: PlusCircle },
      { path: "/admin/products/category", label: "Categories", icon: Layers },
      { path: "/admin/products/stock", label: "Stock Details", icon: Archive },
    ],
  },

  {
    label: "Order Management",
    icon: ShoppingCart,
    children: [

      { path: "/admin/orders/new", label: "New Orders", icon: List },
      { path: "/admin/orders/all", label: "All Orders", icon: Archive },
      { path: "/admin/orders/delivery", label: "Delivery Orders", icon: Truck },
      { path: "/admin/orders/cancelled", label: "Cancelled Orders", icon: XCircle },

    ],
  },

  // { path: "/admin/orders/create", label: "Billing", icon: PlusCircle },
  // { path: "/admin/users/all", label: "Customers", icon: Users },
  {
    label: "Dealers",
    icon: Handshake,
    children: [
      { path: "/admin/dealers", label: "Dealers List", icon: List },
      { path: "/admin/invoices/add", label: "New Invoice", icon: PlusCircle },
    ],
  },
  // { path: "/admin/banners", label: "Promotion Banners", icon: Image },
  // { path: "/admin/videos", label: "Showcase Videos", icon: Video },
  // { path: "/admin/reviews", label: "Customer Reviews", icon: MessageSquare },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  // { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const prefix = location.pathname.startsWith("/superadmin") ? "/superadmin" : "/admin";

  const getDynamicPath = (path) => {
    if (!path) return path;
    if (path.startsWith("/admin")) {
      return path.replace("/admin", prefix);
    }
    return path;
  };

  /* ================= HELPERS & LOGIC ================= */
  const isActiveRoute = (item) => {
    const currentPath = location.pathname;
    const itemPath = getDynamicPath(item.path);

    // 1. Strict exact match for root routes to prevent Dashboard/BackHome overlap
    if (itemPath === "/" || itemPath === prefix || item.exact) {
      return currentPath === itemPath;
    }

    // 2. Dropdown parent check: check if any child is perfectly active or a sub-path
    if (item.children) {
      return item.children.some(child => {
        const childPath = getDynamicPath(child.path);
        return currentPath === childPath || currentPath.startsWith(childPath + "/");
      });
    }

    // 3. Normal item check: match exact or match as a parent path (with boundary)
    if (itemPath) {
      return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
    }

    return false;
  };

  /* Dropdown logic - only one open at a time */
  const toggleMenu = (label) => {
    setOpenMenu(prev => prev === label ? null : label);
  };

  useEffect(() => {
    const activeItem = navItems.find(item => item.children && isActiveRoute(item));
    if (activeItem) {
      setOpenMenu(activeItem.label);
    }
  }, [location.pathname]);

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col overflow-x-hidden bg-gradient-to-b from-slate-950 via-[#06110f] to-slate-900 border-r border-white/10 shadow-2xl shadow-emerald-900/20 transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${collapsed ? "w-20" : "w-72"}`}
      >
        {/* ========== LOGO ========== */}
        <div className="relative overflow-hidden px-4 pt-5 pb-5 border-b border-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/5" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-3xl bg-emerald-400/10 border border-emerald-300/10 flex items-center justify-center shadow-2xl shadow-emerald-500/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=VR&background=1B4D22&color=fff"; }}
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300 mb-1">
                  Platform Control
                </p>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
                  Admin
                </h1>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-white/40 hover:bg-white/5 lg:hidden border border-transparent hover:border-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`group relative w-full flex items-center gap-3 rounded-[1.75rem] px-4 py-3 transition-all duration-200 ${isMenuOpen ? "bg-emerald-500/15 text-emerald-300 shadow-[0_16px_50px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className={`absolute left-0 top-1/2 h-10 w-1 rounded-full transition-all ${isMenuOpen ? "opacity-100 -translate-x-0 bg-emerald-400/80" : "opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:-translate-x-0 bg-emerald-400/80"}`} />
                    <Icon className="w-5 h-5 shrink-0" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-bold tracking-wide">{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== SUB MENU ===== */}
                  {!collapsed && (
                    <div
                      className={`ml-4 pl-4 border-l border-white/5 space-y-1 overflow-y-auto hide-scrollbar transition-all duration-300
                      ${isMenuOpen ? "max-h-60 opacity-100 py-1" : "max-h-0 opacity-0"}`}
                    >
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const subPath = getDynamicPath(sub.path);
                        const isActive = location.pathname === subPath;

                        return (
                          <NavLink
                            key={sub.path}
                            to={subPath}
                            onClick={() => isOpen && onClose()}
                            className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-[1.75rem] text-xs font-bold transition-all duration-200 ${isActive ? "bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
                          >
                            <span className={`absolute left-0 top-1/2 h-8 w-1 rounded-full transition-all ${isActive ? "opacity-100 -translate-x-0 bg-emerald-400/80" : "opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:-translate-x-0 bg-emerald-400/80"}`} />
                            <SubIcon className="w-4 h-4 shrink-0" />
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* ===== NORMAL ITEM ===== */
            const isActive = isActiveRoute(item);
            const itemPath = getDynamicPath(item.path);

            return (
              <NavLink
                key={item.path}
                to={itemPath}
                end={item.exact}
                onClick={() => {
                  setOpenMenu(null);
                  if (isOpen) onClose();
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive
                      ? "group relative bg-emerald-500/10 text-emerald-300 shadow-[0_16px_50px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/20"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                    }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm font-bold tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== FOOTER / PROFILE ========== */}
        {!collapsed && (
          <div className="px-4 pb-5 space-y-3">
            <div className="rounded-[2rem] border border-white/10 bg-[#071611]/90 p-4 shadow-2xl shadow-emerald-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 grid place-items-center rounded-2xl bg-slate-900/80 text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-[0.25em]">Secure Mode</p>
                  <p className="text-sm font-black text-white">Live protection enabled</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Manage platform events, monitor approvals, and keep the entire system running smoothly.
              </p>
            </div>
          </div>
        )}

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 z-50 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#061712] text-slate-300 shadow-xl shadow-black/20 transition-all hover:bg-[#0f2f1c] hover:text-emerald-400"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
