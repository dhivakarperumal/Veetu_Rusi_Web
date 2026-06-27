import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import {
  FaHome,
  FaBox,
  FaCheckCircle,
  FaShoppingBag,
  FaTruck,
  FaMapMarkerAlt,
  FaWallet,
  FaStar,
  FaBell,
  FaCalendarCheck,
  FaUser,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaTimesCircle,
} from "react-icons/fa";
import { useAuth } from "../PrivateRouter/AuthContext";

const navItems = [
  { path: "/delivery", label: "Dashboard", icon: FaHome, exact: true },
  {
    label: "Orders",
    icon: FaBox,
    children: [
      { path: "/delivery/new-orders", label: "New Orders", icon: FaBox },
      { path: "/delivery/all-orders", label: "All Orders", icon: FaBox },
      { path: "/delivery/accepted-orders", label: "Accepted Orders", icon: FaCheckCircle },
      { path: "/delivery/picked-up-orders", label: "Picked Up Orders", icon: FaShoppingBag },
      { path: "/delivery/delivered-orders", label: "Delivered Orders", icon: FaTruck },
      { path: "/delivery/cancelled-orders", label: "Cancelled Orders", icon: FaTimesCircle },
    ],
  },
  
  { path: "/delivery/earnings", label: "Earnings", icon: FaWallet },
  { path: "/delivery/incentives", label: "Incentives", icon: FaStar },
  { path: "/delivery/ratings", label: "Ratings", icon: FaStar },
  
  { path: "/delivery/attendance", label: "Attendance", icon: FaCalendarCheck },
  
  { path: "/delivery/settings", label: "Settings", icon: FaCog },
];

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState({ Orders: true });

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
        className={`fixed inset-0 z-40 bg-black lg:hidden transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Sidebar Container */}
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
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800/70 overflow-hidden">
          <div className="w-11 h-11 rounded-2xl bg-[#0f1216] flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=VR&background=2563EB&color=fff"; }}
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2.5 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              const isOpenMenu = openMenu[item.label];
              return (
                <div key={item.label} className="space-y-2">
                  <button
                    onClick={() => setOpenMenu(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className={`
                      relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                      ${isOpenMenu
                        ? "bg-slate-900/80 text-white ring-1 ring-emerald-500/25"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }
                    `}
                  >
                    <span className={`absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full transition-all ${isOpenMenu ? 'bg-emerald-400' : 'bg-transparent'}`} />
                    <Icon className="w-5 h-5 shrink-0 text-emerald-300" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-semibold tracking-wide">{item.label}</span>
                        <span className={`text-slate-400 transition-transform duration-200 ${isOpenMenu ? 'rotate-180 text-white' : ''}`}>
                          {isOpenMenu ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                        </span>
                      </>
                    )}
                  </button>

                  {!collapsed && (
                    <div className={`ml-4 pl-4 border-l border-slate-800/60 space-y-2 overflow-hidden transition-all duration-300 ${isOpenMenu ? 'max-h-72 opacity-100 py-2' : 'max-h-0 opacity-0'}`}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`}
                            onClick={() => { if (isOpen) onClose(); }}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActiveRoute(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => { if (isOpen) onClose(); }}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                  ${active
                    ? 'bg-slate-900/90 text-white shadow-xl shadow-slate-950/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                `}
              >
                <span className={`absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full transition-all ${active ? 'bg-emerald-400' : 'bg-transparent'}`} />
                <Icon className="w-5 h-5 shrink-0 text-emerald-300" />
                {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div className="p-4 mx-3 mb-6 bg-[#0f141a] rounded-[2rem] border border-slate-800 shadow-inner shadow-slate-950/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-3">Secure Mode</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-sm font-black shadow-sm">
                {profileName?.charAt(0) || 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">{profileName || 'Delivery Partner'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em] mt-1">Delivery Partner</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Manage deliveries, earnings, and routes from a secure command center.</p>
          </div>
        )}

        {/* Collapse Button */}
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
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
