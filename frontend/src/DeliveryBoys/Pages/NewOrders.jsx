import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiSearch, FiTruck, FiClock, FiMapPin, FiUser, FiDollarSign } from "react-icons/fi";

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders/available");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load available delivery orders:", error);
      toast.error("Unable to fetch new orders.");
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    setAssigningId(orderId);
    try {
      await api.patch(`/delivery/orders/${orderId}/assign`, {});
      toast.success("Order assigned successfully.");
      await fetchOrders();
    } catch (error) {
      console.error("Assign order failed:", error);
      const message = error.response?.data?.message || "This order has already been assigned.";
      toast.error(message);
      await fetchOrders();
    } finally {
      setAssigningId(null);
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
          <h1 className="text-2xl font-black">New Orders</h1>
          <p className="text-sm text-slate-500 mt-2">Available pending delivery orders waiting for assignment.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders, customer, address..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/10 bg-slate-950/70 text-sm font-semibold text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Total Available</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Visible</p>
          <p className="mt-4 text-4xl font-black text-white">{visibleOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Orders ready to accept</p>
          <p className="mt-4 text-4xl font-black text-white">{loading ? '-' : visibleOrders.length}</p>
        </div>
      </div>

      <div className="superadmin-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Pending Delivery Orders</h2>
            <p className="text-sm text-slate-400 mt-1">Accept one to move it into your active deliveries.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading available orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pending orders are available right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="superadmin-table">
              <thead className="bg-slate-950/80 text-slate-300 uppercase text-[10px] tracking-[0.24em]">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Order Time</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 hover:bg-slate-900/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{order.order_id || `#${order.id}`}</div>
                      <div className="mt-1 text-xs text-slate-500">Status: Pending</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-slate-400" />
                        <span>{order.customer_name || order.ordered_by_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-1 text-slate-400" />
                        <span>{[order.street_address, order.city, order.district, order.state, order.zip_code].filter(Boolean).join(', ') || 'Address unavailable'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{Number(order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.ordered_at || order.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => acceptOrder(order.id)}
                        disabled={assigningId === order.id}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigningId === order.id ? 'Assigning...' : 'Accept'}
                      </button>
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

export default NewOrders;
