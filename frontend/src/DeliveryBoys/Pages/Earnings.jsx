import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  DollarSign, TrendingUp, Calendar, Clock, MapPin, User, Phone, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import ChartCard from "../ChartCard";

const Earnings = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/earnings");
      setData(res.data);
    } catch (error) {
      console.error("Earnings fetch error:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Earnings...</p>
      </div>
    );
  }

  const { totals = {}, dailyEarnings = [], recentDeliveries = [] } = data || {};
  const { totalEarnings = 0, todayEarnings = 0, weeklyEarnings = 0 } = totals;

  // Transform daily earnings for chart
  const chartData = dailyEarnings.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: Math.round(d.amount || 0),
    deliveries: d.deliveries
  })).reverse();

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#052e16 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10B981 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">
            Earnings Dashboard
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tight leading-none">
            Your Performance
          </h1>
          <p className="text-xs text-white/30 font-semibold mt-2 uppercase tracking-widest">
            Track earnings and delivery history
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Earnings", value: `₹${Number(totalEarnings).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50", gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)", iconBg: "#10B981" },
          { label: "This Week", value: `₹${Number(weeklyEarnings).toLocaleString()}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)", iconBg: "#3B82F6" },
          { label: "Today", value: `₹${Number(todayEarnings).toLocaleString()}`, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50", gradient: "linear-gradient(135deg,#2e1a05 0%,#0B1120 100%)", iconBg: "#F59E0B" }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="relative overflow-hidden rounded-3xl p-6 border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              style={{ background: card.gradient }}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: card.iconBg }} />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: card.iconBg }}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.18em] mb-2 relative z-10">{card.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tight relative z-10">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <ChartCard title="Daily Earnings Trend" subtitle="Last 14 days" icon={TrendingUp} iconColor="text-emerald-500">
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="99%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 800 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="amount" name="Earnings" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent Deliveries */}
      <div className="table-card rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-lg font-black text-white">Recent Deliveries</h2>
          <p className="text-sm text-slate-400 mt-1 font-bold uppercase tracking-widest">Orders you've completed</p>
        </div>

        {recentDeliveries.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="font-black uppercase tracking-widest text-[10px]">No completed deliveries yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentDeliveries.map((order) => (
                  <tr key={order.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-8 py-4">
                      <p className="font-black text-white">#ORD-0{order.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{order.order_id}</p>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                          {order.customer_name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-bold text-slate-700">{order.customer_name || 'Guest'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-slate-400">{order.customer_phone || 'N/A'}</td>
                    <td className="px-8 py-4">
                      <span className="font-black text-emerald-400">₹{Number(order.total_amount || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-4 text-slate-400">
                      <span className="text-[11px] font-bold">
                        {new Date(order.updated_at).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Link
                        to={`/delivery/orders/${order.id}`}
                        className="p-2.5 text-slate-300 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm border border-white/10 inline-block"
                        title="View Order"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
