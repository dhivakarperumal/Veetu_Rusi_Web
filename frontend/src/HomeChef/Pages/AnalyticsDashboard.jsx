import React, { useState } from "react";
import { TrendingUp, ShoppingCart, Users, Star } from "lucide-react";
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

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("week");

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

  const stats = [
    {
      label: "Total Orders",
      value: "178",
      change: "+12.5%",
      icon: ShoppingCart,
      color: "blue",
    },
    {
      label: "Total Revenue",
      value: "₹53,400",
      change: "+8.2%",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Customers",
      value: "124",
      change: "+5.3%",
      icon: Users,
      color: "purple",
    },
    {
      label: "Avg Rating",
      value: "4.8",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track your food business performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${colorMap[stat.color]} rounded-2xl p-6 border`}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className={`w-8 h-8 ${iconColorMap[stat.color]}`} />
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Orders & Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "none",
                  borderRadius: "8px",
                  color: "#F1F5F9",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Top Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topItems}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue vs Orders</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" stroke="#64748B" />
            <YAxis stroke="#64748B" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "none",
                borderRadius: "8px",
                color: "#F1F5F9",
              }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-700">New Customers</span>
              <span className="text-xl font-bold text-blue-600">34</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-700">Returning Customers</span>
              <span className="text-xl font-bold text-green-600">90</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Customer Retention Rate</span>
              <span className="text-xl font-bold text-purple-600">72.6%</span>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Order Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-700">Completed</span>
              <span className="text-xl font-bold text-green-600">156</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="text-gray-700">In Progress</span>
              <span className="text-xl font-bold text-yellow-600">18</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Cancelled</span>
              <span className="text-xl font-bold text-red-600">4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
