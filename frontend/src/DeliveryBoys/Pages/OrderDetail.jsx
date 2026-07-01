import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiClock,
  FiUser, FiPhone, FiMapPin, FiRefreshCw, FiNavigation,
  FiShoppingBag, FiDollarSign, FiAlertCircle, FiCheck
} from "react-icons/fi";
import { MdOutlineRestaurant } from "react-icons/md";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

/* ─── Status Pipeline ─────────────────────────────────────────────────── */
const PIPELINE = [
  { key: "New Order",                    label: "New Order",               icon: "🆕" },
  { key: "Accepted",                     label: "Accepted",                icon: "✅" },
  { key: "Preparing",                    label: "Preparing",               icon: "👨‍🍳" },
  { key: "Food Ready",                   label: "Food Ready",              icon: "🍱" },
  { key: "Packing",                      label: "Packing",                 icon: "📦" },
  { key: "Searching Delivery Partner",   label: "Searching Delivery",      icon: "🔍" },
  { key: "Delivery Partner Assigned",    label: "Partner Assigned",        icon: "🚴" },
  { key: "Picked Up",                    label: "Picked Up",               icon: "🛵" },
  { key: "Out for Delivery",             label: "Out for Delivery",        icon: "🚚" },
  { key: "Delivered",                    label: "Delivered",               icon: "🎉" },
];

const DELIVERY_STATUSES = ["Picked Up", "Start Ride", "Reached Location", "Waiting for Customer", "Delivered"];

const statusIcons = {
  "Picked Up":            "📦",
  "Start Ride":           "🛵",
  "Reached Location":     "📍",
  "Waiting for Customer": "⏳",
  "Out for Delivery":     "🚚",
  "Delivered":            "✅",
};

const NEXT_STATUS = {
  "Delivery Partner Assigned": "Picked Up",
  "Picked Up":                 "Start Ride",
  "Start Ride":                "Reached Location",
  "Reached Location":          "Waiting for Customer",
  "Waiting for Customer":      "Delivered",
};

