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
  Image
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },

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
    label: "Orders",
    icon: ShoppingCart,
    children: [

      { path: "/admin/orders/new", label: "New Orders", icon: List },
      { path: "/admin/orders/all", label: "All Orders", icon: Archive },
      { path: "/admin/orders/delivery", label: "Delivery Orders", icon: Truck },
      { path: "/admin/orders/cancelled", label: "Cancelled Orders", icon: XCircle },

    ],
  },

  { path: "/admin/orders/create", label: "Billing", icon: PlusCircle },
  { path: "/admin/users/all", label: "Customers", icon: Users },
  {
    label: "Dealers",
    icon: Handshake,
    children: [
      { path: "/admin/dealers", label: "Dealers List", icon: List },
      { path: "/admin/invoices/add", label: "New Invoice", icon: PlusCircle },
    ],
  },
  { path: "/admin/banners", label: "Promotion Banners", icon: Image },
  { path: "/admin/videos", label: "Showcase Videos", icon: Video },
  { path: "/admin/reviews", label: "Customer Reviews", icon: MessageSquare },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= ACTIVE ROUTE MAP ================= */
  const activeRouteMap = {
    "/admin/products": ["/admin/products/all", "/admin/products/add", "/admin/products/category"],
    "/admin/orders": ["/admin/orders/all", "/admin/orders/new", "/admin/orders/create", "/admin/orders/delivery", "/admin/orders/cancelled"],
    "/admin/users": ["/admin/users/all"],
  };

  /* ================= HELPERS & LOGIC ================= */
  const isActiveRoute = (item) => {
    const currentPath = location.pathname;

    // 1. Strict exact match for root routes to prevent Dashboard/BackHome overlap
    if (item.path === "/" || item.path === "/admin" || item.exact) {
      return currentPath === item.path;
    }

    // 2. Dropdown parent check: check if any child is perfectly active or a sub-path
    if (item.children) {
      return item.children.some(child =>
        currentPath === child.path || currentPath.startsWith(child.path + "/")
      );
    }

    // 3. Normal item check: match exact or match as a parent path (with boundary)
    if (item.path) {
      return currentPath === item.path || currentPath.startsWith(item.path + "/");
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
        bg-[#0B1120] border-r border-white/5
        
        flex flex-col transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-20" : "w-64"}
      `}
      >
        {/* ========== LOGO ========== */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=SP&background=2563EB&color=fff"; }}
            />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-md font-black text-white tracking-tighter uppercase leading-none">Palace</h1>
              <p className="text-[9px] text-blue-400 font-bold tracking-widest uppercase opacity-70 mt-1">
                Artisan Admin
              </p>
            </div>
          )}

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
              const isAnyChildActive = isActiveRoute(item);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isMenuOpen
                        ? "bg-blue-600/10 text-white ring-1 ring-blue-500/30"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-bold tracking-wide">{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""
                            }`}
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
                        const isActive = location.pathname === sub.path;

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => isOpen && onClose()}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                              ${(location.pathname === sub.path || (sub.path !== "/admin" && location.pathname.startsWith(sub.path)))
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                              }
                            `}
                          >
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

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => {
                  setOpenMenu(null);
                  if (isOpen) onClose();
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
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
          <div className="p-4 mx-3 mb-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 pl-1">System Identity</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-600/40">
                {profileName?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">{profileName || "Administrator"}</p>
                <p className="text-[9px] text-blue-400 font-bold uppercase truncate opacity-70">Master Control</p>
              </div>
            </div>
          </div>
        )}

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full
            bg-white border border-slate-200
            shadow-[0_4px_10px_rgba(0,0,0,0.1)]
            items-center justify-center
            text-slate-500 hover:text-blue-600 hover:scale-110 transition-all z-50
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

export default Sidebar;
