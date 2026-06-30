import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  FiSearch, FiMapPin, FiPhone, FiRefreshCw,
  FiPackage, FiEye, FiTruck, FiSave, FiX, FiGrid, FiList, FiMap
} from "react-icons/fi";
import LiveTrackingMap from "../Components/LiveTrackingMap";

/* ─── Constants ─────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  "Delivery Partner Assigned": "bg-cyan-950 text-cyan-300 border-cyan-800",
  "Picked Up":                 "bg-sky-950 text-sky-300 border-sky-800",
  "Out for Delivery":          "bg-indigo-950 text-indigo-300 border-indigo-800",
  "Delivered":                 "bg-emerald-950 text-emerald-300 border-emerald-800",
};

const DELIVERY_STATUSES = [
  { key: "Picked Up",        icon: "🛵", desc: "Picked up from restaurant" },
  { key: "Out for Delivery", icon: "🚚", desc: "On the way to customer"    },
  { key: "Delivered",        icon: "✅", desc: "Successfully delivered"    },
];

const fmt = (n) =>
  `₹${parseFloat(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const statusStyle = (s) => STATUS_STYLE[s] || "bg-slate-900 text-slate-300 border-slate-700";

/* ─── Status Modal ───────────────────────────────────────────────────── */
const StatusModal = ({ order, onClose, onSaved }) => {
  const [status, setStatus] = useState(order.status || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSave = async (e) => {
    e.preventDefault();
    const allowed = DELIVERY_STATUSES.map((s) => s.key);
    if (!allowed.includes(status)) return toast.error("Pick a valid delivery status.");
    setSaving(true);
    try {
      await api.patch(`/delivery/orders/${order.id}/status`, { status });
      toast.success(`Order moved to "${status}"`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm flex flex-col rounded-[2rem] border border-white/10 bg-[#0c1018] shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-sky-900 to-slate-900 rounded-t-[2rem] px-6 py-5 relative">
          <button type="button" onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition">
            <FiX size={15} />
          </button>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 mb-1">Update Status</p>
          <h3 className="text-lg font-black text-white italic">Move Order</h3>
          <p className="text-[11px] text-sky-300/70 font-bold mt-0.5">{order.order_id || `#${order.id}`}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-slate-900 border border-white/5 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Customer</p>
                <p className="text-white font-bold text-sm truncate">{order.customer_name || "—"}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-slate-900 border border-white/5 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Amount</p>
                <p className="text-emerald-400 font-black text-sm">{fmt(order.total_amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current:</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="border-t border-white/5" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">New Status</p>

            <div className="space-y-2">
              {DELIVERY_STATUSES.map((s) => {
                const isSel = status === s.key;
                const isCur = order.status === s.key;
                return (
                  <button key={s.key} type="button" onClick={() => setStatus(s.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-sm font-bold transition-all
                      ${isSel ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                               : "border-white/10 bg-slate-900/50 text-slate-400 hover:border-emerald-400/30 hover:text-white"}`}>
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm leading-tight">{s.key}</p>
                      <p className="text-[10px] opacity-60 font-medium">{s.desc}</p>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {isCur && !isSel && (
                        <span className="text-[9px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded-full font-black uppercase">Current</span>
                      )}
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSel ? "bg-emerald-500 border-emerald-500" : "border-slate-700"}`}>
                        {isSel && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 border-t border-white/5 bg-[#0c1018] rounded-b-[2rem] flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit"
              disabled={saving || !status || status === order.status || !DELIVERY_STATUSES.map(s=>s.key).includes(status)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-[10px] font-black uppercase tracking-widest text-white transition shadow-lg shadow-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed">
              <FiSave size={12} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────── */
const PickedUpOrders = () => {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [viewMode, setViewMode]         = useState("table"); // "card" | "table"

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders?status=Picked Up");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to fetch picked up orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [o.order_id, o.customer_name, o.customer_phone, String(o.id)]
      .filter(Boolean).some((v) => v.toLowerCase().includes(q));
  });

  const metrics = [
    { label: "Total Displayed",  value: orders.length,                                                          color: "sky"     },
    { label: "Pending Pickup",   value: orders.filter(o => o.status === "Delivery Partner Assigned").length,    color: "amber"   },
    { label: "Picked Up",        value: orders.filter(o => o.status === "Picked Up").length,                    color: "sky"     },
    { label: "Out for Delivery", value: orders.filter(o => o.status === "Out for Delivery").length,             color: "emerald" },
  ];

  /* ── Empty / Loading ── */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4 rounded-[2rem] border border-white/10 bg-slate-950/95">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center">
        <FiPackage size={32} className="text-slate-600" />
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">No picked up orders right now</p>
      <p className="text-xs text-slate-700">Orders you have picked up will appear here.</p>
    </div>
  );

  /* ── Card View ── */
  const CardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {filtered.map((order) => {
        const address = [order.street_address, order.city, order.district, order.state, order.zip_code]
          .filter(Boolean).join(", ");
        return (
          <div key={order.id}
            className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden hover:border-sky-500/20 transition-colors">

            {/* Card Top */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div className="min-w-0">
                <p className="text-white font-black text-sm truncate">{order.order_id || `#${order.id}`}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                  {order.ordered_at
                    ? new Date(order.ordered_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Card Body */}
            <div className="px-6 py-4 space-y-3">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-slate-300 shrink-0">
                  {(order.customer_name || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{order.customer_name || "Customer"}</p>
                  {order.customer_phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <FiPhone size={10} className="text-slate-500" />
                      <p className="text-[11px] text-slate-500 font-semibold">{order.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {address && (
                <div className="flex items-start gap-2 rounded-2xl bg-slate-900/60 border border-white/5 px-4 py-3">
                  <FiMapPin size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <p className="text-slate-300 text-xs font-semibold leading-relaxed">{address}</p>
                </div>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between">
                <p className="text-white font-black text-base">{fmt(order.total_amount)}</p>
                <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 bg-slate-900 text-slate-400">
                  {order.payment_method || "COD"}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditingOrder(order)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-emerald-900/20">
                <FiTruck size={13} /> Update Status
              </button>
              <button onClick={() => setTrackingOrder(order)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-indigo-900/20">
                <FiMap size={13} /> Track
              </button>
              <Link to={`/delivery/orders/${order.id}`}
                className="w-12 h-12 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-sky-500/40 transition"
                title="View Details">
                <FiEye size={16} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── Table View ── */
  const TableView = () => (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/70">
              {["#", "Order ID / Date", "Customer", "Address", "Amount", "Status", "Actions"].map((h) => (
                <th key={h}
                  className={`px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap
                    ${h === "Actions" ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((order, idx) => {
              const address = [order.street_address, order.city, order.district, order.state]
                .filter(Boolean).join(", ");
              return (
                <tr key={order.id} className="hover:bg-white/[0.025] transition-colors">
                  {/* # */}
                  <td className="px-5 py-4 text-slate-600 font-black text-sm">{idx + 1}</td>

                  {/* Order ID */}
                  <td className="px-5 py-4">
                    <p className="font-black text-white text-xs">{order.order_id || `#${order.id}`}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {order.ordered_at
                        ? new Date(order.ordered_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                        {(order.customer_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{order.customer_name || "—"}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">{order.customer_phone || ""}</p>
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-5 py-4 max-w-[200px]">
                    <div className="flex items-start gap-1.5">
                      <FiMapPin size={11} className="text-sky-500 mt-0.5 shrink-0" />
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{address || "—"}</p>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4">
                    <p className="text-white font-black text-sm">{fmt(order.total_amount)}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{order.payment_method || "COD"}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider transition"
                        title="Update Status">
                        <FiTruck size={11} /> Update
                      </button>
                      <button onClick={() => setTrackingOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider transition"
                        title="Live Tracking">
                        <FiMap size={11} /> Track
                      </button>
                      <Link to={`/delivery/orders/${order.id}`}
                        className="w-9 h-9 rounded-xl border border-white/10 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="View Details">
                        <FiEye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="border-t border-white/10 bg-slate-950/80 px-6 py-3">
        <p className="text-xs text-slate-600 font-semibold">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      <Toaster position="top-right" />

      {editingOrder && (
        <StatusModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={fetchOrders}
        />
      )}

      {trackingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
          <div className="absolute inset-0 bg-black/70" aria-hidden="true" onClick={() => setTrackingOrder(null)}></div>
          <div className="relative z-10 w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl bg-slate-950/95 shadow-2xl ring-1 ring-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-black text-white">Live Route Tracking</h2>
                <p className="text-sm text-slate-400 mt-1">Order {trackingOrder.order_id || `#${trackingOrder.id}`}</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="p-3 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition border border-white/10"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 bg-slate-900/50">
              <LiveTrackingMap 
                chefLat={trackingOrder.home_chef_lat} 
                chefLng={trackingOrder.home_chef_lng} 
                customerLat={trackingOrder.customer_lat} 
                customerLng={trackingOrder.customer_lng} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_40%)]" />
        <div className="relative">
          {/* Header Title Area */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
              Delivery Partner · In Transit
            </p>
            <h1 className="mt-3 text-4xl font-black text-white tracking-tight">Picked Up Orders</h1>
            <p className="mt-2 text-sm text-slate-400">Orders you have picked up and are on the way to customers.</p>
          </div>

          {/* Header Controls Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-6">
            {/* Search (Left Side) */}
            <div className="relative w-full sm:w-auto">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-full sm:w-72 rounded-full border border-white/10 bg-slate-900 pl-10 pr-4 py-3 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:border-sky-500 outline-none" />
            </div>

            {/* Other Actions (Right Side) */}
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center rounded-full border border-white/10 bg-slate-900 p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition
                    ${viewMode === "card" ? "bg-emerald-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}
                  title="Card View"
                >
                  <FiGrid size={13} /> Card
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition
                    ${viewMode === "table" ? "bg-emerald-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}
                  title="Table View"
                >
                  <FiList size={13} /> Table
                </button>
              </div>

              {/* Refresh */}
              <button onClick={fetchOrders} disabled={loading}
                className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 h-[42px]">
                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
            <span className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-20 blur-3xl bg-${m.color}-500`} />
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 mb-2">{m.label}</p>
            <p className={`text-3xl font-black text-${m.color}-400`}>{loading ? "—" : m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5 rounded-[2rem] border border-white/10 bg-slate-950/95">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading assignments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : viewMode === "card" ? (
        <CardView />
      ) : (
        <TableView />
      )}
    </div>
  );
};

export default PickedUpOrders;
