import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Edit, Check, Eye, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import OrderCancellationModal from "../../Components/CommenComponents/OrderCancellationModal";

const OrderManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingOrder, setEditingOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusImage, setStatusImage] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingDetails, setTrackingDetails] = useState(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);

  const CHEF_CANCEL_STATUSES = ['new order', 'order placed', 'order received', 'accepted', 'preparing'];
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch tracking details when modal opens + poll every 10s for live updates
  useEffect(() => {
    if (!trackingOrder) return;
    let cancelled = false;
    const fetchTracking = () => {
      api.get(`/user-food-orders/tracking/${trackingOrder.order_id}`)
        .then(res => { if (!cancelled) setTrackingDetails(res.data); })
        .catch(err => console.error("Error fetching tracking:", err));
    };
    setTrackingDetails(null);
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [trackingOrder]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const statusParam = query.get("status");
    if (statusParam) {
      // Normalize: treat "Pending" and "New Order" and "Order Placed" the same way
      setStatusFilter(statusParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user-food-orders/chef");
      const mapped = res.data.map((order) => ({
        ...order,
        restaurant_or_chef: order.chef_name || order.restaurant_or_chef || "Unknown Chef"
      }));
      setOrders(mapped);
      setFilteredOrders(mapped);
    } catch (error) {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await api.get("/user-food-orders/delivery-partners/active");
      setPartners(res.data);
    } catch (error) {
      console.error("Error loading partners", error);
    }
  };

  useEffect(() => {
    let result = orders;

    // Today's date as YYYY-MM-DD string in LOCAL timezone
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.order_id || '').toLowerCase().includes(lower) ||
          (o.customer_name || '').toLowerCase().includes(lower) ||
          (o.restaurant_or_chef || '').toLowerCase().includes(lower) ||
          (o.items || []).some((item) => (item.name || item.product_name || "").toLowerCase().includes(lower))
      );
    }

    if (statusFilter !== "All") {
      // Treat Pending / Order Placed / New / New Order as equivalent → TODAY ONLY
      const pendingAliases = ["Pending", "Order Placed", "New", "New Order"];
      if (pendingAliases.some(a => a.toLowerCase() === statusFilter.trim().toLowerCase())) {
        result = result.filter((o) => o.status && pendingAliases.some(a => a.toLowerCase() === o.status.trim().toLowerCase()));
        // Show ONLY today's orders — compare local date strings
        result = result.filter((o) => {
          const raw = o.ordered_at || o.created_at || o.updated_at;
          if (!raw) return false;
          const d = new Date(raw);
          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dStr === todayStr;
        });
      } else if (statusFilter.trim().toLowerCase() === "delivered") {
        result = result.filter((o) =>
          o.status && (o.status.trim().toLowerCase() === "delivered" || o.status.trim().toLowerCase() === "completed")
        );
      } else {
        result = result.filter((o) => o.status && o.status.trim().toLowerCase() === statusFilter.trim().toLowerCase());
      }
    }
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [search, statusFilter, orders]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      if (statusImage) {
        const formData = new FormData();
        Object.keys(editingOrder).forEach(key => {
          if (editingOrder[key] !== null && editingOrder[key] !== undefined) {
            formData.append(key, editingOrder[key]);
          }
        });
        formData.append("status_image", statusImage);
        await api.put(`/user-food-orders/${editingOrder.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.put(`/user-food-orders/${editingOrder.id}`, editingOrder);
      }
      toast.success("Order details updated successfully.");
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order details.");
    }
  };

  const handleStatusQuickChange = async (id, newStatus) => {
    try {
      await api.patch(`/user-food-orders/status/${id}`, { status: newStatus });
      toast.success(`Order status changed to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to change order status.");
    }
  };

  // Pending/New Order aliases for display checks
  const pendingAliases = ["Pending", "Order Placed", "New", "New Order"];
  const isPendingFilter = pendingAliases.some(a => a.toLowerCase() === statusFilter.toLowerCase());

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Order Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Dispatch orders, assign delivery drivers, and view live order states
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition active:scale-95 shadow-lg shadow-emerald-900/30"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Today's New Orders Banner */}
      {isPendingFilter && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0">🆕</div>
          <div>
            <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Today's New Orders</p>
            <p className="text-xs text-white/40 mt-0.5">Showing only today's orders with status: New Order</p>
          </div>
          <span className="ml-auto text-3xl font-black text-amber-400">{filteredOrders.length}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by order ID, customer or merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                navigate(`?status=${e.target.value}`);
              }}
              className="appearance-none pl-4 pr-10 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
            >
              <option value="All">All Orders</option>
              <option value="Pending">New Order</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Food Ready">Food Ready</option>
              <option value="Packing">Packing</option>
              <option value="Searching Delivery Partner">Searching Delivery Partner</option>
              <option value="Delivery Partner Assigned">Delivery Partner Assigned</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled Order</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-200">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">S.No</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Customer Name</th>

                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Ordered Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Delivery Slot</th>

                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedOrders.map((order, idx) => {
                  const chefQuantity = order.chef_total_quantity ?? order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
                  const chefAmount = parseFloat((order.chef_total_amount ?? order.total_amount) || 0);
                  
                  const nextStatusMap = {
                    "Pending":                    "Accepted",
                    "New Order":                  "Accepted",
                    "Order Placed":               "Accepted",
                    "New":                        "Accepted",
                    "Accepted":                   "Preparing",
                    "Preparing":                  "Food Ready",
                    "Food Ready":                 "Packing",
                    "Packing":                    "Searching Delivery Partner",
                    "Searching Delivery Partner": "Delivery Partner Assigned",
                    "Delivery Partner Assigned":  "Out for Delivery",
                    "Out for Delivery":           "Delivered"
                  };
                  const nextStatus = nextStatusMap[order.status];

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5 text-sm font-bold text-white/50">{idx + 1}</td>
                      <td className="px-6 py-5 text-sm font-black text-white">{order.order_id}</td>
                      <td className="px-6 py-5 text-sm font-bold text-white/60">{order.customer_name}</td>
                      
                      <td className="px-6 py-5 text-sm font-bold text-white/60">
                        {order.ordered_at || order.created_at
                          ? new Date(order.ordered_at || order.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-white/50">
                        {order.delivery_date ? `${order.delivery_date} ${order.delivery_time || ""}` : "-"}
                      </td>
                      
                      <td className="px-6 py-5 text-sm font-black text-white">₹{chefAmount.toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 items-start">
                          <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                              order.status === "Delivered" || order.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : order.status === "Cancelled"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : ["Pending", "New Order", "New", "Order Placed"].includes(order.status)
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : order.status === "Accepted"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : order.status === "Preparing" || order.status === "Food Ready"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : order.status === "Out for Delivery"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {["Pending", "New", "Order Placed"].includes(order.status) ? "New Order" : order.status}
                          </span>
                          
                          {order.delivery_partner && (
                            <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 text-xs w-full">
                              <p className="font-bold text-emerald-400">
                                {partners.find(p => p.user_id == order.delivery_partner || p.name === order.delivery_partner)?.name || order.delivery_partner}
                              </p>
                              <p className="text-white/60 mt-0.5">
                                {partners.find(p => p.user_id == order.delivery_partner || p.name === order.delivery_partner)?.mobile || "N/A"}
                              </p>
                              <button 
                                onClick={() => setTrackingOrder(order)}
                                className="text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 mt-2 flex items-center gap-1 transition-colors bg-emerald-500/10 px-2 py-1 rounded w-fit"
                              >
                                View Tracking
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/chef/orders/${order.id}`)}
                            className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setStatusImage(null);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                            title="Assign Partner / Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusQuickChange(order.id, nextStatus)}
                              className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition"
                              title={`Update to: ${nextStatus}`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {CHEF_CANCEL_STATUSES.includes(String(order.status || '').toLowerCase()) && (
                            <button
                              onClick={() => setCancelTargetOrder(order)}
                              className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl transition"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No order logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#070b13]/30">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-lg transition"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-lg transition"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Assign Modal */}
      {isModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleUpdateOrder}
            className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Assign & Edit Order</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">{editingOrder.order_id}</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Assign Delivery Partner</label>
                <select
                  value={editingOrder.delivery_partner || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, delivery_partner: e.target.value })}
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <option value="">Select Delivery Partner</option>
                  {partners.map((p) => (
                    <option key={p.user_id || p.id} value={p.user_id || p.name}>
                      {p.name} ({p.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Order Status</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <option value="Pending">New Order</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Food Ready">Food Ready</option>
                  <option value="Packing">Packing</option>
                  <option value="Searching Delivery Partner">Searching Delivery Partner</option>
                  <option value="Delivery Partner Assigned">Delivery Partner Assigned</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {['Food Ready', 'Packing', 'Delivered'].includes(editingOrder.status) && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Upload Status Proof Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setStatusImage(e.target.files[0])}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                  {statusImage && <p className="text-xs text-emerald-400 mt-2 ml-2">Selected: {statusImage.name}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={editingOrder.customer_name}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Order Amount (₹)</label>
                  <input
                    type="number"
                    value={editingOrder.total_amount}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total_amount: e.target.value })}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:pl-72">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setTrackingOrder(null)}></div>
          <div className="bg-gradient-to-br from-[#0c1116] to-[#171a20] border border-white/10 w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh] max-h-[800px]">
            {/* Unified Header */}
            <div className="w-full bg-[#070b13] border-b border-emerald-500/20 p-4 md:p-5 flex justify-between items-center relative z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <span className="text-sm">🛵</span>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    <span className="text-emerald-400">Live</span> Tracking
                    {trackingDetails?.latitude && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> LIVE
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Order: {trackingOrder.order_id}</p>
                </div>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition text-white/50 hover:text-red-400 w-9 h-9 flex items-center justify-center">
                <span className="font-black text-sm">✕</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

              {/* ── MAP SECTION ── */}
              <div className="w-full md:w-3/5 h-72 md:h-full relative overflow-hidden flex flex-col border-b md:border-b-0 md:border-r border-white/5">

                {trackingDetails?.latitude && trackingDetails?.longitude ? (
                  <>
                    {/* Real OpenStreetMap iframe */}
                    <iframe
                      key={`${trackingDetails.latitude}-${trackingDetails.longitude}`}
                      title="Live Delivery Map"
                      className="w-full h-full border-0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(trackingDetails.longitude)-0.018},${parseFloat(trackingDetails.latitude)-0.012},${parseFloat(trackingDetails.longitude)+0.018},${parseFloat(trackingDetails.latitude)+0.012}&layer=mapnik&marker=${trackingDetails.latitude},${trackingDetails.longitude}`}
                      loading="lazy"
                    />
                    {/* Overlay badge: partner location */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#070b13] via-[#070b13]/80 to-transparent p-4 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <div>
                          <p className="text-xs font-black text-white">{trackingDetails.area || "En Route"}{trackingDetails.district ? `, ${trackingDetails.district}` : ""}</p>
                          <p className="text-[10px] text-white/50 font-bold">{trackingDetails.pincode ? `PIN: ${trackingDetails.pincode}` : ""} &nbsp;·&nbsp; Updated: {trackingDetails.updated_at ? new Date(trackingDetails.updated_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : "--"}</p>
                        </div>
                        {trackingDetails.total_distance_km && (
                          <div className="ml-auto bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-1">
                            <p className="text-emerald-400 font-black text-xs">{parseFloat(trackingDetails.total_distance_km).toFixed(1)} km</p>
                            <p className="text-[9px] text-emerald-400/60 uppercase tracking-wider">Total Route</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Placeholder when no GPS data yet */
                  <div className="w-full h-full bg-[#070b13] flex flex-col items-center justify-center gap-4">
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle, #10b981 1px, transparent 1px)", backgroundSize: "30px 30px"}}></div>
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
                      <span className="text-4xl">🛵</span>
                      <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-30"></div>
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-sm font-black text-white/60 uppercase tracking-widest">
                        {trackingDetails === null ? "Fetching Location..." : "Awaiting GPS Signal"}
                      </p>
                      <p className="text-[10px] text-white/30 mt-1">Location updates every 10 seconds</p>
                    </div>
                    {trackingDetails === null && (
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:'0ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:'150ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay:'300ms'}}></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── DETAILS PANEL ── */}
              <div className="w-full md:w-2/5 flex flex-col h-full bg-[#0B1120]/90 overflow-y-auto custom-scrollbar">

                {/* Delivery Status Timeline */}
                <div className="p-5 border-b border-white/5">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Delivery Status</h4>
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[10px] before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:via-white/10 before:to-transparent">
                    {[
                      { label: "Order Placed", icon: "🧾" },
                      { label: "Preparing", icon: "🍳" },
                      { label: "Out for Delivery", icon: "🛵" },
                      { label: "Delivered", icon: "✅" }
                    ].map(({ label, icon }, index) => {
                      const status = (trackingOrder.status || "").toLowerCase();
                      let currentStepIndex = 0;
                      if (["new", "new order", "order placed", "pending"].includes(status)) currentStepIndex = 0;
                      else if (["accepted", "preparing", "food ready", "ready"].includes(status)) currentStepIndex = 1;
                      else if (status === "out for delivery") currentStepIndex = 2;
                      else if (["delivered", "completed"].includes(status)) currentStepIndex = 3;
                      else if (status === "cancelled") currentStepIndex = -1;
                      const isActive = index === currentStepIndex;
                      const isPassed = index < currentStepIndex;
                      return (
                        <div key={index} className={`flex items-center gap-3 relative py-3 transition-all ${isActive ? 'translate-x-1' : ''}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 border-2 transition-all duration-300 ${
                            isActive ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] scale-110'
                            : isPassed ? 'bg-emerald-500/30 border-emerald-500/60'
                            : 'bg-[#070b13] border-white/10'
                          }`}>
                            {isPassed && <div className="w-2 h-2 rounded-full bg-emerald-400"></div>}
                            {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                          </div>
                          <span className="text-base">{icon}</span>
                          <div className="flex-1">
                            <p className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-emerald-400' : isPassed ? 'text-white/70' : 'text-white/25'}`}>{label}</p>
                            {isActive && <p className="text-[9px] text-emerald-400/60 font-bold tracking-widest uppercase mt-0.5">Current Stage</p>}
                          </div>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Partner Card */}
                <div className="p-5 border-b border-white/5">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Delivery Partner</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-emerald-400 font-black text-lg border border-emerald-500/30 shrink-0">
                      {(trackingDetails?.delivery_partner_name || trackingOrder.delivery_partner || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        {trackingDetails?.delivery_partner_name || (trackingOrder.delivery_partner ? (partners.find(p => p.user_id == trackingOrder.delivery_partner)?.name || trackingOrder.delivery_partner) : "Assigning Partner...")}
                      </p>
                      <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-bold">Delivery Partner</p>
                    </div>
                    {(trackingDetails?.delivery_partner_phone || partners.find(p => p.user_id == trackingOrder.delivery_partner)?.mobile) && (
                      <a href={`tel:${trackingDetails?.delivery_partner_phone || partners.find(p => p.user_id == trackingOrder.delivery_partner)?.mobile}`}
                        className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-400 transition shrink-0" title="Call Partner">
                        📞
                      </a>
                    )}
                  </div>
                </div>

                {/* Route Info */}
                {trackingDetails && (trackingDetails.pickup_latitude || trackingDetails.dropoff_latitude) && (
                  <div className="p-5">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Route Info</h4>
                    <div className="space-y-2">
                      {trackingDetails.pickup_latitude && (
                        <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                          <span className="text-sm mt-0.5">🍽️</span>
                          <div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Pickup (Your Kitchen)</p>
                            <p className="text-xs text-white/70 font-bold">{parseFloat(trackingDetails.pickup_latitude).toFixed(4)}°N, {parseFloat(trackingDetails.pickup_longitude).toFixed(4)}°E</p>
                          </div>
                        </div>
                      )}
                      {trackingDetails.dropoff_latitude && (
                        <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                          <span className="text-sm mt-0.5">🏠</span>
                          <div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Dropoff (Customer)</p>
                            <p className="text-xs text-white/70 font-bold">{parseFloat(trackingDetails.dropoff_latitude).toFixed(4)}°N, {parseFloat(trackingDetails.dropoff_longitude).toFixed(4)}°E</p>
                          </div>
                        </div>
                      )}
                      {trackingDetails.total_distance_km && (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📏</span>
                            <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">Total Distance</p>
                          </div>
                          <p className="text-sm font-black text-emerald-400">{parseFloat(trackingDetails.total_distance_km).toFixed(2)} km</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

      {cancelTargetOrder && (
        <OrderCancellationModal
          order={cancelTargetOrder}
          role="chef"
          onClose={() => setCancelTargetOrder(null)}
          onSuccess={() => {
            setCancelTargetOrder(null);
            toast.success('Order cancelled successfully.');
            fetchOrders();
          }}
          apiCall={(id, payload) => api.post(`/user-food-orders/cancel/${id}`, payload)}
        />
      )}
    </>
  );
};

export default OrderManagement;
