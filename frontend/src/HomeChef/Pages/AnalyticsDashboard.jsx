import React, { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, Users, Star, AlertCircle, Utensils, Package, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    avgRating: 0,
    foodCount: 0,
    productsCount: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    cancelledOrders: 0,
    loading: true,
    error: null,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const chefUserId = user?.user_id || user?.id;
        if (!chefUserId) return;

        const [ordersRes, foodsRes] = await Promise.all([
          api.get("/user-food-orders/chef"),
          api.get("/chef-foods", { params: { chef_user_id: chefUserId } }),
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const revenue = orders.reduce((sum, order) => {
          const amount = parseFloat(order.chef_total_amount || order.total_amount || 0);
          return sum + amount;
        }, 0);

        const allFoods = Array.isArray(foodsRes.data) ? foodsRes.data : [];
        const productsCount = allFoods.filter(item => {
          if (!item.product_type) {
            if (!item.category) return false;
            return String(item.category).toLowerCase().includes('product');
          }
          return item.product_type === 'Food Product';
        }).length;
        const foodCount = allFoods.length - productsCount;

        const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
        const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
        const inProgressOrders = orders.filter(o => !['Delivered', 'Completed', 'Cancelled'].includes(o.status)).length;

        setStats({
          totalOrders: orders.length,
          totalRevenue: revenue,
          totalCustomers: new Set(orders.map(o => o.customer_id)).size,
          avgRating: 4.8,
          foodCount,
          productsCount,
          completedOrders,
          inProgressOrders,
          cancelledOrders,
          loading: false,
          error: null,
        });

        // Sort orders by date descending and get top 5
        const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at || b.ordered_at || 0) - new Date(a.created_at || a.ordered_at || 0));
        setRecentOrders(sortedOrders.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load analytics data",
        }));
      }
    };

    fetchStats();
  }, [user]);

  // Sample data
  const chartData = [
    { date: "Mon", orders: 12, revenue: 3600 },
    { date: "Tue", orders: 19, revenue: 5700 },
    { date: "Wed", orders: 15, revenue: 4500 },
    { date: "Thu", orders: 22, revenue: 6600 },
    { date: "Fri", orders: 30, revenue: 9000 },
    { date: "Sat", orders: 45, revenue: 13500 },
    { date: "Sun", orders: 35, revenue: 10500 },
  ];

  const topItems = [
    { name: "Biryani", value: 35, color: "#10B981" },
    { name: "Butter Chicken", value: 25, color: "#3B82F6" },
    { name: "Paneer Tikka", value: 20, color: "#F59E0B" },
    { name: "Others", value: 20, color: "#8B5CF6" },
  ];

  const statsData = [
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      change: "+12.5%",
      icon: ShoppingCart,
      color: "blue",
    },
    {
      label: "Total Revenue",
      value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      change: "+8.2%",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Customers",
      value: String(stats.totalCustomers),
      change: "+5.3%",
      icon: Users,
      color: "purple",
    },
    {
      label: "Food Count",
      value: String(stats.foodCount),
      change: "Active",
      icon: Utensils,
      color: "yellow",
    },
    {
      label: "Products Count",
      value: String(stats.productsCount),
      change: "Active",
      icon: Package,
      color: "blue",
    },
    {
      label: "Avg Rating",
      value: String(stats.avgRating),
      change: "+0.2",
      icon: Star,
      color: "yellow",
    },
  ];

  const colorMap = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    green: "from-green-50 to-green-100 border-green-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
    yellow: "from-yellow-50 to-yellow-100 border-yellow-200",
  };

  const iconColorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className="space-y-6 pb-12">
      {stats.error && (
        <div className="flex items-center gap-3 rounded-3xl border border-red-500/20 bg-red-50/80 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{stats.error}</span>
        </div>
      )}

      <div className="rounded-4xl border border-slate-200/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/40 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300/90">Chef Dashboard</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Welcome back, chef.</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              See your sales performance, customer trends, stock health, and quick actions in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400">
              Refresh Data
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-400"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {statsData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-white shadow-inner">
                    <Icon className={`w-6 h-6 ${iconColorMap[stat.color]}`} />
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-4xl border border-slate-200/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Performance</h2>
              <p className="mt-1 text-sm text-slate-400">Orders and revenue trends for the selected period.</p>
            </div>
            <div className="rounded-3xl bg-slate-800/80 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-200">
              {timeRange === "week" ? "Last 7 days" : timeRange === "month" ? "Last 30 days" : "This year"}
            </div>
          </div>

            <div className="mt-6 h-85">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />
                <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5, fill: "#3B82F6" }} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: "#10B981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white">Top Selling Items</h3>
            <p className="mt-1 text-sm text-slate-400">Most popular dishes right now.</p>
            <div className="mt-6 space-y-4">
              {topItems.map((item) => (
                <div key={item.name} className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.value}% of sales</p>
                    </div>
                    <div className="h-3.5 w-20 rounded-full bg-slate-800">
                      <div className="h-3.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white">Order Status</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/90 px-4 py-4">
                <span className="text-sm text-slate-300">Delivery Orders</span>
                <span className="text-lg font-black text-emerald-400">{stats.completedOrders}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/90 px-4 py-4">
                <span className="text-sm text-slate-300">In Progress</span>
                <span className="text-lg font-black text-amber-400">{stats.inProgressOrders}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/90 px-4 py-4">
                <span className="text-sm text-slate-300">Cancelled</span>
                <span className="text-lg font-black text-red-400">{stats.cancelledOrders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-4xl border border-slate-200/20 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent Orders</h3>
          <button 
            onClick={() => window.location.href = '/chef/orders'} 
            className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <th className="pb-3 pl-4">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items (Your Products/Foods)</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const chefUserId = user?.user_id || user?.id;
                  // Filter items to only show the ones belonging to this chef if needed
                  // Usually the API /user-food-orders/chef already does this, but we filter to be safe
                  const displayItems = order.items?.filter(i => !i.chef_id || String(i.chef_id) === String(chefUserId)) || [];
                  const chefAmount = parseFloat((order.chef_total_amount ?? order.total_amount) || 0);

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-4 text-sm font-bold text-white">{order.order_id}</td>
                      <td className="py-4 text-sm">{order.customer_name}</td>
                      <td className="py-4 text-sm text-slate-400 max-w-[200px]">
                        <div className="space-y-1">
                          {displayItems.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="truncate">
                              {item.name || item.product_name || "Food item"} <span className="text-emerald-400">x{item.quantity || 1}</span>
                            </p>
                          ))}
                          {displayItems.length > 2 && (
                            <p className="text-[10px] uppercase font-bold text-slate-500">+{displayItems.length - 2} more items</p>
                          )}
                          {displayItems.length === 0 && <p className="italic text-slate-600">No specific items found</p>}
                        </div>
                      </td>
                      <td className="py-4 text-sm font-black text-white">₹{chefAmount.toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          order.status === "Delivered" || order.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : order.status === "Cancelled"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : order.status === "Pending" || order.status === "New Order"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {order.status === "Pending" ? "New Order" : order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-sm text-slate-500 italic">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
