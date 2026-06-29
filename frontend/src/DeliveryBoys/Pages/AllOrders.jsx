import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import {
    FiSearch, FiEye, FiTruck, FiCheckCircle, FiXCircle,
    FiClock, FiPackage, FiRefreshCcw, FiEdit, FiX, FiSave,
    FiUser, FiMapPin, FiCalendar
} from "react-icons/fi";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

/* ─── Status colours ──────────────────────────────────────────────────── */
const STATUS_STYLE = {
    "New Order":                  "bg-slate-900 text-slate-300 border-slate-700",
    "Accepted":                   "bg-blue-950 text-blue-300 border-blue-800",
    "Preparing":                  "bg-purple-950 text-purple-300 border-purple-800",
    "Food Ready":                 "bg-orange-950 text-orange-300 border-orange-800",
    "Packing":                    "bg-indigo-950 text-indigo-300 border-indigo-800",
    "Searching Delivery Partner": "bg-yellow-950 text-yellow-300 border-yellow-800",
    "Delivery Partner Assigned":  "bg-cyan-950 text-cyan-300 border-cyan-800",
    "Picked Up":                  "bg-sky-950 text-sky-300 border-sky-800",
    "Out for Delivery":           "bg-cyan-950 text-cyan-300 border-cyan-800",
    "Delivered":                  "bg-emerald-950 text-emerald-300 border-emerald-800",
    "Cancelled":                  "bg-red-950 text-red-300 border-red-800",
};

const ALL_STATUSES = [
    "New Order", "Accepted", "Preparing", "Food Ready", "Packing",
    "Searching Delivery Partner", "Delivery Partner Assigned",
    "Picked Up", "Out for Delivery", "Delivered", "Cancelled",
];

const DELIVERY_STATUSES = ["Picked Up", "Out for Delivery", "Delivered"];

