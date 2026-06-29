import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import {
  Bike, ShoppingBag, DollarSign,
  Clock, TrendingUp, ArrowUpRight, TrendingDown,
  Star, Wallet, CheckCircle, Map, Timer, Percent, Box,
  MapPin, Wifi, WifiOff, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import ChartCard from "./ChartCard";
import { Link } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";

const FALLBACK = {
  cards: {
    ordersToday: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    walletBalance: 0,
    rating: 0,
    acceptanceRate: 0,
    completionRate: 0,
    onlineTime: "0h 0m",
    distanceTravelled: 0,
    activeTrackingCount: 0,
    lastLocation: null
  }
};

// Reverse geocode lat/lng → human-readable area name via OpenStreetMap Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data?.address || {};
    const area =
      addr.suburb || addr.neighbourhood || addr.village ||
      addr.town || addr.city_district || addr.county || "";
    const pincode = addr.postcode || "";
    const displayName =
      [area, addr.city || addr.town || addr.state_district, addr.state]
        .filter(Boolean)
        .join(", ");
    return { location_name: displayName || null, pincode: pincode || null };
  } catch {
    return { location_name: null, pincode: null };
  }
}

const LOCATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

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

  // Live location state
  const [liveLocation, setLiveLocation] = useState(null); // { latitude, longitude, location_name, pincode, updated_at }
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | pushing | success | error | denied
  const locationIntervalRef = useRef(null);

  // ── Push live GPS location to backend ────────────────────────────────────
  const pushLiveLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("pushing");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { location_name, pincode } = await reverseGeocode(latitude, longitude);
          const res = await api.post("/delivery/location/update", {
            latitude, longitude, location_name, pincode
          });
          const now = new Date().toISOString();
          setLiveLocation({ latitude, longitude, location_name, pincode, updated_at: now });
          setLocationStatus("success");
          console.log("📍 Live location pushed:", res.data);
        } catch (err) {
          console.error("Live location push failed:", err);
          setLocationStatus("error");
        }
      },
      (err) => {
        console.warn("Geolocation denied/failed:", err.message);
        setLocationStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  // ── Fetch the last stored location from backend on mount ────────────────
  const fetchStoredLocation = useCallback(async () => {
    try {
      const res = await api.get("/delivery/location");
      if (res.data && (res.data.latitude || res.data.longitude)) {
        setLiveLocation(res.data);
        setLocationStatus("success");
      }
    } catch {
      // Non-critical — location might not exist yet
    }
  }, []);

  // ── Start the 10-minute auto-push cycle ──────────────────────────────────
  useEffect(() => {
    fetchStoredLocation();
    pushLiveLocation(); // Push immediately on mount

    locationIntervalRef.current = setInterval(pushLiveLocation, LOCATION_INTERVAL_MS);

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [pushLiveLocation, fetchStoredLocation]);

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
      "order placed": "bg-blue-500/10 text-blue-200 border border-blue-400/20",
      "new": "bg-blue-500/10 text-blue-200 border border-blue-400/20",
      "assigned": "bg-slate-800 text-slate-200 border border-white/10",
      "packing": "bg-indigo-500/10 text-indigo-200 border border-indigo-500/20",
      "processing": "bg-indigo-500/10 text-indigo-200 border border-indigo-500/20",
      "shipping": "bg-amber-500/10 text-amber-300 border border-amber-500/20",
      "shipped": "bg-amber-500/10 text-amber-300 border border-amber-500/20",
      "picked up": "bg-amber-500/10 text-amber-300 border border-amber-500/20",
      "out for delivery": "bg-cyan-500/10 text-cyan-200 border border-cyan-500/20",
      "delivered": "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20",
      "cancelled": "bg-red-500/10 text-red-300 border border-red-500/20",
      "canceled": "bg-red-500/10 text-red-300 border border-red-500/20",
    };
    return variants[normalized] || "bg-slate-800 text-slate-200 border border-white/10";
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
  const displayCards = { ...FALLBACK.cards, ...(cards || {}) };

  const statsCards = [
    {
      label: "Orders Today", icon: Box, positive: true, trend: "Today",
      value: displayCards.ordersToday ?? 0,
      gradient: "linear-gradient(135deg,#03120f 0%,#0B1120 100%)",
      iconBg: "#3B82F6"
    },
    {
      label: "Completed", icon: CheckCircle, positive: true, trend: "Done",
      value: displayCards.completed ?? 0,
      gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)",
      iconBg: "#10B981"
    },
    {
      label: "Pending Orders", icon: Clock, positive: false, trend: "Active",
      value: displayCards.pending ?? 0,
      gradient: "linear-gradient(135deg,#2e0d05 0%,#0B1120 100%)",
      iconBg: "#EF4444"
    },
    {
      label: "Cancelled", icon: Box, positive: false, trend: "Cancelled",
      value: displayCards.cancelled ?? 0,
      gradient: "linear-gradient(135deg,#3b0000 0%,#0B1120 100%)",
      iconBg: "#DC2626"
    },
    {
      label: "Today's Earnings", icon: DollarSign, positive: true, trend: "Income",
      value: `₹${Number(displayCards.todayEarnings ?? 0).toLocaleString()}`,
      gradient: "linear-gradient(135deg,#01140f 0%,#0B1120 100%)",
      iconBg: "#14B8A6"
    },
    {
      label: "Total Earnings", icon: Wallet, positive: true, trend: "All Time",
      value: `₹${Number(displayCards.totalEarnings ?? 0).toLocaleString()}`,
      gradient: "linear-gradient(135deg,#1e1b4b 0%,#0B1120 100%)",
      iconBg: "#8B5CF6"
    },
    {
      label: "Rating", icon: Star, positive: true, trend: "Score",
      value: `⭐ ${displayCards.rating ?? "N/A"}`,
      gradient: "linear-gradient(135deg,#451a03 0%,#0B1120 100%)",
      iconBg: "#F59E0B"
    },
    {
      label: "Acceptance Rate", icon: Percent, positive: true, trend: "High",
      value: `${displayCards.acceptanceRate ?? 0}%`,
      gradient: "linear-gradient(135deg,#022c22 0%,#0B1120 100%)",
      iconBg: "#059669"
    },
    {
      label: "Completion Rate", icon: Percent, positive: true, trend: "Today",
      value: `${displayCards.completionRate ?? 0}%`,
      gradient: "linear-gradient(135deg,#064e3b 0%,#0B1120 100%)",
      iconBg: "#34D399"
    },
    {
      label: "Online Time", icon: Timer, positive: true, trend: "Active",
      value: displayCards.onlineTime ?? "0h 0m",
      gradient: "linear-gradient(135deg,#172554 0%,#0B1120 100%)",
      iconBg: "#2563EB"
    },
    {
      label: "Distance Travelled", icon: Map, positive: true, trend: "Today",
      value: `${displayCards.distanceTravelled ?? 0} km`,
      gradient: "linear-gradient(135deg,#312e81 0%,#0B1120 100%)",
      iconBg: "#6366F1"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#0a2010 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10B981 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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

            {/* ── Live Location Status Pill ── */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {locationStatus === "pushing" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Updating Location…
                </span>
              )}
              {locationStatus === "success" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981] animate-pulse" />
                  <Wifi className="w-3 h-3" /> Location Live
                </span>
              )}
              {locationStatus === "denied" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-wider">
                  <WifiOff className="w-3 h-3" /> Location Denied
                </span>
              )}
              {locationStatus === "error" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-wider">
                  <WifiOff className="w-3 h-3" /> Location Error
                </span>
              )}
              {liveLocation?.location_name && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-semibold">
                  <MapPin className="w-3 h-3" /> {liveLocation.location_name}
                </span>
              )}
              {liveLocation?.updated_at && (
                <span className="text-[9px] text-white/25 font-semibold uppercase tracking-wider">
                  Updated {new Date(liveLocation.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  &nbsp;· auto-refreshes every 10 min
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start">
            <button
              onClick={pushLiveLocation}
              disabled={locationStatus === "pushing"}
              title="Update my location now"
              className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-lg shadow-cyan-900/40"
            >
              <MapPin className="w-4 h-4" /> {locationStatus === "pushing" ? "Locating…" : "Update GPS"}
            </button>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-lg shadow-emerald-900/40"
            >
              <TrendingUp className="w-4 h-4" /> Refresh Stats
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-tight mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "My Deliveries", icon: Bike, path: "/delivery/all-orders", gradient: "linear-gradient(135deg,#052e16 0%,#0B1120 100%)", iconBg: "#10B981" },
              { label: "Cancelled Orders", icon: ShoppingBag, path: "/delivery/cancelled-orders", gradient: "linear-gradient(135deg,#3b0000 0%,#0B1120 100%)", iconBg: "#DC2626" },
              { label: "Earnings", icon: DollarSign, path: "/delivery/earnings", gradient: "linear-gradient(135deg,#01140f 0%,#0B1120 100%)", iconBg: "#14B8A6" },
              { label: "Profile", icon: ShoppingBag, path: "/delivery/profile", gradient: "linear-gradient(135deg,#1e1b4b 0%,#0B1120 100%)", iconBg: "#8B5CF6" },
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

          {/* Last Known Location from delivery_live_tracking */}
          {displayCards.lastLocation && (
            <div className="mt-4 relative overflow-hidden rounded-3xl p-5 border border-white/5 shadow-xl"
              style={{ background: "linear-gradient(135deg,#0a1f1a 0%,#0B1120 100%)" }}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: "#10B981" }} />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-2">📍 Last Known Location</p>
              <p className="text-white font-bold text-sm">
                {[displayCards.lastLocation.area, displayCards.lastLocation.district, displayCards.lastLocation.pincode].filter(Boolean).join(', ') || 'Location not available'}
              </p>
              {displayCards.lastLocation.latitude && (
                <p className="text-white/40 text-xs mt-1 font-mono">
                  {parseFloat(displayCards.lastLocation.latitude).toFixed(6)}, {parseFloat(displayCards.lastLocation.longitude).toFixed(6)}
                </p>
              )}
              {displayCards.lastLocation.updated_at && (
                <p className="text-white/30 text-[10px] mt-2 uppercase tracking-wider">
                  Updated: {new Date(displayCards.lastLocation.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's Orders Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_#EC4899]" />
            Today's Orders
          </h2>
          <span className="text-xs font-bold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full">
            {todayLoading ? "..." : todayOrders.length} orders
          </span>
        </div>

        {todayLoading ? (
          <div className="bg-slate-950/90 rounded-3xl p-8 flex items-center justify-center h-32 border border-white/10">
            <div className="w-6 h-6 border-3 border-pink-600/20 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : todayOrders.length === 0 ? (
          <div className="bg-slate-950/90 rounded-3xl p-8 text-center border border-white/10">
            <p className="text-slate-400 font-semibold">No orders for today</p>
          </div>
        ) : (
          <div className="bg-slate-950/90 rounded-3xl overflow-hidden shadow-xl shadow-black/20 border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-white/10">
                    <th className="text-left p-4 font-bold text-slate-300 uppercase text-[10px] tracking-wider">Order ID</th>
                    <th className="text-left p-4 font-bold text-slate-300 uppercase text-[10px] tracking-wider">Customer</th>
                    <th className="text-left p-4 font-bold text-slate-300 uppercase text-[10px] tracking-wider">Amount</th>
                    <th className="text-left p-4 font-bold text-slate-300 uppercase text-[10px] tracking-wider">Status</th>
                    <th className="text-left p-4 font-bold text-slate-300 uppercase text-[10px] tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-100">#{order.order_id || order.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 font-semibold">{order.customer_name || "N/A"}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white">₹{Number(order.total_amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(order.status)}`}>
                          {order.status || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-xs font-semibold">
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
