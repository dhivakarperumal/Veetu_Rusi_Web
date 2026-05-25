import React, { useState, useEffect } from "react";
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
    FiPackage,
    FiPrinter,
    FiPlus,
    FiChevronLeft,
    FiChevronRight,
    FiGrid,
    FiList
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
            case "Order Placed": return "bg-blue-50 text-blue-700 border-blue-200";
            case "Packing": return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "Shipping": return "bg-amber-50 text-amber-700 border-amber-200";
            case "Out for Delivery": return "bg-cyan-50 text-cyan-700 border-cyan-200";
            case "Delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Cancelled": return "bg-rose-50 text-rose-700 border-rose-200";
            case "New": return "bg-slate-100 text-slate-600 border-slate-200";
            case "Processing": return "bg-violet-50 text-violet-700 border-violet-200";
            case "Shipped": return "bg-orange-50 text-orange-700 border-orange-200";
            default: return "bg-slate-50 text-slate-500 border-slate-200";
        }
    };

    return (
        <div className="space-y-6 pb-20 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-2">
                <Link
                    to="/admin/orders/create"
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                    <FiPlus className="text-lg" /> Add New Order
                </Link>
            </div>

            {/* Dark Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => setActiveStatus('All')}
                    className="group relative overflow-hidden rounded-2xl bg-[#0f172a] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1"
                >
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-lg">
                            <FiPackage className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Orders</p>
                            <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : filteredOrders.length}</h3>
                            <p className="text-[10px] text-indigo-400 mt-1">All registered orders</p>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => setActiveStatus('Order Placed')}
                    className="group relative overflow-hidden rounded-2xl bg-[#0a1e17] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1"
                >
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#059669] text-white shadow-lg">
                            <FiClock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Pending</p>
                            <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.filter(o => ['Order Placed', 'Processing', 'New'].includes(o.status)).length}</h3>
                            <p className="text-[10px] text-emerald-400 mt-1">Awaiting processing</p>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => setActiveStatus('Shipping')}
                    className="group relative overflow-hidden rounded-2xl bg-[#26150c] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1"
                >
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#d97706] text-white shadow-lg">
                            <FiTruck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">In Transit</p>
                            <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.filter(o => ['Shipping', 'Out for Delivery', 'Shipped', 'Packing'].includes(o.status)).length}</h3>
                            <p className="text-[10px] text-amber-400 mt-1">Out for delivery</p>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => setActiveStatus('Delivered')}
                    className="group relative overflow-hidden rounded-2xl bg-[#1e1b4b] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1"
                >
                    <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-lg">
                            <FiCheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Completed</p>
                            <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.filter(o => o.status === 'Delivered').length}</h3>
                            <p className="text-[10px] text-blue-400 mt-1">Successfully delivered</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mt-8">
                <div className="relative w-full md:w-[400px]">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, mobile or order..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <select 
                            value={activeStatus}
                            onChange={(e) => setActiveStatus(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl px-5 py-3 pr-10 outline-none cursor-pointer focus:border-blue-400 transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Order Placed">Order Placed</option>
                            <option value="Packing">Packing</option>
                            <option value="Shipping">Shipping</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button className="p-2 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200">
                            <FiList className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600">
                            <FiGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0f172a] rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Orders...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#2a3042]">
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Order Info</th>
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {currentItems.length > 0 ? (
                                    currentItems.map((order, index) => (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5 text-sm font-black text-slate-400">
                                                {indexOfFirstItem + index + 1}
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-slate-800">#ORD-0{order.id}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Unknown Date'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-slate-800">{order.customer_name || 'Guest'}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{order.customer_email || order.customer_phone || 'No contact info'}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-slate-800">₹{parseFloat(order.total_amount || 0).toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.payment_method || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="relative">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                                                            className={`appearance-none cursor-pointer text-center flex items-center min-w-[140px] px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border outline-none transition-all ${getStatusStyle(order.status)}`}
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
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-3">
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        className="text-slate-400 hover:text-blue-500 transition-colors"
                                                        title="View Order"
                                                    >
                                                        <FiEye size={16} />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        state={{ autoPrint: true }}
                                                        className="text-slate-400 hover:text-emerald-500 transition-colors"
                                                        title="Print Invoice"
                                                    >
                                                        <FiPrinter size={16} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <FiPackage size={28} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700">No Orders Found</h3>
                                            <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search or filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 bg-slate-50/50">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-all"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 transition-all"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Logistics Pipeline Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 ${modalData.status === 'Cancelled' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-slate-800 to-slate-900'} text-white`}>
                            <h3 className="text-xl font-black tracking-tight">{modalData.status} Pipeline Meta</h3>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Order Ref: #ORD-0{modalData.orderId}</p>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-8 space-y-6">
                            {modalData.status === 'Shipping' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Docket Number / AWB</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-sm font-bold text-slate-700"
                                            placeholder="Enter Tracking ID..."
                                            value={modalData.tracking}
                                            onChange={(e) => setModalData(p => ({ ...p, tracking: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Courier Partner</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-sm font-bold text-slate-700"
                                            placeholder="e.g. BlueDart, Delhivery..."
                                            value={modalData.courier}
                                            onChange={(e) => setModalData(p => ({ ...p, courier: e.target.value }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cancellation Rationale</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none text-sm font-bold text-slate-700 resize-none"
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
                                    className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] text-white shadow-lg transition-all active:scale-95 ${modalData.status === 'Cancelled' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                                >
                                    Confirm Update
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
