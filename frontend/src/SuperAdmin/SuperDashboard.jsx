import React, { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import {
  Users,
  Store,
  ChefHat,
  Bike,
  ShoppingBag,
  DollarSign,
  Clock,
  Landmark,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const SuperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/dashboard-stats");
      setData(res.data);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      toast.error("Failed to load real-time dashboard analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        {/* Header Skeleton */}
        <div className="h-8 bg-slate-800/20 rounded-lg w-1/4 mb-8"></div>
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-slate-800/10 rounded-3xl border border-black/5"></div>
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="h-96 bg-slate-800/10 rounded-3xl"></div>
          <div className="h-96 bg-slate-800/10 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { cards, charts } = data || {
    cards: {
      totalUsers: 0,
      totalRestaurants: 0,
      totalHomeChefs: 0,
      totalDeliveryPartners: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingApprovals: 0,
      activeFranchises: 0
    },
    charts: {
      dailyOrders: [],
      revenueAnalytics: [],
      userGrowth: [],
      ordersByStatus: []
    }
  };

  // Curated premium palettes
  const COLORS = ["#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

  const statsCards = [
    { label: "Total Revenue", value: `₹${cards.totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+12.4%", positive: true, color: "from-emerald-500/20 to-teal-500/20 text-emerald-400" },
    { label: "Total Orders", value: cards.totalOrders, icon: ShoppingBag, change: "+8.2%", positive: true, color: "from-blue-500/20 to-indigo-500/20 text-blue-400" },
    { label: "Total Users", value: cards.totalUsers, icon: Users, change: "+15.1%", positive: true, color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
    { label: "Total Restaurants", value: cards.totalRestaurants, icon: Store, change: "+4.3%", positive: true, color: "from-amber-500/20 to-orange-500/20 text-amber-400" },
    { label: "Total Home Chefs", value: cards.totalHomeChefs, icon: ChefHat, change: "+6.8%", positive: true, color: "from-rose-500/20 to-red-500/20 text-rose-400" },
    { label: "Delivery Partners", value: cards.totalDeliveryPartners, icon: Bike, change: "+2.1%", positive: true, color: "from-cyan-500/20 to-sky-500/20 text-cyan-400" },
    { label: "Pending Approvals", value: cards.pendingApprovals, icon: Clock, change: "Review", positive: false, color: "from-yellow-500/20 to-amber-500/20 text-yellow-400" },
    { label: "Franchise Owners", value: cards.activeFranchises, icon: Landmark, change: "Active", positive: true, color: "from-teal-500/20 to-emerald-500/20 text-teal-400" }
  ];

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl text-white text-xs">
          <p className="font-black mb-1 uppercase tracking-wider text-white/50">{label}</p>
          {payload.map((pld, index) => (
            <p key={index} className="font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }}></span>
              {pld.name}: <span className="font-black text-emerald-400">{pld.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1B4D22] to-[#0A180E] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">SuperAdmin Dashboard</h2>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-2">
            Real-time analytics and global platform controls
          </p>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-6 rounded-[2.2rem] shadow-xl hover:-translate-y-1 transition-all group duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-tr ${card.color} rounded-2xl flex items-center justify-center text-xl`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span
                className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                  card.positive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {card.change}
              </span>
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest leading-none mb-1">{card.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Analytics (AreaChart) */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Revenue Trends</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Monthly sales & earnings</p>
            </div>
            <TrendingUp className="text-emerald-500 w-5 h-5" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueAnalytics}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} />
                <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Orders (BarChart) */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Daily Orders</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Daily request load</p>
            </div>
            <ShoppingBag className="text-blue-500 w-5 h-5" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} tickLine={false} />
                <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                  {charts.dailyOrders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === charts.dailyOrders.length - 1 ? "#E58B24" : "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth (LineChart) */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">User Acquisition</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Chefs, Partners, & Customers</p>
            </div>
            <Users className="text-purple-500 w-5 h-5" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} />
                <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line type="monotone" dataKey="customers" name="Customers" stroke="#3B82F6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="chefs" name="Home Chefs" stroke="#10B981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="partners" name="Partners" stroke="#F59E0B" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status (PieChart) */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Order Status Distribution</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Share of delivery stages</p>
            </div>
            <Clock className="text-pink-500 w-5 h-5" />
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {charts.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {charts.ordersByStatus.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <div className="min-w-0 leading-none">
                    <p className="text-[10px] font-black text-white/70 truncate uppercase">{item.status || "Pending"}</p>
                    <p className="text-sm font-black text-white mt-1">{item.count}</p>
                  </div>
                </div>
              ))}
              {charts.ordersByStatus.length === 0 && (
                <div className="col-span-2 text-center text-xs text-white/30 italic">No distribution data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;
