import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api';
import { toast } from 'react-hot-toast';
import {
  Search,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ChefHat,
  Store,
  RefreshCw
} from 'lucide-react';

const STATUS_OPTIONS = [
  'All',
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Preparing: 'bg-violet-100 text-violet-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const STATUS_ICONS = {
  Pending: <Clock className="w-3 h-3" />,
  Confirmed: <CheckCircle className="w-3 h-3" />,
  Preparing: <ChefHat className="w-3 h-3" />,
  'Out for Delivery': <Truck className="w-3 h-3" />,
  Delivered: <CheckCircle className="w-3 h-3" />,
  Cancelled: <XCircle className="w-3 h-3" />,
};

const formatDate = (val) => {
  if (!val) return '—';

  return new Date(val).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (val) =>
  val != null ? `₹${Number(val).toFixed(2)}` : '₹0.00';

/* ───────────────────────────────────────────── */
/* INFO ROW */
/* ───────────────────────────────────────────── */

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-slate-400">{icon}</span>

    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="text-sm font-semibold text-slate-700 truncate max-w-[160px]">
        {value}
      </p>
    </div>
  </div>
);

/* ───────────────────────────────────────────── */
/* STAT CARD */
/* ───────────────────────────────────────────── */

const StatCard = ({ label, value, color, icon }) => (
  <div className={`rounded-2xl p-5 text-white shadow-lg ${color}`}>
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.2em] text-white/70">
        {label}
      </p>

      <div className="opacity-80">{icon}</div>
    </div>

    <p className="mt-4 text-4xl font-black">{value}</p>
  </div>
);

/* ───────────────────────────────────────────── */
/* ORDER MODAL */
/* ───────────────────────────────────────────── */

