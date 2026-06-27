import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiSearch, FiMapPin, FiUser, FiClock, FiDollarSign } from "react-icons/fi";

const AcceptedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAcceptedOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders?status=Assigned");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load accepted delivery orders:", error);
      toast.error("Unable to fetch accepted orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return status;
    if (status === "start_delivery" || status === "out_for_delivery") return "Out for Delivery";
    if (status === "delivered") return "Delivered";
    if (status === "picked_up") return "Picked Up";
    return status;
  };

  const updateOrderStatus = async (orderId, status) => {
    const normalizedStatus = normalizeStatus(status);
    setUpdatingId(orderId);
    try {
      await api.patch(`/user-food-orders/status/${orderId}`, { status: normalizedStatus });
      toast.success(`Order updated to ${normalizedStatus}.`);
      await fetchAcceptedOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error(error.response?.data?.message || "Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchAcceptedOrders();
  }, []);

  const visibleOrders = orders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return [
      order.order_id,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.street_address,
      order.city,
      order.district,
      order.state,
      String(order.id),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Accepted Orders</h1>
          <p className="text-sm text-slate-500 mt-2">Orders you have accepted and are now responsible for delivering.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order, customer or address..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/10 bg-slate-950/70 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="superadmin-card p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Total Accepted</p>
          <p className="mt-4 text-4xl font-black text-white">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Visible</p>
          <p className="mt-4 text-4xl font-black text-white">{visibleOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Active Order Load</p>
          <p className="mt-4 text-4xl font-black text-white">{loading ? "-" : visibleOrders.length}</p>
        </div>
      </div>

      <div className="superadmin-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Assigned Delivery Orders</h2>
            <p className="text-sm text-slate-400 mt-1">These orders are already assigned to you and waiting for pickup or delivery.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading accepted orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No accepted orders found right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="superadmin-table">
              <thead className="bg-slate-950/80 text-slate-300 uppercase text-[10px] tracking-[0.24em]">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Assigned At</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 hover:bg-slate-900/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{order.order_id || `#${order.id}`}</div>
                      <div className="mt-1 text-xs text-slate-500">Status: {order.status}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-slate-400" />
                        <span>{order.customer_name || order.ordered_by_name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-1 text-slate-400" />
                        <span>{[order.street_address, order.city, order.district, order.state, order.zip_code].filter(Boolean).join(", ") || "Address unavailable"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">₹{Number(order.total_amount || order.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.updated_at || order.ordered_at || order.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <label className="sr-only" htmlFor={`order-action-${order.id}`}>Update status</label>
                      <select
                        id={`order-action-${order.id}`}
                        disabled={updatingId === order.id}
                        defaultValue=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          updateOrderStatus(order.id, value);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select action</option>
                        <option value="picked_up">Pickup Food</option>
                        <option value="start_delivery">Start Delivery</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Mark as Delivered</option>
                      </select>
                      {updatingId === order.id && (
                        <p className="mt-2 text-xs text-slate-400">Updating status...</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptedOrders;
