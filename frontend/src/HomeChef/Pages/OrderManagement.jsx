import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Edit, Check } from "lucide-react";

const OrderManagement = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingOrder, setEditingOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const statusParam = query.get("status");
    if (statusParam) {
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
      const res = await api.get("/superadmin/delivery-partners");
      setPartners(res.data.filter((p) => p.status === "Approved"));
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
          o.order_id.toLowerCase().includes(lower) ||
          o.customer_name.toLowerCase().includes(lower) ||
          o.restaurant_or_chef.toLowerCase().includes(lower) ||
          (o.items || []).some((item) => (item.name || item.product_name || "").toLowerCase().includes(lower))
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((o) => o.status === statusFilter);
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
                {filteredOrders.map((order) => {
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
                        {order.ordered_at ? new Date(order.ordered_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-white/50">
                        {order.delivery_date ? `${order.delivery_date} ${order.delivery_time || ""}` : "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-white">{chefQuantity}</td>
                      <td className="px-6 py-5 text-sm font-black text-white">₹{chefAmount.toLocaleString()}</td>
                      <td className="px-6 py-5">
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
                    <option key={p.id} value={p.name}>
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
    </div>
  );
};

export default OrderManagement;
