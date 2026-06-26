import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Check,
} from "lucide-react";

const statusConfig = {
  Delivered: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  Completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  Cancelled: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  Pending: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  "New Order": { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  Accepted: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle },
  Preparing: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Package },
  "Food Ready": { color: "bg-teal-500/10 text-teal-400 border-teal-500/20", icon: Package },
  Packing: { color: "bg-teal-500/10 text-teal-400 border-teal-500/20", icon: Package },
  "Out for Delivery": { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Truck },
  "Delivery Partner Assigned": { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Truck },
  "Searching Delivery Partner": { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Truck },
};

const nextStatusMap = {
  Pending: "Accepted",
  "Order Placed": "Accepted",
  New: "Accepted",
  Accepted: "Preparing",
  Preparing: "Food Ready",
  "Food Ready": "Packing",
  Packing: "Searching Delivery Partner",
  "Searching Delivery Partner": "Delivery Partner Assigned",
  "Delivery Partner Assigned": "Out for Delivery",
  "Out for Delivery": "Delivered",
};

const orderSteps = [
  "New Order",
  "Accepted",
  "Preparing",
  "Food Ready",
  "Packing",
  "Searching Delivery Partner",
  "Delivery Partner Assigned",
  "Out for Delivery",
  "Delivered",
];

const ChefOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, partnersRes] = await Promise.all([
          api.get("/user-food-orders/chef"),
          api.get("/user-food-orders/delivery-partners/active"),
        ]);
        const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const found = allOrders.find((o) => String(o.id) === String(id) || String(o.order_id) === String(id));
        if (!found) {
          toast.error("Order not found.");
          navigate("/chef/orders?status=All");
          return;
        }
        setOrder(found);
        setNewStatus(found.status);
        setPartners(Array.isArray(partnersRes.data) ? partnersRes.data : []);
      } catch (err) {
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStatusChange = async () => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/user-food-orders/status/${order.id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setOrder((prev) => ({ ...prev, status: newStatus }));
      setIsEditingStatus(false);
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNextStatus = async () => {
    const next = nextStatusMap[order.status];
    if (!next) return;
    try {
      setUpdatingStatus(true);
      await api.patch(`/user-food-orders/status/${order.id}`, { status: next });
      toast.success(`Status updated to ${next}`);
      setOrder((prev) => ({ ...prev, status: next }));
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-2xl w-48" />
        <div className="h-40 bg-white/5 rounded-3xl" />
        <div className="h-60 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!order) return null;

  const statusCfg = statusConfig[order.status] || statusConfig["Accepted"];
  const StatusIcon = statusCfg?.icon || Package;
  const nextStatus = nextStatusMap[order.status];
  const partnerName = order.delivery_partner
    ? partners.find((p) => p.user_id == order.delivery_partner || p.name === order.delivery_partner)?.name || order.delivery_partner
    : "Unassigned";
  const partnerMobile = order.delivery_partner
    ? partners.find((p) => p.user_id == order.delivery_partner || p.name === order.delivery_partner)?.mobile || "N/A"
    : null;

  const chefAmount = parseFloat(order.chef_total_amount ?? order.total_amount ?? 0);
  const chefQty = order.chef_total_quantity ?? order.items?.reduce((s, i) => s + (Number(i.quantity) || 1), 0) ?? 0;

  const deliverySlot =
    order.delivery_date
      ? `${order.delivery_date.includes("T") ? new Date(order.delivery_date).toLocaleDateString() : order.delivery_date}${order.delivery_time ? ` at ${order.delivery_time}` : ""}`
      : "Not specified";

  const orderedAt = order.ordered_at || order.created_at;

  const currentStepIndex = (() => {
    const statusToIndex = {
      "Pending": 0,
      "New Order": 0,
      "Order Placed": 0,
      "Accepted": 1,
      "Preparing": 2,
      "Food Ready": 3,
      "Packing": 4,
      "Searching Delivery Partner": 5,
      "Delivery Partner Assigned": 6,
      "Out for Delivery": 7,
      "Delivered": 8,
      "Completed": 8,
    };
    return statusToIndex[order.status] ?? 0;
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Order Details</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">{order.order_id}</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${statusCfg?.color}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Current Status</p>
              <span className={`inline-block mt-1 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border ${statusCfg?.color}`}>
                {order.status === "Pending" ? "New Order" : order.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {nextStatus && (
              <button
                onClick={handleNextStatus}
                disabled={updatingStatus}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-xs uppercase tracking-widest rounded-xl transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Move to {nextStatus}
              </button>
            )}
            <button
              onClick={() => setIsEditingStatus(!isEditingStatus)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-xs uppercase tracking-widest rounded-xl transition"
            >
              <Edit className="w-4 h-4" />
              Edit Status
            </button>
          </div>
        </div>

        {isEditingStatus && (
          <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#070b13]/60 border border-white/5 rounded-xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
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
            <button
              onClick={handleStatusChange}
              disabled={updatingStatus}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition disabled:opacity-50"
            >
              {updatingStatus ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditingStatus(false)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Order Progress Tracker */}
      <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Order Progress</h3>
        <div className="flex items-center gap-0">
          {orderSteps.map((step, i) => {
            const isCompleted = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            const isLast = i === orderSteps.length - 1;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                    : isCompleted ? "bg-emerald-500/20 border-emerald-500/60"
                    : "bg-white/5 border-white/10"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-wider text-center w-16 ${
                    isActive ? "text-emerald-400" : isCompleted ? "text-white/60" : "text-white/20"
                  }`}>{step}</p>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-0.5 mb-5 ${i < currentStepIndex ? "bg-emerald-500/40" : "bg-white/5"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Customer Information</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-black text-white">{order.customer_name || "N/A"}</p>
            <p className="text-xs text-white/60">{order.customer_phone || "N/A"}</p>
            <p className="text-xs text-white/60">{order.customer_email || "N/A"}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Ordered At</p>
            <p className="text-xs text-white/70 font-medium">
              {orderedAt ? new Date(orderedAt).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Delivery Address</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {order.street_address || "N/A"}<br />
            {[order.city, order.district].filter(Boolean).join(", ")}<br />
            {[order.state, order.country].filter(Boolean).join(", ")} {order.zip_code ? `- ${order.zip_code}` : ""}
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Delivery Slot</p>
            <p className="text-xs text-white/70 font-medium">{deliverySlot}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
              <CreditCard className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Payment</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Method</span>
              <span className="text-xs font-bold text-white">{order.payment_method || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Status</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                order.payment_status?.toLowerCase() === "paid"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {order.payment_status || "Pending"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50">Total Items</span>
              <span className="text-xs font-bold text-white">{chefQty}</span>
            </div>
          </div>
        </div>

        {/* Delivery Partner */}
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Truck className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Delivery Partner</h3>
          </div>
          {order.delivery_partner ? (
            <div className="space-y-2">
              <p className="text-sm font-black text-white">{partnerName}</p>
              {partnerMobile && <p className="text-xs text-white/60">{partnerMobile}</p>}
              <span className="inline-block text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Assigned
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white/30" />
              </div>
              <p className="text-sm text-white/40 font-medium">No partner assigned yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Order Items</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#070b13]/30">
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Item</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(order.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 text-sm font-medium text-white">{item.name || item.product_name || "Food Item"}</td>
                  <td className="px-6 py-5 text-sm text-white/70">₹{parseFloat(item.price || 0).toLocaleString()}</td>
                  <td className="px-6 py-5 text-sm font-bold text-white text-center">{item.quantity || 1}</td>
                  <td className="px-6 py-5 text-sm font-black text-white text-right">
                    ₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-xs text-white/30 italic">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-[#070b13]/40 border-t border-white/5 flex justify-between items-center">
          <span className="text-sm font-bold uppercase tracking-widest text-white/60">Chef Subtotal</span>
          <span className="text-2xl font-black text-emerald-400">₹{chefAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ChefOrderDetails;
