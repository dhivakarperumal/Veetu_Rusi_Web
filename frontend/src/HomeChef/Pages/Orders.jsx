import React, { useState, useEffect, useContext } from "react";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import { Link } from "react-router-dom";
import {
    FiSearch,
    FiFilter,
    FiEye,
    FiTruck,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiShoppingBag,
    FiDownload,
    FiMoreVertical,
    FiPlus,
    FiPackage,
    FiPrinter
} from "react-icons/fi";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const Orders = ({ statusFilter = "All" }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const { ordersCache, setOrdersCache } = useAdmin();
    const [orders, setOrders] = useState(ordersCache[statusFilter] || []);
    const [loading, setLoading] = useState(!ordersCache[statusFilter]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        orderId: null,
        status: "",
        tracking: "",
        courier: "",
        reason: ""
    });

    const [activeStatus, setActiveStatus] = useState(statusFilter);

    useEffect(() => {
        setActiveStatus(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [activeStatus]);

    const fetchOrders = async () => {
        if (!ordersCache[activeStatus]) setLoading(true);
        try {
            const res = await api.get(`/orders?status=${activeStatus}`);
            const data = res.data || [];
            setOrders(data);
            setOrdersCache(prev => ({ ...prev, [activeStatus]: data }));
        } catch (error) {
            console.error("Fetch Orders Error:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusUpdate = async (orderId, newStatus) => {
        if (newStatus === "Shipping" || newStatus === "Cancelled") {
            setModalData({
                orderId,
                status: newStatus,
                tracking: "",
                courier: "",
                reason: ""
            });
            setShowModal(true);
            return;
        }

        performStatusUpdate(orderId, { status: newStatus });
    };

    const performStatusUpdate = async (orderId, updateData) => {
        setLoading(true);
        try {
            await api.put(`/orders/${orderId}/status`, updateData);
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
            if (!modalData.tracking || !modalData.courier) {
                return toast.error("Logistics data incomplete");
            }
            updateData.tracking_number = modalData.tracking;
            updateData.courier_name = modalData.courier;
            updateData.shipped_at = new Date().toISOString();
        } else if (modalData.status === "Cancelled") {
            if (!modalData.reason) {
                return toast.error("Cancellation rationale required");
            }
            updateData.cancellation_reason = modalData.reason;
            updateData.cancelled_at = new Date().toISOString();
        }

        performStatusUpdate(modalData.orderId, updateData);
        setShowModal(false);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm);
        return matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when search or status filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatus]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "Order Placed": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Packing": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "Shipping": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Out for Delivery": return "bg-cyan-100 text-cyan-700 border-cyan-200";
            case "Delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
            case "New": return "bg-gray-100 text-gray-500 border-gray-200";
            case "Processing": return "bg-indigo-50 text-indigo-400 border-indigo-100";
            case "Shipped": return "bg-amber-50 text-amber-500 border-amber-100";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Order Placed": return <FiShoppingBag className="text-xs" />;
            case "Packing": return <FiPackage className="text-xs" />;
            case "Shipping": return <FiTruck className="text-xs" />;
            case "Out for Delivery": return <FiTruck className="text-xs" />;
            case "Delivered": return <FiCheckCircle className="text-xs" />;
            case "Cancelled": return <FiXCircle className="text-xs" />;
            case "New": return <FiShoppingBag className="text-xs" />;
            case "Processing": return <FiClock className="text-xs" />;
            case "Shipped": return <FiTruck className="text-xs" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Toaster position="top-right" />
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>

                </div>
                <div className="flex items-center gap-3">

                    <Link
                        to="/admin/orders/create"
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                        <FiPlus /> New Order
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Matches", value: filteredOrders.length, icon: <FiPackage />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", status: "All" },
                    { label: "Pending Processing", value: orders.filter(o => ['Order Placed', 'Processing', 'New'].includes(o.status)).length, icon: <FiClock />, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", status: "Order Placed" },
                    { label: "Shipping", value: orders.filter(o => ['Shipping', 'Out for Delivery', 'Shipped', 'Packing'].includes(o.status)).length, icon: <FiTruck />, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", status: "Shipping" },
                    { label: "Delivered", value: orders.filter(o => o.status === 'Delivered').length, icon: <FiCheckCircle />, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", status: "Delivered" }
                ].map((stat, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveStatus(stat.status)}
                        className={`bg-white rounded-[2rem] p-6 border shadow-sm flex items-center gap-5 group hover:shadow-md transition-all text-left w-full
                        ${activeStatus === stat.status ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-100'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${stat.bg} ${stat.color} ${stat.border} group-hover:scale-110 transition-transform shrink-0`}>
                            {stat.icon}
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{loading ? '-' : stat.value}</h3>
                        </div>
                    </button>
                ))}
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {/* Search and Filters */}
                <div className="p-8 border-b border-gray-50 flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Order Placed', 'Packing', 'Shipping', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveStatus(status)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeStatus === status
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500/20 transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Database...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse block md:table">
                            <thead className="hidden md:table-header-group">
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Print</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="block md:table-row-group md:divide-y divide-gray-50 text-sm font-medium px-3 py-4 md:p-0">
                                {currentItems.length > 0 ? (
                                    currentItems.map((order) => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</span>
                                                    <div className="text-right md:text-left">
                                                        <p className="text-slate-800 font-black">#ORD-0{order.id}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown Date'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between gap-3 w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                                                    <div className="flex items-center gap-3 text-right md:text-left">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[11px] font-black text-blue-600 uppercase shadow-sm">
                                                            {order.customer_name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-700 font-bold">{order.customer_name || 'Guest Customer'}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold tracking-tight">{order.customer_phone || 'No phone'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block flex-col md:flex-row items-start md:items-center justify-between gap-2 w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest w-full">Pipeline Status</span>
                                                    <div className="relative group/status flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                        <div className="relative flex items-center">
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                                                                className={`appearance-none cursor-pointer flex items-center w-full min-w-[150px] gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 outline-none transition-all ${getStatusStyle(order.status)}`}
                                                            >
                                                                {(() => {
                                                                    const flow = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];
                                                                    const currentIndex = flow.indexOf(order.status);
                                                                    const options = currentIndex === -1 
                                                                        ? [...flow, "Cancelled", order.status] 
                                                                        : [...flow.slice(currentIndex), ...(currentIndex < 2 ? ["Cancelled"] : [])];
                                                                    
                                                                    return Array.from(new Set(options)).map(status => (
                                                                        <option key={status} value={status}>{status}</option>
                                                                    ));
                                                                })()}
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/status:opacity-100 transition-opacity">
                                                                {getStatusIcon(order.status)}
                                                            </div>
                                                        </div>

                                                        {/* Tracking / Courier Info Tag */}
                                                        {order.status === 'Shipping' && order.tracking_number && (
                                                            <div className="flex flex-col gap-1 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
                                                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter truncate">
                                                                    {order.courier_name || 'Generic Courier'}: {order.tracking_number}
                                                                </p>
                                                                {order.shipped_at && (
                                                                    <p className="text-[7px] text-amber-400 font-bold italic uppercase">
                                                                        Sent: {new Date(order.shipped_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Cancellation Info Tag */}
                                                        {order.status === 'Cancelled' && (
                                                            <div className="flex flex-col gap-1 px-3 py-2 bg-red-50 rounded-xl border border-red-100/50">
                                                                <p className="text-[8px] font-black text-red-600 uppercase tracking-tighter line-clamp-1">
                                                                    {order.cancellation_reason || 'No reason specified'}
                                                                </p>
                                                                {order.cancelled_at && (
                                                                    <p className="text-[7px] text-red-400 font-bold italic uppercase">
                                                                        {new Date(order.cancelled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</span>
                                                    <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 italic">
                                                        {order.payment_method || 'Method N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                                                    <span className="font-black text-slate-800 text-lg italic tracking-tight">₹{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell border-b border-gray-50 md:border-b-0">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Print</span>
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        state={{ autoPrint: true }}
                                                        className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100/50 active:scale-90 inline-block"
                                                        title="Direct Print Invoice"
                                                    >
                                                        <FiPrinter size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 md:px-8 md:py-6 block md:table-cell">
                                                <div className="flex md:block items-center justify-between w-full">
                                                    <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <Link
                                                            to={`/admin/orders/${order.id}`}
                                                            className="p-2.5 text-gray-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100"
                                                            title="View Full Manifest"
                                                        >
                                                            <FiEye size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="block md:table-row">
                                        <td colSpan="6" className="px-3 py-4 md:px-8 md:py-24 text-center block md:table-cell">
                                            <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <FiPackage size={32} />
                                            </div>
                                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] italic">No manifest records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between bg-gray-50/30 gap-4">

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Prev
                            </button>
                            <div className="flex items-center gap-1 overflow-x-auto max-w-[120px] sm:max-w-none hide-scrollbar">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:bg-gray-100"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Logistics Pipeline Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 ${modalData.status === 'Cancelled' ? 'bg-red-600' : 'bg-slate-900'} text-white`}>
                            <h3 className="text-xl font-black tracking-tight">{modalData.status} Pipeline Meta</h3>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1 italic">Order Ref: #ORD-0{modalData.orderId}</p>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-8 space-y-6">
                            {modalData.status === 'Shipping' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Docket Number / AWB</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                                            placeholder="Enter Tracking ID..."
                                            value={modalData.tracking}
                                            onChange={(e) => setModalData(p => ({ ...p, tracking: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Courier Intelligence Unit</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                                            placeholder="e.g. BlueDart, Delhivery..."
                                            value={modalData.courier}
                                            onChange={(e) => setModalData(p => ({ ...p, courier: e.target.value }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cancellation Rationale</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500/20 transition-all outline-none font-bold resize-none"
                                        placeholder="Reason for order termination..."
                                        value={modalData.reason}
                                        onChange={(e) => setModalData(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100 text-gray-400 hover:bg-gray-50 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all active:scale-95 ${modalData.status === 'Cancelled' ? 'bg-red-600 shadow-red-500/20 hover:bg-red-500' : 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-500'}`}
                                >
                                    Sync Pipeline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
