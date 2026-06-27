import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import { Search, Filter, Edit, Eye, Check, Package, Clock, Truck, List, Grid, CheckCircle, XCircle } from "lucide-react";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingOrder, setEditingOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/orders");
      setOrders(res.data);
      setFilteredOrders(res.data);
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
          o.order_id?.toLowerCase().includes(lower) ||
          o.customer_name?.toLowerCase().includes(lower) ||
          o.restaurant_or_chef?.toLowerCase().includes(lower)
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
      await api.put(`/superadmin/orders/${editingOrder.id}`, editingOrder);
      toast.success("Order details updated successfully.");
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order details.");
    }
  };

  const handleStatusQuickChange = async (id, newStatus) => {
    try {
      await api.patch(`/superadmin/orders/status/${id}`, { status: newStatus });
      toast.success(`Order status changed to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to change order status.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Cancelled": return "bg-rose-100 text-rose-700 border border-rose-200";
      case "Accepted": return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      case "Out for Delivery": return "bg-amber-100 text-amber-700 border border-amber-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentOrders = filteredOrders.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 pb-20 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Toaster position="top-right" />

      {/* Page Title */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Order Management</h2>
      </div>

      {/* Dark Premium Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          onClick={() => setStatusFilter('All')}
          className="group relative overflow-hidden rounded-2xl bg-[#131127] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#2a264a]"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-600 shadow-lg text-white">
              <List className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Orders</p>
              <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.length}</h3>
              <p className="text-[10px] text-indigo-400 mt-1">All registered orders</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Delivered')}
          className="group relative overflow-hidden rounded-2xl bg-[#0a1e17] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#143d2f]"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500 shadow-lg text-white">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Delivered Orders</p>
              <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.filter(o => o.status === 'Delivered').length}</h3>
              <p className="text-[10px] text-emerald-400 mt-1">Successfully delivered</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className="group relative overflow-hidden rounded-2xl bg-[#26150c] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#4d2a18]"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#ff7300] shadow-lg text-white">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Pending Orders</p>
              <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : orders.filter(o => o.status === 'Pending').length}</h3>
              <p className="text-[10px] text-amber-400 mt-1">Awaiting review or action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm mt-8">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by order ID, customer or merchant..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl px-5 py-3.5 pr-10 outline-none cursor-pointer focus:border-blue-400 transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button className="p-2.5 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200">
              <List className="h-4 w-4" />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-slate-600">
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2a3042] rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Orders...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a3042]">
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Restaurant / Chef</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Delivery Partner</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredOrders.length > 0 ? (
                  currentOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5 text-sm font-black text-slate-400">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-800">{order.order_id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-600">{order.customer_name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-600">{order.restaurant_or_chef}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-500">{order.delivery_partner || "Unassigned"}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800">₹{parseFloat(order.amount || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3 text-slate-400">
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="hover:text-blue-500 transition-colors"
                            title="Edit / Assign"
                          >
                            <Edit size={16} />
                          </button>
                          {order.status === "Accepted" && (
                            <button
                              onClick={() => handleStatusQuickChange(order.id, "Out for Delivery")}
                              className="hover:text-amber-500 transition-colors"
                              title="Dispatch Order"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {order.status === "Out for Delivery" && (
                            <button
                              onClick={() => handleStatusQuickChange(order.id, "Delivered")}
                              className="hover:text-emerald-500 transition-colors"
                              title="Complete Order"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-24 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Package size={28} />
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 bg-slate-50">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border disabled:opacity-40"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg font-bold ${currentPage === i + 1
                    ? "bg-slate-900 text-white"
                    : "bg-white border"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit / Assign Modal */}
      {isModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleUpdateOrder}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#2a3042] p-8 text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">Assign & Edit Order</h3>
              <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mt-1">{editingOrder.order_id}</p>
            </div>

            <div className="p-8 space-y-6 text-slate-700 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Assign Delivery Partner</label>
                <select
                  value={editingOrder.delivery_partner || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, delivery_partner: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 text-sm focus:border-blue-400 transition-all cursor-pointer"
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
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Order Status</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 text-sm focus:border-blue-400 transition-all cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={editingOrder.customer_name}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 text-sm focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={editingOrder.amount}
                    onChange={(e) => setEditingOrder({ ...editingOrder, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 text-sm focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl transition"
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