const STATUS_COLOR = {
  "New Order":                  "bg-slate-800 text-slate-300 border-slate-700",
  "Accepted":                   "bg-blue-900 text-blue-300 border-blue-700",
  "Preparing":                  "bg-purple-900 text-purple-300 border-purple-700",
  "Food Ready":                 "bg-orange-900 text-orange-300 border-orange-700",
  "Packing":                    "bg-amber-900 text-amber-300 border-amber-700",
  "Searching Delivery Partner": "bg-yellow-900 text-yellow-300 border-yellow-700",
  "Delivery Partner Assigned":  "bg-cyan-950 text-cyan-300 border-cyan-800",
  "Picked Up":                  "bg-sky-950 text-sky-300 border-sky-800",
  "Start Ride":                 "bg-blue-950 text-blue-300 border-blue-800",
  "Reached Location":           "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800",
  "Waiting for Customer":       "bg-amber-950 text-amber-300 border-amber-800",
  "Out for Delivery":           "bg-cyan-950 text-cyan-300 border-cyan-800",
  "Delivered":                  "bg-emerald-950 text-emerald-300 border-emerald-800",
  "Cancelled":                  "bg-red-900 text-red-300 border-red-700",
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const getStatusIndex = (status) => {
  const idx = PIPELINE.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

/* ─── Component ───────────────────────────────────────────────────────── */
const DeliveryOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [distance, setDistance] = useState(null);
  const [distLoading, setDistLoading] = useState(false);

  /* Haversine */
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  /* Geocode delivery address → get distance from current position */
  const computeDistance = async (order) => {
    setDistLoading(true);
    try {
      const { street_address, city, district, state, zip_code } = order;
      const queries = [
        zip_code && state   ? `${zip_code}, ${state}, India`            : null,
        city && state       ? `${city}, ${state}, India`                : null,
        district && state   ? `${district}, ${state}, India`            : null,
        zip_code            ? `${zip_code}, India`                      : null,
        street_address && city ? `${street_address}, ${city}, India`   : null,
      ].filter(Boolean);

      if (!navigator.geolocation) { setDistLoading(false); return; }

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          for (const q of queries) {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`
              );
              const data = await res.json();
              if (data?.length > 0) {
                const d = calcDist(
                  coords.latitude, coords.longitude,
                  parseFloat(data[0].lat), parseFloat(data[0].lon)
                );
                if (d && parseFloat(d) > 0) { setDistance(d); break; }
              }
            } catch (_) {}
          }
          setDistLoading(false);
        },
        () => setDistLoading(false),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    } catch (_) {
      setDistLoading(false);
    }
  };

  /* Fetch order */
  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/user-food-orders/${id}`);
      setOrder(res.data);
      computeDistance(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  /* Status update */
  const handleStatusUpdate = async (newStatus) => {
    if (!DELIVERY_STATUSES.includes(newStatus)) return;
    setUpdating(true);
    try {
      await api.patch(`/delivery/orders/${id}/status`, { status: newStatus });
      toast.success(`Order moved to "${newStatus}"`);
      fetchOrder();
    } catch (err) {
      const msg = err.response?.data?.message || "Status update failed.";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-5">
        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
          Loading order details…
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <FiAlertCircle size={40} className="text-red-400" />
        <p className="text-slate-400 font-bold text-sm">Order not found.</p>
        <Link
          to="/delivery/all-orders"
          className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusIndex   = getStatusIndex(order.status);
  const nextStatus    = NEXT_STATUS[order.status] || null;
  const statusStyle   = STATUS_COLOR[order.status] || "bg-slate-800 text-slate-300 border-slate-700";
  const items         = Array.isArray(order.items) ? order.items : [];
  const isFinalStatus = order.status === "Delivered" || order.status === "Cancelled";

  return (
    <div className="space-y-6 pb-16">
      <Toaster position="top-right" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl border border-white/10 bg-slate-950 text-slate-300 hover:text-white hover:border-emerald-500 transition"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Order Details
            </h1>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
              {order.order_id || `#${order.id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Current Status Badge */}
          <span
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyle}`}
          >
            {order.status}
          </span>

          {/* Next Action Button */}
          {nextStatus && !isFinalStatus && (
            <button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiCheck size={14} />
              {updating ? "Updating…" : `Move to ${nextStatus}`}
            </button>
          )}

          <button
            onClick={fetchOrder}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-white/10 bg-slate-950 text-slate-300 hover:text-white hover:border-emerald-500 transition disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Status Timeline ─────────────────────────────────────────── */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl overflow-x-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">
          Order Progress
        </p>
        <div className="flex items-start gap-0 min-w-max">
          {PIPELINE.map((step, idx) => {
            const isCompleted = idx < statusIndex;
            const isCurrent   = idx === statusIndex;
            const isPending   = idx > statusIndex;
            return (
              <div key={step.key} className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all
                      ${isCompleted ? "bg-emerald-600 border-emerald-500 text-white"
                      : isCurrent   ? "bg-slate-800 border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20"
                      : "bg-slate-900 border-slate-700 text-slate-600"}`}
                  >
                    {isCompleted ? <FiCheck size={16} /> : <span className="text-sm">{step.icon}</span>}
                  </div>
                  <p
                    className={`text-[9px] font-black uppercase tracking-wider text-center max-w-[72px] leading-tight
                      ${isCurrent ? "text-emerald-400" : isCompleted ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {step.label}
                  </p>
                </div>
                {/* Connector */}
                {idx < PIPELINE.length - 1 && (
                  <div
                    className={`w-10 h-0.5 mb-5 ${idx < statusIndex ? "bg-emerald-500" : "bg-slate-800"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer & Address */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FiUser size={16} className="text-emerald-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Customer Details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Name</p>
                <p className="text-white font-bold text-sm">
                  {order.customer_name || order.ordered_by_name || "—"}
                </p>
              </div>

              {/* Phone */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Phone</p>
                <div className="flex items-center gap-2">
                  <FiPhone size={13} className="text-emerald-400" />
                  <p className="text-white font-bold text-sm">
                    {order.customer_phone || "—"}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="sm:col-span-2 rounded-2xl bg-slate-900/70 border border-white/5 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Delivery Address</p>
                  {distLoading ? (
                    <span className="text-[10px] text-slate-500 animate-pulse font-bold">Calculating…</span>
                  ) : distance ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                      <FiNavigation size={10} /> {distance} KM
                    </span>
                  ) : null}
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {[
                      order.street_address, order.city, order.district,
                      order.state, order.zip_code
                    ].filter(Boolean).join(", ") || "Address not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FiShoppingBag size={16} className="text-blue-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Items in Order
                </p>
              </div>
              <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/5">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No items found.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <FiPackage size={16} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">
                        {item.name || item.product_name || item.title || "Food item"}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 font-semibold">
                        Qty: {item.quantity || item.qty || 1}
                        {item.variant_size ? ` · Size: ${item.variant_size}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-black text-sm">
                        {fmt((parseFloat(item.price || item.final_price || 0)) * (item.quantity || 1))}
                      </p>
                      <p className="text-slate-600 text-[10px] mt-0.5">
                        {fmt(item.price || item.final_price || 0)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Status Actions */}
          {!isFinalStatus && order.status !== "New Order" && order.status !== "Accepted" && (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FiTruck size={16} className="text-cyan-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Update Delivery Status
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DELIVERY_STATUSES.map((s) => {
                  const sIdx = getStatusIndex(s);
                  const isPast = sIdx < statusIndex;
                  const isCurr = s === order.status;
                  return (
                    <button
                      key={s}
                      onClick={() => !isPast && !isCurr && handleStatusUpdate(s)}
                      disabled={updating || isPast || isCurr}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition
                        ${isCurr
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default"
                          : isPast
                          ? "border-white/5 bg-slate-900/30 text-slate-600 cursor-not-allowed"
                          : "border-white/10 bg-slate-900/50 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5"
                        }`}
                    >
                      {isCurr && <FiCheck size={16} className="text-emerald-400" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivered Banner */}
          {order.status === "Delivered" && (
            <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl shrink-0">🎉</div>
              <div>
                <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">Order Delivered</p>
                <p className="text-slate-400 text-xs mt-0.5">This order has been delivered successfully.</p>
              </div>
            </div>
          )}

          {/* Cancelled Banner */}
          {order.status === "Cancelled" && (
            <div className="rounded-[2rem] border border-red-500/30 bg-red-500/5 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl shrink-0">❌</div>
              <div>
                <p className="text-red-400 font-black text-sm uppercase tracking-widest">Order Cancelled</p>
                {order.cancellation_reason && (
                  <p className="text-slate-400 text-xs mt-0.5">Reason: {order.cancellation_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — 1/3 width */}
        <div className="space-y-5">

          {/* Order Summary */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FiDollarSign size={16} className="text-amber-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payment</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs font-semibold">Method</span>
                <span className="text-white text-xs font-black uppercase tracking-wide">
                  {order.payment_method || "COD"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs font-semibold">Payment Status</span>
                <span className={`text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full border
                  ${order.payment_status === "Paid"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/30"}`}>
                  {order.payment_status || "Pending"}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm font-bold">Total Amount</span>
                  <span className="text-white text-lg font-black">{fmt(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chef / Restaurant */}
          {(order.chef_name || order.chef_phone) && (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <MdOutlineRestaurant size={18} className="text-purple-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Restaurant</p>
              </div>

              <div className="space-y-3">
                {order.chef_name && (
                  <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Chef / Restaurant</p>
                    <p className="text-white font-bold text-sm">{order.chef_name}</p>
                  </div>
                )}
                {order.chef_phone && (
                  <div className="flex items-center gap-2 px-1">
                    <FiPhone size={13} className="text-purple-400" />
                    <p className="text-slate-300 text-sm font-semibold">{order.chef_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Meta */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-slate-700/50 border border-slate-700 flex items-center justify-center">
                <FiClock size={16} className="text-slate-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Order Info</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 font-semibold shrink-0">Order ID</span>
                <span className="text-white font-black text-right break-all">
                  {order.order_id || `#${order.id}`}
                </span>
              </div>
              {order.ordered_at && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-semibold shrink-0">Placed At</span>
                  <span className="text-slate-300 font-semibold text-right">
                    {new Date(order.ordered_at).toLocaleString()}
                  </span>
                </div>
              )}
              {order.delivery_date && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-semibold shrink-0">Delivery Slot</span>
                  <span className="text-slate-300 font-semibold text-right">
                    {order.delivery_date} {order.delivery_time || ""}
                  </span>
                </div>
              )}
              {order.delivery_partner_name && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Delivery Partner
                  </p>
                  <p className="text-emerald-400 font-black">{order.delivery_partner_name}</p>
                  {order.delivery_partner_phone && (
                    <p className="text-slate-400 text-xs mt-0.5">{order.delivery_partner_phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrderDetail;
