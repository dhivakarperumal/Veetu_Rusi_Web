import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Edit, Check } from "lucide-react";

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
  const [trackingOrder, setTrackingOrder] = useState(null);

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
      // Treat Pending / Order Placed / New as equivalent
      const pendingAliases = ["Pending", "Order Placed", "New", "New Order"];
      if (pendingAliases.some(a => a.toLowerCase() === statusFilter.toLowerCase())) {
        result = result.filter((o) => o.status && pendingAliases.some(a => a.toLowerCase() === o.status.toLowerCase()));
        // Show only today's orders for Pending status
        const todayStr = new Date().toDateString();
        result = result.filter((o) => {
          const dateStr = o.ordered_at || o.created_at || o.updated_at;
          if (!dateStr) return false;
          return new Date(dateStr).toDateString() === todayStr;
        });
      } else if (statusFilter === "Delivered") {
        result = result.filter((o) => 
          o.status && (o.status.toLowerCase() === "delivered" || o.status.toLowerCase() === "completed")
        );
      } else {
        result = result.filter((o) => o.status && o.status.toLowerCase() === statusFilter.toLowerCase());
      }
    }
    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/user-food-orders/${editingOrder.id}`, editingOrder);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Order Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Dispatch orders, assign delivery drivers, and view live order states
          </p>
        </div>
      </div>

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
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Food Items</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Ordered Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Delivery Slot</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order, idx) => {
                  const chefQuantity = order.chef_total_quantity ?? order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
                  const chefAmount = parseFloat((order.chef_total_amount ?? order.total_amount) || 0);
                  
                  const nextStatusMap = {
                    "Pending": "Accepted",
                    "Order Placed": "Accepted",
                    "New": "Accepted",
                    "Accepted": "Preparing",
                    "Preparing": "Food Ready",
                    "Food Ready": "Packing",
                    "Packing": "Searching Delivery Partner",
                    "Searching Delivery Partner": "Delivery Partner Assigned",
                    "Delivery Partner Assigned": "Out for Delivery",
                    "Out for Delivery": "Delivered"
                  };
                  const nextStatus = nextStatusMap[order.status];

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5 text-sm font-bold text-white/50">{idx + 1}</td>
                      <td className="px-6 py-5 text-sm font-black text-white">{order.order_id}</td>
                      <td className="px-6 py-5 text-sm font-bold text-white/60">{order.customer_name}</td>
                      <td className="px-6 py-5 max-w-[18rem] text-sm text-white/70">
                        <div className="space-y-1">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="truncate">{item.name || item.product_name || "Food item"} x{item.quantity || 1}</p>
                          ))}
                          {order.items && order.items.length > 2 && (
                            <p className="text-xs text-slate-300">+{order.items.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-white/60">
                        {order.ordered_at || order.created_at
                          ? new Date(order.ordered_at || order.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-white/50">
                        {order.delivery_date ? `${order.delivery_date} ${order.delivery_time || ""}` : "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-white">{chefQuantity}</td>
                      <td className="px-6 py-5 text-sm font-black text-white">₹{chefAmount.toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 items-start">
                          <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                              order.status === "Delivered"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : order.status === "Cancelled"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : order.status === "Pending" || order.status === "New Order"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {order.status === "Pending" ? "New Order" : order.status}
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
                            onClick={() => {
                              setEditingOrder(order);
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No order logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setTrackingOrder(null)}></div>
          <div className="bg-[#0B1120] border border-white/5 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Live Tracking</h3>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">{trackingOrder.order_id}</p>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition w-8 h-8 flex items-center justify-center font-black">
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6 text-white">
              <div className="aspect-video bg-[#070b13] rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}></div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse mb-3">
                  <span className="text-xl">📍</span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Map Integration Coming Soon</p>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Coordinates mapping in progress...</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">Delivery Status</h4>
                <div className="space-y-3">
                  {["Pending", "Preparing", "Out for Delivery", "Delivered"].map((step, index) => {
                    const isActive = trackingOrder.status === step || (trackingOrder.status === "Accepted" && step === "Pending");
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-white/10'}`}></div>
                        <p className={`text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-white/40'}`}>{step}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[#070b13]/60 p-4 rounded-2xl border border-white/5 flex items-center gap-4 mt-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
                  {trackingOrder.delivery_partner ? (partners.find(p => p.user_id == trackingOrder.delivery_partner || p.name === trackingOrder.delivery_partner)?.name || trackingOrder.delivery_partner).charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {trackingOrder.delivery_partner ? (partners.find(p => p.user_id == trackingOrder.delivery_partner || p.name === trackingOrder.delivery_partner)?.name || trackingOrder.delivery_partner) : "Searching Partner"}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Delivery Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
