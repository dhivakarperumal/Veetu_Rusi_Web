import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ChefHat,
  Bike,
  Users,
  ShoppingBag,
  CreditCard,
  Wallet,
  Landmark,
  Percent,
  Image,
  Bell,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
// AddAreaModal intentionally unused; using dedicated page instead

const navItems = [
  { path: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  // { path: "/superadmin/restaurants", label: "Restaurants", icon: Store },
 
  { path: "/superadmin/franchises", label: "Franchise Owners", icon: Landmark },
  { path: "/superadmin/plans", label: "Subscription Plans", icon: CreditCard },
  { path: "/superadmin/areas", label: "Areas", icon: Activity },
  { path: "/superadmin/users", label: "User Management", icon: Users },
  { path: "/superadmin/orders", label: "Order Management", icon: ShoppingBag },
  { path: "/superadmin/earnings", label: "Wallet & Earnings", icon: Wallet },
  { path: "/superadmin/reviews", label: "All Reviews", icon: MessageSquare },
  
  // { path: "/superadmin/notifications", label: "Notifications", icon: Bell },
  { path: "/superadmin/reports", label: "Reports & Analytics", icon: BarChart3 },
  // { path: "/", label: "Back to Website", icon: Home, exact: true }
];

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  useAuth();
  
  const location = useLocation();

  const isActiveRoute = (item) => {
    const currentPath = location.pathname;
    if (item.exact || item.path === "/") {
      return currentPath === item.path;
    }
    return currentPath === item.path || currentPath.startsWith(item.path + "/");
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col overflow-x-hidden bg-gradient-to-b from-slate-950 via-[#06110f] to-slate-900 border-r border-white/10 shadow-2xl shadow-emerald-900/20 transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-12 top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute left-4 top-48 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-10 bottom-20 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative overflow-hidden px-4 pt-5 pb-5 border-b border-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/5" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-3xl bg-emerald-400/10 border border-emerald-300/10 flex items-center justify-center shadow-2xl shadow-emerald-500/10 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.src = "https://ui-avatars.com/api/?name=VR&background=1B4D22&color=fff";
                }}
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300 mb-1">
                  Platform Control
                </p>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
                  SuperAdmin
                </h1>
              
              </div>
            )}
          </div>

        </div>

        <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                title={item.label}
                onClick={() => isOpen && onClose()}
                className={`group relative flex items-center gap-3 rounded-[1.75rem] px-4 py-3 transition-all duration-200 ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300 shadow-[0_16px_50px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={`absolute left-0 top-1/2 h-10 w-1 rounded-full bg-emerald-400/80 transition-all ${active ? "opacity-100 -translate-x-0" : "opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

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

        

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 z-50 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#061712] text-slate-300 shadow-xl shadow-black/20 transition-all hover:bg-[#0f2f1c] hover:text-emerald-400"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
