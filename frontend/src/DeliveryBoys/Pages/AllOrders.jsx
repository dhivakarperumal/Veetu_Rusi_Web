import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import {
    FiSearch,
    FiEye,
    FiTruck,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiPackage,
    FiPrinter,
    FiRefreshCcw,
} from "react-icons/fi";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const Orders = ({ statusFilter = "All" }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const { ordersCache, setOrdersCache } = useAdmin();
    const [orders, setOrders] = useState(ordersCache[statusFilter] || []);
    const [loading, setLoading] = useState(!ordersCache[statusFilter]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ orderId: null, status: "", tracking: "", courier: "", reason: "" });
    const [activeStatus, setActiveStatus] = useState(statusFilter);
    const location = useLocation();

    const fetchOrders = useCallback(async () => {
        if (!ordersCache[activeStatus]) setLoading(true);
        try {
            const base = location.pathname?.startsWith("/delivery") ? "/delivery/orders" : "/orders";
            const res = await api.get(`${base}?status=${activeStatus}`);
            const data = res.data || [];
            setOrders(data);
            setOrdersCache(prev => ({ ...prev, [activeStatus]: data }));
        } catch (error) {
            console.error("Fetch Orders Error:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [activeStatus, location.pathname, ordersCache, setOrdersCache]);

    useEffect(() => {
        const loadOrders = async () => {
            await fetchOrders();
        };

        void loadOrders();
    }, [fetchOrders]);

    const performStatusUpdate = async (orderId, updateData) => {
        setLoading(true);
        try {
            await api.patch(`/delivery/orders/${orderId}/status`, updateData);
            toast.success(`Pipeline synchronized to: ${updateData.status}`);
            fetchOrders();
        } catch (error) {
            console.error("Status Sync Error:", error);
            toast.error("Failed to sync pipeline status");
        } finally {
            setLoading(false);
        }
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        const updateData = { status: modalData.status };

        if (modalData.status === "Shipping") {
            if (!modalData.tracking || !modalData.courier) return toast.error("Logistics data incomplete");
            updateData.tracking_number = modalData.tracking;
            updateData.courier_name = modalData.courier;
            updateData.shipped_at = new Date().toISOString();
        } else if (modalData.status === "Cancelled") {
            if (!modalData.reason) return toast.error("Cancellation rationale required");
            updateData.cancellation_reason = modalData.reason;
            updateData.cancelled_at = new Date().toISOString();
        }

        performStatusUpdate(modalData.orderId, updateData);
        setShowModal(false);
    };

    const filteredOrders = orders.filter(order => {
        const query = searchTerm.toLowerCase();
        return [order.customer_name, order.customer_email, order.user_id, order.id?.toString()]
            .filter(Boolean)
            .some(value => value.toLowerCase().includes(query));
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
    const currentItems = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statusOptions = ["All", "Delivery Partner Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

    const getStatusStyle = (status) => {
        switch (status) {
            case "Order Placed": return "bg-blue-950 text-blue-300 border-blue-800";
            case "Packing": return "bg-indigo-950 text-indigo-300 border-indigo-800";
            case "Shipping": return "bg-amber-950 text-amber-300 border-amber-800";
            case "Out for Delivery": return "bg-cyan-950 text-cyan-300 border-cyan-800";
            case "Delivered": return "bg-emerald-950 text-emerald-300 border-emerald-800";
            case "Cancelled": return "bg-red-950 text-red-300 border-red-800";
            case "New": return "bg-slate-900 text-slate-300 border-slate-700";
            case "Processing": return "bg-slate-950 text-indigo-300 border-indigo-800";
            case "Shipped": return "bg-slate-950 text-amber-300 border-amber-800";
            default: return "bg-slate-900 text-slate-300 border-slate-700";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Order Placed": return <FiPackage className="text-xs" />;
            case "Packing": return <FiClock className="text-xs" />;
            case "Shipping": return <FiTruck className="text-xs" />;
            case "Out for Delivery": return <FiTruck className="text-xs" />;
            case "Delivered": return <FiCheckCircle className="text-xs" />;
            case "Cancelled": return <FiXCircle className="text-xs" />;
            default: return null;
        }
    };

    const dashboardMetrics = [
        { label: "Total Matches", value: filteredOrders.length, icon: <FiPackage />, accent: "emerald", status: "All" },
        { label: "Pending Processing", value: orders.filter(o => ["Order Placed", "New", "Processing"].includes(o.status)).length, icon: <FiClock />, accent: "amber", status: "Order Placed" },
        { label: "Shipping", value: orders.filter(o => ["Shipping", "Out for Delivery", "Shipped", "Packing"].includes(o.status)).length, icon: <FiTruck />, accent: "cyan", status: "Shipping" },
        { label: "Delivered", value: orders.filter(o => o.status === "Delivered").length, icon: <FiCheckCircle />, accent: "emerald", status: "Delivered" },
    ];

    return (
        <div className="space-y-8 pb-20">
            <Toaster position="top-right" />

            <header className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden relative">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_40%)]" />
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">Delivery Partner Workspace</p>
                        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">All Orders</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Browse every delivery order, manage the pipeline, and update delivery status from one polished command center.</p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-6 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-950 shadow-emerald-500/30 shadow-lg transition hover:bg-emerald-400 active:scale-[0.98]"
                    >
                        <FiRefreshCcw className="h-4 w-4" /> Refresh Orders
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {dashboardMetrics.map((metric, index) => (
                    <div key={index} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1">
                        <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 blur-3xl bg-emerald-500" />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 ${metric.accent === 'emerald' ? 'bg-emerald-500/15 text-emerald-300' : metric.accent === 'amber' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                                {metric.icon}
                            </div>
                            <div className="truncate">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">{metric.label}</p>
                                <h3 className="text-3xl font-black text-white tracking-tight">{loading ? '-' : metric.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/20">
                <div className="p-8 border-b border-white/10">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">Delivery Partner Command Center</p>
                            <h2 className="text-3xl font-black text-white">Orders Pipeline</h2>
                            <p className="max-w-2xl text-sm leading-7 text-slate-400">Filter orders by delivery stage and quickly update pipeline status with the partner workflow.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setActiveStatus(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.24em] transition ${activeStatus === status ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' : 'bg-slate-900/75 text-slate-300 hover:bg-slate-900'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 max-w-xl relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by ID, name or email..."
                            className="w-full rounded-full border border-white/10 bg-slate-900/90 px-14 py-4 text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-24 text-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
                            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">Syncing the delivery pipeline...</p>
                        </div>
                    ) : (
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-950/90 text-left">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ID / Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Pipeline Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Method</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Print</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {currentItems.length > 0 ? currentItems.map((order) => (
                                    <tr key={order.id} className="bg-slate-950/80 transition hover:bg-slate-900/95">
                                        <td className="px-6 py-5 align-top">
                                            <p className="text-sm font-black text-white">#ORD-0{order.id}</p>
                                            <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}</p>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-sm font-black uppercase text-slate-200">{order.customer_name?.[0] || 'C'}</div>
                                                <div>
                                                    <p className="font-black text-white">{order.customer_name || 'Guest Customer'}</p>
                                                    <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{order.customer_phone || 'No phone'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="space-y-3">
                                                <div className={`inline-flex min-w-[170px] items-center justify-between rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${getStatusStyle(order.status)}`}>
                                                    <span>{order.status || 'Unknown'}</span>
                                                    <span className="text-slate-200">{getStatusIcon(order.status)}</span>
                                                </div>
                                                {order.status === 'Shipping' && order.tracking_number && (
                                                    <div className="rounded-2xl border border-amber-700/30 bg-amber-950/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
                                                        {order.courier_name || 'Courier'} • {order.tracking_number}
                                                    </div>
                                                )}
                                                {order.status === 'Cancelled' && (
                                                    <div className="rounded-2xl border border-red-700/30 bg-red-950/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
                                                        {order.cancellation_reason || 'No cancellation note'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <span className="inline-flex rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">{order.payment_method || 'Cash On Delivery'}</span>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <p className="text-xl font-black text-white">₹{parseFloat(order.total_amount || 0).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center align-top">
                                            <Link
                                                to={`/delivery/orders/${order.id}`}
                                                state={{ autoPrint: true }}
                                                className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 border border-white/10 text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                                                title="Direct Print Invoice"
                                            >
                                                <FiPrinter size={18} />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-5 text-right align-top">
                                            <Link
                                                to={`/delivery/orders/${order.id}`}
                                                className="inline-flex h-12 min-w-[48px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900 text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                                                title="View Full Manifest"
                                            >
                                                <FiEye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-24 text-center">
                                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-900 text-slate-400">
                                                <FiPackage size={36} />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-500">No manifest records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-950/80 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-400">Showing {currentItems.length} of {filteredOrders.length} orders</div>
                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-500"
                            >Prev</button>
                            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`min-w-[34px] rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition ${currentPage === index + 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900/95'}`}
                                    >{index + 1}</button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-500"
                            >Next</button>
                        </div>
                    )}
                </div>
            </section>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/95 shadow-2xl">
                        <div className={`p-8 ${modalData.status === 'Cancelled' ? 'bg-red-700' : 'bg-slate-900'} text-white`}>
                            <h3 className="text-2xl font-black tracking-tight">{modalData.status} Pipeline Meta</h3>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.34em] text-slate-300">Order Ref: #ORD-0{modalData.orderId}</p>
                        </div>
                        <form onSubmit={handleModalSubmit} className="space-y-6 p-8">
                            {modalData.status === 'Shipping' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">Docket Number / AWB</label>
                                        <input
                                            required
                                            type="text"
                                            className="superadmin-input"
                                            placeholder="Enter Tracking ID..."
                                            value={modalData.tracking}
                                            onChange={(e) => setModalData(prev => ({ ...prev, tracking: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">Courier Intelligence Unit</label>
                                        <input
                                            required
                                            type="text"
                                            className="superadmin-input"
                                            placeholder="e.g. BlueDart, Delhivery..."
                                            value={modalData.courier}
                                            onChange={(e) => setModalData(prev => ({ ...prev, courier: e.target.value }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">Cancellation Rationale</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="superadmin-textarea"
                                        placeholder="Reason for order termination..."
                                        value={modalData.reason}
                                        onChange={(e) => setModalData(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300 hover:bg-slate-900 transition"
                                >Abort</button>
                                <button
                                    type="submit"
                                    className={`w-full rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.28em] transition ${modalData.status === 'Cancelled' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 shadow-lg text-white' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 shadow-lg text-slate-950'}`}
                                >Sync Pipeline</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
