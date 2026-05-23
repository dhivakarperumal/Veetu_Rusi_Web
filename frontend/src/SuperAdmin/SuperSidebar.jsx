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
  Landmark,
  Percent,
  Image,
  Bell,
  BarChart3,
  Home,
  ChevronLeft,
  X
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";

const navItems = [
  { path: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  // { path: "/superadmin/restaurants", label: "Restaurants", icon: Store },
 
  { path: "/superadmin/franchises", label: "Franchise Owners", icon: Landmark },
  { path: "/superadmin/commissions", label: "Commissions", icon: Percent },
  // { path: "/superadmin/notifications", label: "Notifications", icon: Bell },
  { path: "/superadmin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { path: "/", label: "Back to Website", icon: Home, exact: true }
];

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName } = useAuth();
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
      {/* Mobile Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-[#0A180E] border-r border-white/5
          flex flex-col transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "w-20" : "w-72"}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0 overflow-hidden">
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
              <h1 className="text-md font-black text-white tracking-tighter uppercase leading-none">
                Veetu Rusi
              </h1>
              <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase opacity-70 mt-1">
                Super Admin
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

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => {
                  if (isOpen) onClose();
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${
                    active
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-bold tracking-wide">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div className="p-4 mx-3 mb-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 pl-1">
              Identity
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-emerald-600/40">
                {profileName?.charAt(0) || "S"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate">
                  {profileName || "Super Admin"}
                </p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase truncate opacity-70">
                  Global Owner
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full
            bg-white border border-slate-200
            shadow-[0_4px_10px_rgba(0,0,0,0.1)]
            items-center justify-center
            text-slate-500 hover:text-emerald-600 hover:scale-110 transition-all z-50
          "
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
