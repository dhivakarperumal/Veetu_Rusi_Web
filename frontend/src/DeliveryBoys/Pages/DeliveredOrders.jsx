import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  FiSearch, FiMapPin, FiPhone, FiRefreshCw,
  FiPackage, FiEye, FiGrid, FiList, FiCheckCircle
} from "react-icons/fi";
import { CheckCircle, Search, WalletCards, TrendingUp } from "lucide-react";
import DeliverySummaryCards from "../Components/DeliverySummaryCards";
import DeliveryOrderToolbar from "../Components/DeliveryOrderToolbar";

const fmt = (n) =>
  `₹${parseFloat(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const statusStyle = () => "bg-emerald-950 text-emerald-300 border-emerald-800";

/* ─── Main Page ──────────────────────────────────────────────────────── */
const DeliveredOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode]     = useState("table"); // "card" | "table"

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders?status=Delivered");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to fetch delivered orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [o.order_id, o.customer_name, o.customer_phone, String(o.id)]
      .filter(Boolean).some((v) => v.toLowerCase().includes(q));
  });

  const deliveredValue = orders.reduce((total, order) => total + Number(order.total_amount || 0), 0);
  const averageOrderValue = orders.length ? deliveredValue / orders.length : 0;

  const metrics = [
    { label: "Total Delivered", value: orders.length, icon: CheckCircle, iconColor: "#10B981", surfaceColor: "#052e16" },
    { label: "Showing", value: filtered.length, icon: Search, iconColor: "#38BDF8", surfaceColor: "#0c2a3a" },
    { label: "Delivered Value", value: `₹${deliveredValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: WalletCards, iconColor: "#8B5CF6", surfaceColor: "#1b1235" },
    { label: "Average Order", value: `₹${averageOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: TrendingUp, iconColor: "#F59E0B", surfaceColor: "#2e1a05" },
  ];

  /* ── Empty / Loading ── */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4 rounded-[2rem] border border-white/10 bg-slate-950/95">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center">
        <FiCheckCircle size={32} className="text-emerald-600/40" />
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">No delivered orders</p>
      <p className="text-xs text-slate-700">Orders you have completed will appear here.</p>
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
            className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden hover:border-emerald-500/20 transition-colors">

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
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusStyle()}`}>
                {order.status || "Delivered"}
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
                  <FiMapPin size={13} className="text-emerald-400/70 mt-0.5 shrink-0" />
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
              <Link to={`/delivery/orders/${order.id}`}
                className="w-full h-12 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 hover:border-emerald-500/40 transition"
                title="View Details">
                <FiEye size={16} /> View Order Details
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
                      <FiMapPin size={11} className="text-emerald-500 mt-0.5 shrink-0" />
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
                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusStyle()}`}>
                      {order.status || "Delivered"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <Link to={`/delivery/orders/${order.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-900 text-slate-400 text-[9px] font-black uppercase tracking-wider hover:text-white hover:bg-slate-800 transition"
                        title="View Details">
                        <FiEye size={12} /> View
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

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_40%)]" />
        <div className="relative">
          {/* Header Title Area */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400">
              Delivery Partner · History
            </p>
            <h1 className="mt-3 text-4xl font-black text-white tracking-tight">Delivered Orders</h1>
            <p className="mt-2 text-sm text-slate-400">Orders you have successfully delivered.</p>
          </div>

        </div>
      </header>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <DeliverySummaryCards loading={loading} cards={metrics} />

      <DeliveryOrderToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={["All", "Delivered"]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={fetchOrders}
        loading={loading}
      />

      {/* ── Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5 rounded-[2rem] border border-white/10 bg-slate-950/95">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading history…</p>
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

export default DeliveredOrders;
