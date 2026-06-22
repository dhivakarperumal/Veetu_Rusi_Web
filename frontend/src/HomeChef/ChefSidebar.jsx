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
  Home,
  Tag,
  PlusCircle,
  List,
  Layers,
  Truck,
  XCircle,
  Archive,
  Handshake,
  Video,
  Image,
  Store,
  ChefHat,
  Bike,
  ShoppingBag,
  CreditCard,
  BookOpen,
  Upload,
  Share2,
  Calendar,
  Clock,
  TrendingUp,
  Wallet
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/chef", label: "Dashboard", icon: TrendingUp, exact: true },
  {
    path: "/chef/food",
    label: "Food & Products",
    icon: Package,
    children: [
      // Admin-style inventory links
       { path: "/chef/food/add", label: "Add Food", icon: PlusCircle },
      { path: "/chef/food/all", label: "All Food", icon: Package },
      { path: "/chef/products/all", label: "All Products", icon: List },
      { path: "/chef/products/add", label: "Add Product", icon: PlusCircle },
      { path: "/chef/products/stock", label: "Stock Details", icon: Archive }

      // Chef food management links (kept for backward compatibility)
     
    ]
  },

  {
    path: "/chef/orders",
    label: "Order Mangements",
    icon: Package,
    children: [
      { path: "/chef/orders?status=All", label: "All Orders", icon: List },
      { path: "/chef/orders?status=Pending", label: "New Order", icon: PlusCircle },
      { path: "/chef/orders?status=Accepted", label: "Accept Order", icon: Handshake },
      { path: "/chef/orders?status=Out for Delivery", label: "Delivery Order", icon: Truck },
      { path: "/chef/orders?status=Cancelled", label: "Cancelled Order", icon: XCircle }
    ]
  },

  {
    path: "/chef/products",
    label: "Products",
    icon: Package,
    children: [
      { path: "/chef/products", label: "All Products", icon: List },
      { path: "/chef/categories", label: "Categories", icon: Layers },
      { path: "/chef/products/stock", label: "Stock Details", icon: Archive }
    ]
  },
  { path: "/chef/reviews", label: "Reviews", icon: MessageSquare },
  { path: "/chef/earnings", label: "Wallet & Earnings", icon: Wallet },
  { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const ChefSidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const prefix = location.pathname.startsWith("/superadmin")
    ? "/superadmin"
    : location.pathname.startsWith("/chef")
      ? "/chef"
      : "/admin";

  const getDynamicPath = (path) => {
    if (!path) return path;
    if (path.startsWith("/admin")) {
      return path.replace("/admin", prefix);
    }
    return path;
  };

  /* ================= ACTIVE ROUTE MAP ================= */
  const activeRouteMap = {};

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

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black  lg:hidden
        transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full
        bg-[#071219] border-r border-slate-900/80
        shadow-[0_35px_80px_rgba(0,0,0,0.35)]
        flex flex-col transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-20" : "w-72"}
      `}
      >
        {/* ========== LOGO ========== */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800/70 overflow-hidden">
          <div className="w-11 h-11 rounded-2xl bg-[#0f1216] flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=SP&background=2563EB&color=fff"; }}
            />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400 opacity-80 mb-1">Platform Control</p>
              <h1 className="text-lg font-black text-white tracking-tight">Veetu Rusi</h1>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-2xl text-white/40 hover:bg-slate-800/70 lg:hidden border border-transparent hover:border-slate-700 transition-all"
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
              const isAnyChildActive = isActiveRoute(item);

              return (
                <div key={item.label} className="space-y-2">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      relative w-full flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-200
                      ${isMenuOpen
                        ? "bg-slate-900/80 text-white ring-1 ring-emerald-500/25"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }
                    `}
                  >
                    <span className={`absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full transition-all ${isMenuOpen ? 'bg-emerald-400' : 'bg-transparent'}`} />
                    <Icon className="w-5 h-5 shrink-0 text-emerald-300" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-semibold tracking-wide">{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-white" : ""}`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== SUB MENU ===== */}
                  {!collapsed && (
                    <div
                      className={`ml-4 pl-4 border-l border-slate-800/60 space-y-2 overflow-hidden transition-all duration-300
                      ${isMenuOpen ? "max-h-72 opacity-100 py-2" : "max-h-0 opacity-0"}`}
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
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-3xl text-xs font-semibold transition-all duration-200
                              ${isActive
                                ? "bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                              }
                            `}
                          >
                            <SubIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{sub.label}</span>
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
                  relative flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-200
                  ${isActive
                    ? "bg-slate-900/90 text-white shadow-xl shadow-slate-950/40"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }
                `}
              >
                <span className={`absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full transition-all ${isActive ? 'bg-emerald-400' : 'bg-transparent'}`} />
                <Icon className="w-5 h-5 shrink-0 text-emerald-300" />
                {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== FOOTER / PROFILE ========== */}
        {!collapsed && (
          <div className="p-4 mx-3 mb-6 bg-[#0f141a] rounded-[2rem] border border-slate-800 shadow-inner shadow-slate-950/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-3">Secure Mode</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-sm font-black shadow-sm">
                {profileName?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">{profileName || "Administrator"}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em] mt-1">Live protection enabled</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Monitor menus, orders, and earnings from a secure command center.
            </p>
          </div>
        )}

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-full
            bg-[#0b0d10] border border-slate-800
            shadow-[0_8px_18px_rgba(2,6,23,0.6)]
            items-center justify-center
            text-slate-300 hover:text-white hover:scale-110 transition-all z-50
          "
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""
              }`}
          />
        </button>
      </aside>
    </>
  );
};

export default ChefSidebar;
