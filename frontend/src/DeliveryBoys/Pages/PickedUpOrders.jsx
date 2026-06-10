import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiSearch, FiMapPin, FiUser } from "react-icons/fi";

const PickedUpOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders");
      const filtered = Array.isArray(data)
        ? data.filter((order) => ["Out for Delivery", "Picked Up"].includes(order.status))
        : [];
      setOrders(filtered);
    } catch (error) {
      console.error("Failed to load picked up orders:", error);
      toast.error("Unable to fetch picked up orders.");
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
      await fetchOrders();
    } catch (error) {
      console.error("Failed to update picked up order status:", error);
      toast.error(error.response?.data?.message || "Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
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
          <h1 className="text-2xl font-black">Picked Up Orders</h1>
          <p className="text-sm text-slate-500 mt-2">Orders that have been picked up and are currently out for delivery.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order, customer or address..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Total Picked Up</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Visible</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{visibleOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Status</p>
          <p className="mt-4 text-4xl font-black text-slate-900">Picked Up / Out for Delivery</p>
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Picked Up / Out for Delivery Orders</h2>
            <p className="text-sm text-slate-500 mt-1">Orders that are picked up or currently in transit to customers.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading picked up orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No picked up orders are in progress.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-[0.24em]">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Picked Up</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.order_id || `#${order.id}`}</div>
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
                    <td className="px-6 py-4 font-bold text-slate-900">₹{Number(order.total_amount || order.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.updated_at || order.ordered_at || Date.now()).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <label className="sr-only" htmlFor={`picked-up-action-${order.id}`}>Update status</label>
                      <select
                        id={`picked-up-action-${order.id}`}
                        disabled={updatingId === order.id}
                        defaultValue=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          updateOrderStatus(order.id, value);
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select action</option>
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

export default PickedUpOrders;
