import React from "react";
import { useLocation } from "react-router-dom";
import { TrendingUp, Package, Users, CreditCard } from "lucide-react";

const pageTitles = {
  "/chef/analytics": "Analytics Dashboard",
  "/chef/add-products": "Add Products",
  "/chef/recipes": "Recipe Details",
  "/chef/upload-videos": "Food Videos",
  "/chef/social-media": "Social Media",
  "/chef/daily-menu": "Daily Menu",
  "/chef/meal-slots": "Meal Slots",
  "/chef/preorders": "Preorders",
  "/chef/delivery-settings": "Delivery Settings",
  "/chef/earnings": "Wallet & Earnings",
  "/chef/orders": "Orders",
};

const HomeChefDashboard = () => {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    for (const [p, t] of Object.entries(pageTitles)) {
      if (path.startsWith(p + "/")) return t;
    }
    return "Analytics Dashboard";
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-[2rem] border border-slate-800/80 bg-[#0b111a] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]"></span>
              Live
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">{getTitle()}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Welcome back, Chef. Monitor orders, menu performance, and earnings from the command center.
              </p>
            </div>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400">
            <TrendingUp className="w-4 h-4" />
            Refresh Stats
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800 bg-[#10151f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition hover:border-emerald-500/30 hover:shadow-emerald-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 shadow-inner shadow-emerald-500/10">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">+12.4%</span>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Total Orders</p>
          <p className="mt-3 text-4xl font-black text-white">0</p>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-[#10151f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition hover:border-blue-500/30 hover:shadow-blue-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300 shadow-inner shadow-blue-500/10">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Active</span>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Menu Items</p>
          <p className="mt-3 text-4xl font-black text-white">0</p>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-[#10151f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition hover:border-cyan-500/30 hover:shadow-cyan-500/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300 shadow-inner shadow-cyan-500/10">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">+8.5%</span>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Earnings</p>
          <p className="mt-3 text-4xl font-black text-white">₹0</p>
        </div>
      </div>
    </div>
  );
};

export default HomeChefDashboard;
