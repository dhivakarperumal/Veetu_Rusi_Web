import React, { useEffect, useState, useCallback, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import api from "../../api";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { toast } from "react-hot-toast";
import { Package, Clock, Calendar, MapPin, User, FileText, XCircle, RefreshCw } from "lucide-react";
import OrderCancellationModal from "../CommenComponents/OrderCancellationModal";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
};

const getChefNames = (items, fallbackName) => {
  if (!Array.isArray(items) || !items.length) {
    return fallbackName || "Unknown Chef";
  }
  const names = [...new Set(items.map((item) => item.chef_name || item.chef || item.created_by_name).filter(Boolean))];
  if (!names.length) return fallbackName || "Unknown Chef";
  return names.join(", ");
};

const getChefGroups = (items) => {
  if (!Array.isArray(items) || !items.length) return [];
  const chefs = {};
  items.forEach((item) => {
    const key = item.chef_name || item.chef_email || item.chef_user_id || item.chef_id || item.created_by_name || "unknown";
    const chefName = item.chef_name || item.chef || item.created_by_name || "Unknown Chef";
    const chefEmail = item.chef_email || item.email || "N/A";
    const chefPhone = item.chef_phone || item.phone || "N/A";
    const quantity = Number(item.quantity) || 1;
    const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;

    if (!chefs[key]) {
      chefs[key] = {
        name: chefName,
        email: chefEmail,
        phone: chefPhone,
        items: [],
        total_amount: 0,
        total_quantity: 0,
      };
    }

    chefs[key].items.push(item);
    chefs[key].total_amount += price * quantity;
    chefs[key].total_quantity += quantity;
  });

  return Object.values(chefs).map((chef) => ({
    ...chef,
    total_amount: parseFloat(chef.total_amount.toFixed(2)),
  }));
};

const getItemSummary = (items) => {
  if (!items || !items.length) return "No items";
  const names = items.map((item) => item.name || item.product_name || "Food item");
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
};

// ── Customer cancel window helpers ───────────────────────────────────────────
const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function useCancelCountdown(orderedAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!orderedAt) return;
    const deadline = new Date(orderedAt).getTime() + CANCEL_WINDOW_MS;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [orderedAt]);

  return remaining;
}

function formatCountdown(ms) {
  if (ms === null) return '';
  if (ms <= 0) return 'Expired';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

// ─────────────────────────────────────────────────────────────────────────────

// Sub-component: shows countdown timer / cancellation not available bar
function CustomerCancelBar({ order, onCancel }) {
  const remaining = useCancelCountdown(order.ordered_at);
  const s = String(order.status || '').toLowerCase();

  if (s === 'cancelled') return null; // don't show bar on already-cancelled orders
  if (s === 'delivered' || s === 'completed') return null;

  const ineligibleReason =
    s === 'picked up' ? 'Already Picked Up' :
    s === 'out for delivery' ? 'Out for Delivery' :
    (remaining !== null && remaining <= 0) ? 'Cancellation window expired (2hr limit)' :
    null;

  if (ineligibleReason) {
    return (
      <div style={{ margin: '0 24px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>Cancellation Not Available</span>
          <span style={{ fontSize: '0.78rem', color: '#b91c1c', marginLeft: 6 }}>— {ineligibleReason}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 24px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={15} color="#d97706" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: '#92400e' }}>
          <b>Cancel window:</b>{' '}
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#b45309' }}>
            {remaining !== null ? formatCountdown(remaining) : '…'}
          </span>
          {' '}remaining
        </span>
      </div>
      <button
        onClick={onCancel}
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: 'none', borderRadius: 10, padding: '7px 14px',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
          whiteSpace: 'nowrap'
        }}
      >
        <XCircle size={14} />
        Cancel Order
      </button>
    </div>
  );
}


