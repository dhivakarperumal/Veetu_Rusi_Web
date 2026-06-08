import React, { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import {
  Bike, ShoppingBag, DollarSign,
  Clock, TrendingUp, ArrowUpRight, TrendingDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";

const FALLBACK = {
  cards: {
    totalDeliveries: 0,
    pendingDeliveries: 0,
    totalEarnings: 0,
    todayEarnings: 0
  }
};

const StatCard = ({ icon: Icon, label, value, trend, positive, gradient, iconBg, delay }) => (
  <div
    className="relative overflow-hidden rounded-3xl p-6 border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group"
    style={{ background: gradient, animationDelay: `${delay}ms` }}
  >
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: iconBg }} />

    <div className="flex items-start justify-between mb-5 relative z-10">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: iconBg }}>
        <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${positive
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {trend}
      </span>
    </div>

    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.18em] leading-none mb-2 relative z-10">{label}</p>
    <h3 className="text-3xl font-black text-white tracking-tight relative z-10">{value}</h3>
  </div>
);

const DeliveryDashboard = () => {
  const { profileName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // We will rely on a generic or mocked endpoint for now if the real one isn't available
      const res = await api.get("/delivery/dashboard-stats").catch(() => ({ data: FALLBACK }));
      setData(res.data);
    } catch {
      toast.error("Could not load live stats — showing demo data.");
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const { cards } = data || FALLBACK;

  const statsCards = [
    {
      label: "Total Earnings", icon: DollarSign, positive: true, trend: "Overall",
      value: `₹${Number(cards?.totalEarnings || 0).toLocaleString()}`,
      gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)",
      iconBg: "#10B981"
    },
    {
      label: "Today's Earnings", icon: DollarSign, positive: true, trend: "Today",
      value: `₹${Number(cards?.todayEarnings || 0).toLocaleString()}`,
      gradient: "linear-gradient(135deg,#01140f 0%,#0B1120 100%)",
      iconBg: "#14B8A6"
    },
    {
      label: "Total Deliveries", icon: Bike, positive: true, trend: "Completed",
      value: cards?.totalDeliveries || 0,
      gradient: "linear-gradient(135deg,#03120f 0%,#0B1120 100%)",
      iconBg: "#06B6D4"
    },
    {
      label: "Pending Orders", icon: Clock, positive: false, trend: "Active",
      value: cards?.pendingDeliveries || 0,
      gradient: "linear-gradient(135deg,#2e0d05 0%,#0B1120 100%)",
      iconBg: "#EF4444"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#0a2010 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10B981 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">
              Welcome Back
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tight leading-none">
              {profileName || "Delivery Partner"}
            </h1>
            <p className="text-xs text-white/30 font-semibold mt-2 uppercase tracking-widest">
              Track your deliveries and earnings
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="self-start sm:self-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-lg shadow-emerald-900/40"
          >
            <TrendingUp className="w-4 h-4" /> Refresh Stats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((c, i) => (
          <StatCard key={i} delay={i * 60} {...c} />
        ))}
      </div>

      <div>
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "My Deliveries", icon: Bike, path: "/delivery/orders", gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)", iconBg: "#10B981" },
            { label: "Profile", icon: ShoppingBag, path: "/delivery/profile", gradient: "linear-gradient(135deg,#01140f 0%,#0B1120 100%)", iconBg: "#14B8A6" },
          ].map((item, i) => (
            <Link key={i} to={item.path}
              className="relative overflow-hidden group flex items-center gap-4 p-5 rounded-3xl border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ background: item.gradient }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: item.iconBg }} />

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative z-10" style={{ background: item.iconBg }}>
                <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="relative z-10 flex-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] block mb-0.5">View</span>
                <span className="text-sm font-black text-white uppercase tracking-tight">{item.label}</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors relative z-10" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
