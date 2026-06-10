import React, { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import {
  Bike, ShoppingBag, DollarSign,
  Clock, TrendingUp, ArrowUpRight, TrendingDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import ChartCard from "./ChartCard";
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
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);

  useEffect(() => { fetchStats(); fetchChartData(); fetchTodayOrders(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/dashboard-stats").catch(() => ({ data: FALLBACK }));
      setData(res.data);
    } catch {
      toast.error("Could not load live stats — showing demo data.");
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const res = await api.get("/delivery/orders");
      const orders = Array.isArray(res.data) ? res.data : [];

      // Prepare last 7 days map
      const days = 7;
      const map = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        map[key] = { date: label, deliveries: 0, earnings: 0 };
      }

      orders.forEach(order => {
        const created = order.created_at || order.ordered_at || order.date || order.order_date || null;
        if (!created) return;
        const key = new Date(created).toISOString().slice(0, 10);
        if (map[key]) {
          map[key].deliveries += 1;
          const amt = Number(order.total_amount || order.amount || 0) || 0;
          map[key].earnings += amt;
        }
      });

      const chartArr = Object.keys(map).map(k => ({ ...map[k], earnings: Math.round(map[k].earnings) }));
      setChartData(chartArr);
    } catch (err) {
      console.error('Chart load error', err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchTodayOrders = async () => {
    try {
      setTodayLoading(true);
      const res = await api.get("/delivery/orders");
      const orders = Array.isArray(res.data) ? res.data : [];
      
      // Filter for today's orders
      const today = new Date().toISOString().slice(0, 10);
      const todaysOrders = orders.filter(order => {
        const created = order.created_at || order.ordered_at || order.date || order.order_date || null;
        if (!created) return false;
        return new Date(created).toISOString().slice(0, 10) === today;
      });
      
      setTodayOrders(todaysOrders);
    } catch (err) {
      console.error('Today orders fetch error', err);
      setTodayOrders([]);
    } finally {
      setTodayLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toLowerCase().trim();
    const variants = {
      "order placed": "bg-blue-100 text-blue-800 border-blue-200",
      "new": "bg-blue-100 text-blue-800 border-blue-200",
      "assigned": "bg-gray-100 text-gray-800 border-gray-200",
      "packing": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "processing": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "shipping": "bg-amber-100 text-amber-800 border-amber-200",
      "shipped": "bg-amber-100 text-amber-800 border-amber-200",
      "picked up": "bg-amber-100 text-amber-800 border-amber-200",
      "out for delivery": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "cancelled": "bg-red-100 text-red-800 border-red-200",
      "canceled": "bg-red-100 text-red-800 border-red-200",
    };
    return variants[normalized] || "bg-gray-100 text-gray-800 border-gray-200";
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Deliveries & Earnings" subtitle="Last 7 days" icon={TrendingUp} iconColor="text-emerald-500">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="99%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 800 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="deliveries" name="Deliveries" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="earnings" name="Earnings" stroke="#3B82F6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

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

      {/* Today's Orders Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_#EC4899]" />
            Today's Orders
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {todayLoading ? "..." : todayOrders.length} orders
          </span>
        </div>

        {todayLoading ? (
          <div className="bg-white rounded-3xl p-8 flex items-center justify-center h-32 border border-gray-100">
            <div className="w-6 h-6 border-3 border-pink-600/20 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : todayOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 font-semibold">No orders for today</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 font-bold text-gray-700 uppercase text-[10px] tracking-wider">Order ID</th>
                    <th className="text-left p-4 font-bold text-gray-700 uppercase text-[10px] tracking-wider">Customer</th>
                    <th className="text-left p-4 font-bold text-gray-700 uppercase text-[10px] tracking-wider">Amount</th>
                    <th className="text-left p-4 font-bold text-gray-700 uppercase text-[10px] tracking-wider">Status</th>
                    <th className="text-left p-4 font-bold text-gray-700 uppercase text-[10px] tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <span className="font-bold text-gray-800">#{order.order_id || order.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700 font-semibold">{order.customer_name || "N/A"}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-800">₹{Number(order.total_amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(order.status)}`}>
                          {order.status || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600 text-xs font-semibold">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
