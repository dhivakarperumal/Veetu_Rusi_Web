import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiSearch, FiMapPin, FiUser } from "react-icons/fi";

const DeliveredOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders?status=Delivered");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load delivered orders:", error);
      toast.error("Unable to fetch delivered orders.");
      setOrders([]);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-black">Delivered Orders</h1>
          <p className="text-sm text-slate-500 mt-2">Orders you have successfully delivered.</p>
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
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Total Delivered</p>
          <p className="mt-4 text-4xl font-black text-white">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Visible</p>
          <p className="mt-4 text-4xl font-black text-white">{visibleOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Status</p>
          <p className="mt-4 text-4xl font-black text-white">Delivered</p>
        </div>
      </div>

      <div className="superadmin-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Delivered Orders</h2>
            <p className="text-sm text-slate-400 mt-1">Completed deliveries that are marked delivered.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading delivered orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No delivered orders are available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="superadmin-table">
              <thead className="bg-slate-950/80 text-slate-300 uppercase text-[10px] tracking-[0.24em]">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Delivered At</th>
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
                    <td className="px-6 py-4 text-slate-500">{new Date(order.updated_at || order.ordered_at || Date.now()).toLocaleString()}</td>
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

export default DeliveredOrders;