const getStatusStyle = (s) => STATUS_STYLE[s] || "bg-slate-900 text-slate-300 border-slate-700";

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─── Edit Order Modal ─────────────────────────────────────────────────── */
const EditOrderModal = ({ order, onClose, onSaved }) => {
    const [status, setStatus] = useState(order.status || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!status) return toast.error("Please select a status.");
        if (!DELIVERY_STATUSES.includes(status)) {
            return toast.error(`Delivery boy can only set: ${DELIVERY_STATUSES.join(", ")}`);
        }
        setSaving(true);
        try {
            await api.patch(`/delivery/orders/${order.id}/status`, { status });
            toast.success(`Order status updated to "${status}"`);
            onSaved();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update order.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0f17] shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 px-8 py-7">
                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                    >
                        <FiX size={18} />
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300 mb-2">
                        Update Delivery Status
                    </p>
                    <h3 className="text-2xl font-black text-white tracking-tight italic">
                        Edit Order
                    </h3>
                    <p className="mt-1.5 text-xs font-bold text-emerald-300/70">
                        {order.order_id || `#${order.id}`}
                    </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="p-8 space-y-6">

                    {/* Customer info (read-only) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <FiUser size={10} /> Customer Name
                            </p>
                            <p className="text-white font-bold text-sm truncate">
                                {order.customer_name || "—"}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                Order Amount (₹)
                            </p>
                            <p className="text-emerald-400 font-black text-sm">
                                {fmt(order.total_amount)}
                            </p>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    {(order.street_address || order.city) && (
                        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <FiMapPin size={10} /> Delivery Address
                            </p>
                            <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                                {[order.street_address, order.city, order.district, order.state, order.zip_code]
                                    .filter(Boolean).join(", ")}
                            </p>
                        </div>
                    )}

                    {/* Ordered At */}
                    {order.ordered_at && (
                        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                                <FiCalendar size={10} /> Ordered At
                            </p>
                            <p className="text-slate-300 text-xs font-semibold">
                                {new Date(order.ordered_at).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Current Status Badge */}
                    <div className="flex items-center gap-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            Current Status:
                        </p>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                            {order.status}
                        </span>
                    </div>

                    {/* Delivery Status Select */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                            Update Delivery Status
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {DELIVERY_STATUSES.map((s) => {
                                const isSelected = status === s;
                                const isCurrent  = order.status === s;
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={`flex items-center justify-between px-5 py-4 rounded-2xl border text-sm font-bold transition
                                            ${isSelected
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                                                : "border-white/10 bg-slate-900/50 text-slate-400 hover:border-emerald-500/40 hover:text-slate-200"}`}
                                    >
                                        <span>{s}</span>
                                        <span className="flex items-center gap-2">
                                            {isCurrent && (
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                                    Current
                                                </span>
                                            )}
                                            {isSelected && (
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <FiCheckCircle size={11} className="text-white" />
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-slate-600 font-semibold pt-1">
                            * Delivery boys can only update to: Picked Up, Out for Delivery, or Delivered.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !status || status === order.status}
                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSave size={14} />
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main Component ───────────────────────────────────────────────────── */
const Orders = ({ statusFilter = "All" }) => {
    const [searchTerm, setSearchTerm]     = useState("");
    const { ordersCache, setOrdersCache } = useAdmin();
    const [orders, setOrders]             = useState(ordersCache[statusFilter] || []);
    const [loading, setLoading]           = useState(!ordersCache[statusFilter]);
    const [currentPage, setCurrentPage]   = useState(1);
    const [activeStatus, setActiveStatus] = useState(statusFilter);
    const [editingOrder, setEditingOrder] = useState(null);   // ← edit modal target
    const location = useLocation();
    const itemsPerPage = 10;

    const fetchOrders = useCallback(async () => {
        if (!ordersCache[activeStatus]) setLoading(true);
        try {
            const base = location.pathname?.startsWith("/delivery")
                ? "/delivery/orders"
                : "/orders";
            const res  = await api.get(`${base}?status=${activeStatus}`);
            const data = res.data || [];
            setOrders(data);
            setOrdersCache((prev) => ({ ...prev, [activeStatus]: data }));
        } catch (err) {
            console.error("Fetch Orders Error:", err);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [activeStatus, location.pathname, ordersCache, setOrdersCache]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    /* Filter + paginate */
    const filteredOrders = orders.filter((o) => {
        const q = searchTerm.toLowerCase();
        return [o.customer_name, o.customer_phone, o.order_id, o.id?.toString()]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q));
    });
    const totalPages   = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
    const currentItems = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const statusTabs = [
        "All",
        "Delivery Partner Assigned",
        "Picked Up",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
    ];

    /* Metric cards */
    const metrics = [
        { label: "Total Orders",    value: filteredOrders.length,                                                  color: "emerald" },
        { label: "Assigned",        value: orders.filter((o) => o.status === "Delivery Partner Assigned").length,  color: "cyan"    },
        { label: "In Transit",      value: orders.filter((o) => ["Picked Up","Out for Delivery"].includes(o.status)).length, color: "amber" },
        { label: "Delivered",       value: orders.filter((o) => o.status === "Delivered").length,                  color: "green"   },
    ];

    return (
        <div className="space-y-8 pb-20">
            <Toaster position="top-right" />

            {/* Edit Modal */}
            {editingOrder && (
                <EditOrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={fetchOrders}
                />
            )}

            {/* ── Header ──────────────────────────────────────────── */}
            <header className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_40%)]" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
                            Delivery Partner Workspace
                        </p>
                        <h1 className="mt-3 text-4xl font-black text-white tracking-tight">
                            All Orders
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Manage delivery pipeline and update your order status.
                        </p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition active:scale-95"
                    >
                        <FiRefreshCcw size={16} /> Refresh
                    </button>
                </div>
            </header>

            {/* ── Metric Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div
                        key={i}
                        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl"
                    >
                        <span className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-3xl bg-${m.color}-500`} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{m.label}</p>
                        <p className={`text-3xl font-black text-${m.color}-400`}>
                            {loading ? "—" : m.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Table Section ─────────────────────────────────────── */}
            <section className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-950/95 shadow-2xl">

                {/* Toolbar */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                        {/* Status Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {statusTabs.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setActiveStatus(s); setCurrentPage(1); }}
                                    className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition
                                        ${activeStatus === s
                                            ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30 shadow-lg"
                                            : "bg-slate-900/70 text-slate-400 hover:bg-slate-900 border border-white/10"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative max-w-sm w-full">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Search orders..."
                                className="w-full rounded-full border border-white/10 bg-slate-900 pl-11 pr-5 py-3 text-sm font-semibold text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading orders…</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-slate-950/70">
                                    {["Order ID / Date", "Customer", "Status", "Amount", "Actions"].map((h) => (
                                        <th
                                            key={h}
                                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ${h === "Actions" ? "text-right" : "text-left"}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {currentItems.length > 0 ? currentItems.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.025] transition-colors group">
                                        {/* Order ID */}
                                        <td className="px-6 py-5 align-middle">
                                            <p className="font-black text-white text-sm">
                                                {order.order_id || `#${order.id}`}
                                            </p>
                                            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                                                {order.ordered_at
                                                    ? new Date(order.ordered_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                    : "—"}
                                            </p>
                                        </td>

                                        {/* Customer */}
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-slate-300 shrink-0">
                                                    {(order.customer_name || "?")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{order.customer_name || "Guest"}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{order.customer_phone || "—"}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-5 align-middle">
                                            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                {order.status || "Unknown"}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-6 py-5 align-middle">
                                            <p className="text-white font-black text-base">{fmt(order.total_amount)}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wider">
                                                {order.payment_method || "COD"}
                                            </p>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Details */}
                                                <Link
                                                    to={`/delivery/orders/${order.id}`}
                                                    className="w-10 h-10 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition"
                                                    title="View Details"
                                                >
                                                    <FiEye size={16} />
                                                </Link>

                                                {/* Edit / Update Status */}
                                                <button
                                                    onClick={() => setEditingOrder(order)}
                                                    className="w-10 h-10 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition"
                                                    title="Edit Order Status"
                                                >
                                                    <FiEdit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-28 text-center">
                                            <div className="mx-auto mb-4 w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-slate-600">
                                                <FiPackage size={36} />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                                                No orders found
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-slate-950/80 p-5">
                        <span className="text-xs text-slate-500 font-semibold">
                            Showing {currentItems.length} of {filteredOrders.length} orders
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition
                                        ${currentPage === i + 1
                                            ? "bg-emerald-500 text-slate-950"
                                            : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Orders;