const OrderModal = ({ order, onClose, onStatusChange }) => {
  const [status, setStatus] = useState(order.status || 'Pending');
  const [saving, setSaving] = useState(false);

  const items = Array.isArray(order.items) ? order.items : [];

  const saveStatus = async () => {
    if (status === order.status) {
      onClose();
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/user-food-orders/status/${order.id}`, {
        status,
      });

      toast.success('Order status updated');

      onStatusChange(order.id, status);

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Order Details
            </p>

            <h3 className="mt-1 text-lg font-black text-white">
              {order.order_id}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 space-y-6">

          {/* STATUS */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Current Status
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ${
                  STATUS_STYLES[order.status] ||
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {STATUS_ICONS[order.status]}
                {order.status || 'Unknown'}
              </span>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-black text-emerald-600">
                {formatAmount(order.total_amount)}
              </p>
            </div>
          </div>

          {/* UPDATE STATUS */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">
              Update Status
            </p>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.filter((s) => s !== 'All').map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                    status === s
                      ? `${
                          STATUS_STYLES[s] ||
                          'bg-slate-200 text-slate-700'
                        } ring-2 ring-offset-1 ring-current`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={saveStatus}
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-slate-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Status'}
            </button>
          </div>

          {/* CUSTOMER */}
          <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Customer
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow
                icon={<User className="w-4 h-4" />}
                label="Name"
                value={
                  order.customer_name ||
                  order.ordered_by_name ||
                  '—'
                }
              />

              <InfoRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={
                  order.customer_email ||
                  order.ordered_by_email ||
                  '—'
                }
              />

              <InfoRow
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={
                  order.customer_phone ||
                  order.ordered_by_phone ||
                  '—'
                }
              />

              <InfoRow
                icon={<CreditCard className="w-4 h-4" />}
                label="Payment"
                value={order.payment_method || '—'}
              />
            </div>

            {order.street_address && (
              <div className="flex items-start gap-3 pt-1">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />

                <p className="text-sm text-slate-700">
                  {[
                    order.street_address,
                    order.city,
                    order.district,
                    order.state,
                    order.zip_code,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* ITEMS */}
          {items.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Ordered Items ({items.length})
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-xs font-black">
                        {String(item.name || 'F')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {item.name || 'Item'}
                        </p>

                        {item.quantity && (
                          <p className="text-xs text-slate-500">
                            Qty: {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-black text-emerald-600">
                      {formatAmount(
                        item.price ||
                          item.final_price ||
                          item.mrp
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400">
            Ordered: {formatDate(order.ordered_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────── */
/* MAIN PAGE */
/* ───────────────────────────────────────────── */

const FoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [chefFilter, setChefFilter] = useState('All');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      if (chefFilter !== 'All') {
        params.chef_id = chefFilter;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get('/user-food-orders', {
        params,
      });

      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load food orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, chefFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    api
      .get('/superadmin/homechefs')
      .then((res) => {
        setChefs(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter(
        (o) => o.status === 'Pending'
      ).length,
      preparing: orders.filter(
        (o) =>
          o.status === 'Preparing' ||
          o.status === 'Confirmed'
      ).length,
      delivered: orders.filter(
        (o) => o.status === 'Delivered'
      ).length,
      cancelled: orders.filter(
        (o) => o.status === 'Cancelled'
      ).length,
    }),
    [orders]
  );

  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: newStatus }
          : o
      )
    );
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">
            Food Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage all home chef food orders
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

        <StatCard
          label="Total Orders"
          value={stats.total}
          color="bg-gradient-to-br from-slate-800 to-slate-900"
          icon={<ShoppingBag className="w-6 h-6" />}
        />

        <StatCard
          label="Pending"
          value={stats.pending}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          icon={<Clock className="w-6 h-6" />}
        />

        <StatCard
          label="In Progress"
          value={stats.preparing}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          icon={<ChefHat className="w-6 h-6" />}
        />

        <StatCard
          label="Delivered"
          value={stats.delivered}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<CheckCircle className="w-6 h-6" />}
        />

        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          color="bg-gradient-to-br from-rose-500 to-red-600"
          icon={<XCircle className="w-6 h-6" />}
        />
      </div>

      {/* FILTER */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center">

        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search by customer, order ID, chef..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">

          {chefs.length > 0 && (
            <select
              value={chefFilter}
              onChange={(e) =>
                setChefFilter(e.target.value)
              }
              className="px-3 py-3 rounded-xl border border-slate-200"
            >
              <option value="All">All Chefs</option>

              {chefs.map((c) => (
                <option
                  key={c.chef_id || c.id}
                  value={c.chef_id || c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="px-3 py-3 rounded-xl border border-slate-200"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center">
            No Orders Found
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Chef</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const items = Array.isArray(order.items)
                    ? order.items
                    : [];

                  const isExpanded =
                    expandedRow === order.id;

                  return (
                    <React.Fragment key={order.id}>

                      <tr className="hover:bg-slate-50">

                        <td className="px-5 py-4">
                          <p className="font-black">
                            {order.order_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {order.customer_name ||
                            order.ordered_by_name}
                        </td>

                        <td className="px-5 py-4">
                          {order.chef_name}
                        </td>

                        <td className="px-5 py-4">
                          {items.length}
                        </td>

                        <td className="px-5 py-4 font-black text-emerald-600">
                          {formatAmount(
                            order.total_amount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              STATUS_STYLES[
                                order.status
                              ]
                            }`}
                          >
                            {
                              STATUS_ICONS[
                                order.status
                              ]
                            }

                            {order.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(order.ordered_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                setSelectedOrder(order)
                              }
                              className="rounded-xl bg-slate-900 p-2 text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setExpandedRow(
                                  isExpanded
                                    ? null
                                    : order.id
                                )
                              }
                              className="rounded-xl bg-slate-100 p-2"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                          </div>
                        </td>
                      </tr>

                      {isExpanded &&
                        items.length > 0 && (
                          <tr className="bg-slate-50">
                            <td
                              colSpan={8}
                              className="px-5 py-3"
                            >
                              <div className="flex flex-wrap gap-2">

                                {items.map(
                                  (item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs"
                                    >
                                      <span className="font-bold">
                                        {item.name}
                                      </span>

                                      <span>
                                        ×{' '}
                                        {
                                          item.quantity
                                        }
                                      </span>

                                      <span className="font-black text-emerald-600">
                                        {formatAmount(
                                          item.price
                                        )}
                                      </span>
                                    </span>
                                  )
                                )}

                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusChange={handleStatusChange}
        />
      )}

    </div>
  );
};

export default FoodOrders;