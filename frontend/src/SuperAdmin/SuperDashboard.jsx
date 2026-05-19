import React, { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import {
  Users, Store, ChefHat, Bike, ShoppingBag, DollarSign,
  Clock, Landmark, TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── Fallback chart data ──────────────────────────────────────────────────────
const FALLBACK = {
  cards: {
    totalUsers: 0, totalRestaurants: 0, totalHomeChefs: 0,
    totalDeliveryPartners: 0, totalOrders: 0, totalRevenue: 0,
    pendingApprovals: 0, activeFranchises: 0
  },
  charts: {
    dailyOrders: [
      { date: "Mon", orders: 12 }, { date: "Tue", orders: 19 },
      { date: "Wed", orders: 15 }, { date: "Thu", orders: 22 },
      { date: "Fri", orders: 30 }, { date: "Sat", orders: 45 }, { date: "Sun", orders: 35 }
    ],
    revenueAnalytics: [
      { name: "Jan", revenue: 45000 }, { name: "Feb", revenue: 58000 },
      { name: "Mar", revenue: 64000 }, { name: "Apr", revenue: 78000 },
      { name: "May", revenue: 92000 }, { name: "Jun", revenue: 110000 }
    ],
    userGrowth: [
      { name: "Wk 1", customers: 150, chefs: 10, partners: 20 },
      { name: "Wk 2", customers: 220, chefs: 15, partners: 28 },
      { name: "Wk 3", customers: 310, chefs: 21, partners: 35 },
      { name: "Wk 4", customers: 450, chefs: 30, partners: 45 }
    ],
    ordersByStatus: [
      { status: "Delivered", count: 0 }, { status: "Pending", count: 0 },
      { status: "Cancelled", count: 0 }
    ]
  }
};

const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1b2a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl text-xs text-white">
      <p className="font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="text-emerald-400 font-black ml-1">{typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? `₹${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, trend, positive, gradient, iconBg, delay }) => (
  <div
    className="relative overflow-hidden rounded-3xl p-6 border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group"
    style={{ background: gradient, animationDelay: `${delay}ms` }}
  >
    {/* Glow blob */}
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

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, icon: Icon, iconColor, children }) => (
  <div className="bg-[#0B1120]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-xl">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
      </div>
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SuperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/dashboard-stats");
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
          {[...Array(8)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-80 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const { cards, charts } = data || FALLBACK;

  const statsCards = [
    {
      label: "Total Revenue", icon: DollarSign, positive: true, trend: "+12.4%",
      value: `₹${Number(cards.totalRevenue || 0).toLocaleString()}`,
      gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)",
      iconBg: "#10B981"
    },
    {
      label: "Franchise Owners", icon: Landmark, positive: true, trend: "Active",
      value: cards.activeFranchises,
      gradient: "linear-gradient(135deg,#01140f 0%,#0B1120 100%)",
      iconBg: "#14B8A6"
    },
    {
      label: "Restaurants", icon: Store, positive: true, trend: "+8.5%",
      value: cards.totalRestaurants || 0,
      gradient: "linear-gradient(135deg,#03120f 0%,#0B1120 100%)",
      iconBg: "#06B6D4"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#0a2010 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10B981 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">
              Veetu Rusi Platform
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tight leading-none">
              Super Admin
            </h1>
            <p className="text-xs text-white/30 font-semibold mt-2 uppercase tracking-widest">
              Real-time analytics &amp; global platform controls
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

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((c, i) => (
          <StatCard key={i} delay={i * 60} {...c} />
        ))}
      </div>

      {/* ── Charts removed as per user request ──────────────────── */}
    </div>
  );
};

export default SuperDashboard;