export default function MyFoodOrders({ isEmbedded = false }) {
  const { user } = useAuth();
  const { fetchUserFoodCart } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null); // order being cancelled
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (user === null) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get("/user-food-orders/my-orders");
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load food orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const handleReorder = async (e, order) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const promises = order.items.map((item) => {
        const payload = {
            user_id: user.user_id,
            product_id: item.product_id || item.food_id || item.id,
            name: item.name || item.product_name,
            image: item.image || '',
            price: parseFloat(item.price || 0),
            total_price: parseFloat(item.price || 0) * (item.quantity || 1),
            quantity: item.quantity || 1,
            chef_user_id: item.chef_user_id || item.created_by || '',
            chef_id: item.chef_id || '',
            chef_name: item.chef_name || item.chef || item.created_by_name || '',
            chef_phone: item.chef_phone || '',
            chef_email: item.chef_email || '',
            franchise_id: item.franchise_id || '',
            franchise_user_id: item.franchise_user_id || '',
            franchise_email: item.franchise_email || '',
            franchise_name: item.franchise_name || '',
            franchise_phone: item.franchise_phone || '',
            ordered_by_name: user.name || user.fullname || user.username || '',
            ordered_by_user_id: user.user_id,
            ordered_by_email: user.email || '',
            ordered_by_phone: user.phone || user.mobile || ''
        };
        return api.post('/user-food', payload);
      });
      await Promise.all(promises);
      await fetchUserFoodCart();
      toast.success("Items added to cart for reorder!");
      navigate("/food-cart");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reorder items");
      setLoading(false);
    }
  };

  // If navigated from checkout with a newly created order id, fetch and open it
  useEffect(() => {
    const newOrderId = location?.state?.newOrderId;
    if (!newOrderId) return;

    const fetchAndOpen = async () => {
      try {
        const res = await api.get(`/user-food-orders/${newOrderId}`);
        if (res?.data) {
          setSelectedOrder(res.data);
        }
      } catch (err) {
        console.error('Failed to load newly created order', err);
      } finally {
        // Clear navigation state so popup doesn't reopen on refresh
        navigate(location.pathname, { replace: true, state: null });
      }
    };

    fetchAndOpen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.newOrderId]);

  const openOrder = (order) => {
    setSelectedOrder(order);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const openReviewModal = (order) => {
    setReviewOrder(order);
    const firstItem = order.items?.[0] || {};
    setReviewProductId(firstItem.product_id || firstItem.id || "");
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewOrder(null);
    setReviewProductId("");
    setReviewRating(5);
    setReviewComment("");
    setReviewSubmitting(false);
  };

  const submitReview = async () => {
    if (!reviewProductId) {
      toast.error("Select a product to review.");
      return;
    }

    if (!reviewRating || reviewRating < 1) {
      toast.error("Please choose a rating.");
      return;
    }

    setReviewSubmitting(true);

    try {
      await api.post("/reviews", {
        product_id: reviewProductId,
        user_id: user?.user_id || user?.id,
        user_name: user?.name || user?.username || user?.email || "Customer",
        user_email: user?.email || null,
        rating: reviewRating,
        comment: reviewComment || "",
      });

      toast.success("Review submitted successfully.");
      closeReviewModal();
    } catch (err) {
      console.error("Failed to submit review", err);
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleTrack = (order) => {
    const lat = order.delivery_partner_lat;
    const lng = order.delivery_partner_lng;
    
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, "_blank");
    } else {
      toast.error("Live tracking location is not available yet.");
    }
  };

  const handleCancelSuccess = useCallback((updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: 'Cancelled', cancellation_reason: updated.cancellation_reason } : o));
    setCancelOrder(null);
    toast.success('Order cancelled successfully.');
  }, []);

  const getCancellationEligibility = (order) => {
    const s = String(order.status || '').toLowerCase();
    if (s === 'cancelled') return { eligible: false, reason: 'Already Cancelled' };
    if (s === 'delivered' || s === 'completed') return { eligible: false, reason: 'Order Delivered' };
    if (s === 'picked up') return { eligible: false, reason: 'Already Picked Up' };
    if (s === 'out for delivery') return { eligible: false, reason: 'Out for Delivery' };
    const elapsed = Date.now() - new Date(order.ordered_at || 0).getTime();
    if (elapsed > CANCEL_WINDOW_MS) return { eligible: false, reason: 'Time Expired (2hr limit)' };
    return { eligible: true };
  };

  const content = (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Food order history</p>
                <h2 className="text-3xl font-black text-slate-900">Your food order dashboard</h2>
              </div>
              <button
                onClick={() => navigate("/food-cart")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 transition"
              >
                <Package className="h-4 w-4" />
                Back to Food Cart
              </button>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="h-56 rounded-[2rem] bg-white shadow-sm animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-16 text-center text-slate-500">
                <FileText className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900">No food orders yet</h3>
                <p className="mt-2 text-sm text-slate-500">Place your first food order from the food cart to view it here.</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 bg-slate-50">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Order ID</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">{order.order_id}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.status === "Delivered" || order.status === "Completed" ? "bg-emerald-100 text-emerald-700" : order.status === "Cancelled" ? "bg-red-100 text-red-700" : order.status === "New Order" || order.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {order.status === "Pending" ? "New Order" : (order.status || "New Order")}
                      </span>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order placed</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(order.ordered_at)}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delivery slot</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{order.delivery_date || "-"} {order.delivery_time ? `at ${order.delivery_time}` : ""}</p>
                        </div>
                      </div>

                      {/* <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Food items</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{getItemSummary(order.items)}</p>
                      </div> */}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Items quantity</p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            {order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 0}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total amount</p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            ₹{parseFloat(order.final_total != null ? order.final_total : order.total_amount || 0).toFixed(2)}
                            {parseFloat(order.discount_amount || 0) > 0 && (
                              <span className="text-sm font-normal text-slate-500 line-through ml-2">
                                ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Chef</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{getChefNames(order.items, order.chef_name)}</p>
                        </div>
                        {/* <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order status</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{order.status === "Pending" ? "New Order" : (order.status || 'New Order')}</p>
                        </div> */}
                      </div>
                      
                      {/* Delivery Partner Info (Outer Card) */}
                      {(order.status === "Delivery Partner Assigned" || order.status === "Picked Up" || order.status === "Out for Delivery" || order.status === "Delivered") && order.delivery_partner_name && (
                        <div className="rounded-3xl bg-blue-50 p-4 border border-blue-100">
                          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Delivery Partner</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{order.delivery_partner_name}</p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" /> {order.delivery_partner_phone || "N/A"}
                              </p>
                            </div>
                            {order.status !== "Delivered" && (
                              <button
                                onClick={() => handleTrack(order)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-blue-500 shadow-sm"
                              >
                                <MapPin className="h-3 w-3" /> Track
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Cancellation countdown / status ── */}
                    <CustomerCancelBar order={order} onCancel={() => setCancelOrder(order)} />

                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4 bg-white">
                      <button
                        onClick={() => openOrder(order)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                      >
                        <Clock className="h-4 w-4" />
                        View details
                      </button>
                      {order.status === "Delivered" && (
                        <>
                          <button
                            onClick={() => openReviewModal(order)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Review
                          </button>
                          <button
                            onClick={(e) => handleReorder(e, order)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reorder
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate("/food-cart")}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Package className="h-4 w-4" />
                        Back to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  );

  return (
    <>
      {!isEmbedded && <PageHeader title="My Food Orders" />}
      <div className={isEmbedded ? "" : "min-h-screen bg-slate-50 py-14"}>
        {isEmbedded ? content : <PageContainer>{content}</PageContainer>}
      </div>

      {/* ── Cancellation modal ── */}
      {cancelOrder && (
        <OrderCancellationModal
          order={cancelOrder}
          role="customer"
          onClose={() => setCancelOrder(null)}
          onSuccess={handleCancelSuccess}
          apiCall={(id, payload) => api.post(`/user-food-orders/cancel/${id}`, payload)}
        />
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">Order details</h3>
                <p className="text-sm text-slate-500">Order #{selectedOrder.order_id}</p>
              </div>
              <button
                onClick={closeDetails}
                className="rounded-full bg-slate-100 p-3 text-slate-700 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                  <h4 className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery information</h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Name</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOrder.customer_name || selectedOrder.ordered_by_name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Phone</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOrder.customer_phone || selectedOrder.ordered_by_phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Address</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 whitespace-pre-line">
                        {selectedOrder.street_address || "-"}
                        {selectedOrder.city ? `\n${selectedOrder.city}` : ""}
                        {selectedOrder.district ? `, ${selectedOrder.district}` : ""}
                        {selectedOrder.state ? `, ${selectedOrder.state}` : ""}
                        {selectedOrder.zip_code ? ` - ${selectedOrder.zip_code}` : ""}
                        {selectedOrder.country ? `\n${selectedOrder.country}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 p-6">
                  <h4 className="text-sm uppercase tracking-[0.24em] text-slate-500">Items</h4>
                  <div className="mt-4 space-y-4">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-4">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name || item.product_name}
                              className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.src = "/placeholder.png";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name || item.product_name}</p>
                                <p className="text-sm text-slate-600">Qty {item.quantity || 1} × ₹{item.price || '0.00'}</p>
                              </div>
                              <p className="font-semibold text-slate-900 whitespace-nowrap">₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] bg-slate-50 p-6 shadow-sm">
                  <h4 className="text-sm uppercase tracking-[0.24em] text-slate-500">Summary</h4>
                  <div className="mt-6 space-y-4 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Order Date</span>
                      <span>{formatDateTime(selectedOrder.ordered_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Date</span>
                      <span>{selectedOrder.delivery_date || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Time</span>
                      <span>{selectedOrder.delivery_time || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method</span>
                      <span>{selectedOrder.payment_method || 'Cash on Delivery'}</span>
                    </div>
                    {parseFloat(selectedOrder.discount_amount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-₹{parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-4 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹{parseFloat(selectedOrder.final_total != null ? selectedOrder.final_total : selectedOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                  <h4 className="text-sm uppercase tracking-[0.24em] text-slate-500">Chef details</h4>
                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    {getChefGroups(selectedOrder.items).map((chef, index) => (
                      <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="font-semibold text-slate-900">{chef.name}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-2">Chef</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">₹{chef.total_amount.toFixed(2)}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-2">Chef share</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm border-t border-slate-100 pt-4">
                          <div>
                            <p className="font-semibold text-slate-900">{chef.total_quantity}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-1.5">Qty</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{chef.phone}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-1.5">Phone</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 truncate" title={chef.email}>{chef.email}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-1.5">Email</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Partner Details */}
                {(selectedOrder.status === "Delivery Partner Assigned" || selectedOrder.status === "Picked Up" || selectedOrder.status === "Out for Delivery" || selectedOrder.status === "Delivered") && selectedOrder.delivery_partner_name && (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                    <h4 className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery Partner</h4>
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2 items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{selectedOrder.delivery_partner_name}</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-2">Name</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{selectedOrder.delivery_partner_phone || "N/A"}</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mt-2">Phone</p>
                        </div>
                      </div>
                      
                      {selectedOrder.status !== "Delivered" && (
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleTrack(selectedOrder)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500 shadow-md shadow-blue-500/20"
                          >
                            <MapPin className="h-4 w-4" />
                            Track Delivery Partner
                          </button>
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

      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Review your delivery</h3>
                <p className="text-sm text-slate-500">Leave a rating for order {reviewOrder.order_id}</p>
              </div>
              <button
                onClick={closeReviewModal}
                className="rounded-full bg-slate-100 p-3 text-slate-700 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-semibold text-slate-700">Select item</label>
                <select
                  value={reviewProductId}
                  onChange={(e) => setReviewProductId(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                >
                  {reviewOrder.items?.map((item, index) => (
                    <option
                      key={index}
                      value={item.product_id || item.id || index}
                    >
                      {item.name || item.product_name || `Item ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Rating</label>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${reviewRating >= star ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Comments</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                  placeholder="Share feedback about your delivery experience"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
