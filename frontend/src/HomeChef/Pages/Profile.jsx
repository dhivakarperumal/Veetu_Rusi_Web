import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { FiUser, FiMail, FiPhone, FiHash, FiShield, FiCalendar, FiMapPin } from "react-icons/fi";
import { useLocation } from "react-router-dom";

const formatLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/Id\b/, "ID");
};

const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [homeChef, setHomeChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/profile");
        setHomeChef(res.data.homeChef || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load chef profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setOrdersLoading(false);
        return;
      }

      setOrdersLoading(true);

      try {
        const res = await api.get("/orders/myorders");
        setOrders(Array.isArray(res.data) ? res.data : []);
        setOrdersError(null);
      } catch (err) {
        setOrders([]);
        setOrdersError(err.response?.data?.message || "Unable to load order history from Chef_Order.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab) return location.state.activeTab;
    if (location.hash === '#orders') return 'orders';
    if (typeof document !== 'undefined' && document.referrer.includes('/chef/orders')) return 'orders';
    return 'details';
  });
  
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (location.hash === '#orders') {
      setActiveTab('orders');
    }
  }, [location.state?.activeTab, location.hash]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!user && !loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-[2.5rem] bg-[#0b1120]/40 backdrop-blur-md border border-white/5 p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white italic tracking-tight">Profile not available</h2>
          <p className="mt-3 text-sm font-bold tracking-widest text-white/40 uppercase">Please log in again to view your chef profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-[2.5rem] bg-[#0b1120]/40 backdrop-blur-md border border-white/5 p-8 shadow-xl">
        <div className="text-center text-sm font-bold tracking-widest text-emerald-400 uppercase animate-pulse">Loading chef profile...</div>
      </div>
    );
  }

  const details = [
    { label: "Internal ID", value: user.id || "-", icon: FiHash },
    { label: "User ID", value: user.user_id || "-", icon: FiUser },
    { label: "Name", value: user.name || user.username || "-", icon: FiUser },
    { label: "Email", value: user.email || "-", icon: FiMail },
    { label: "Phone", value: user.phone || "-", icon: FiPhone },
    { label: "Role", value: user.role || "-", icon: FiShield },
    { label: "Joined", value: user.created_at || user.created || "-", icon: FiCalendar },
    { label: "Address", value: user.street_address || user.address || "Not set", icon: FiMapPin }
  ];

  const chefFields = homeChef
    ? Object.entries(homeChef).map(([key, value]) => ({ label: formatLabel(key), value: value === null || value === undefined || value === "" ? "-" : value }))
    : [];

  const tabs = [
    { id: "details", label: "Account Details", icon: FiUser },

    { id: "orders", label: "Recent Orders", icon: FiCalendar },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in duration-300">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/3 xl:w-1/4 sticky top-6 space-y-6">
        {/* Profile Card */}
        <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-[#1B4D22] text-5xl font-black text-white shadow-lg shadow-emerald-900/20">
            {(user.name || user.username || "U").charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-6 text-2xl font-black text-white italic tracking-tight">{user.name || user.username || "Chef"}</h1>
          <p className="mt-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.35em]">Chef Profile</p>
          <div className="mt-6 inline-block w-full rounded-2xl bg-white/5 border border-white/5 px-4 py-4 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40">User ID</p>
            <p className="mt-2 text-sm font-black text-emerald-400 break-all">{user.user_id || "-"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-4 shadow-2xl flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${isActive
                    ? "bg-[#1B4D22] text-white shadow-lg shadow-emerald-900/20 scale-[1.02]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Icon className={`h-5 w-5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                <span className="font-bold text-xs uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content */}
      <div className="w-full lg:w-2/3 xl:w-3/4">
        {error && (
          <div className="mb-6 rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-400 shadow-sm font-bold text-sm">
            {error}
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Account Details</h2>
              <p className="mt-2 text-xs font-bold text-white/40 tracking-widest uppercase">Your basic account information</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {details.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[2rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-6 shadow-xl transition-all hover:bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40">{item.label}</p>
                    </div>
                    <p className="text-sm font-black text-white break-words">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "chefFields" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">Home Chef Profile Fields</h2>
              <p className="mt-2 text-xs font-bold text-white/40 tracking-widest uppercase">Displaying all columns from the home_chefs table</p>
            </div>
            {homeChef ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {chefFields.map((field) => (
                  <div key={field.label} className="rounded-[2rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-6 shadow-xl transition-all hover:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40 mb-3">{field.label}</p>
                    <p className="text-sm font-black text-white break-words">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl text-center">
                <p className="text-xs font-bold text-white/40 tracking-widest uppercase">No home chef record was found for this account.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">My Recent Orders</h2>
                  <p className="mt-2 text-xs font-bold text-white/40 tracking-widest uppercase">Only orders assigned to your chef account are shown here</p>
                </div>
                <a
                  href="/chef/orders?status=All"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1B4D22] hover:bg-emerald-600 px-6 py-4 text-xs font-black text-white uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  View All Orders
                </a>
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="h-24 rounded-[2rem] bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : ordersError ? (
              <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-red-400 font-bold text-sm text-center">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="rounded-[2.5rem] border border-white/5 bg-[#0b1120]/40 backdrop-blur-md p-8 shadow-2xl text-center">
                <p className="text-xs font-bold text-white/40 tracking-widest uppercase">No orders found for your chef account yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {orders.slice(0, 6).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[2rem] border border-white/5 bg-[#0b1120]/60 p-6 shadow-xl cursor-pointer hover:bg-white/5 hover:scale-[1.02] transition-all group relative overflow-hidden"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-[#1B4D22] blur-[80px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40">Order ID</p>
                    <p className="mt-2 text-sm font-black text-white">{order.order_id || `#${order.id}`}</p>
                    <div className="mt-6 space-y-3 text-xs text-white/60 font-semibold tracking-wide">
                      <p className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest">Customer</span>
                        <span className="text-white">{order.customer_name || "—"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-white/40 uppercase tracking-widest">Amount</span>
                        <span className="text-emerald-400 font-black">₹{Number(order.chef_total_amount ?? order.total_amount ?? 0).toLocaleString()}</span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="text-white/40 uppercase tracking-widest">Status</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${order.status === "Delivered"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : order.status === "Cancelled"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : order.status === "Pending" || order.status === "New Order"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                          {order.status === "Pending" ? "New Order" : order.status || "Unknown"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[#070b13]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-[2.5rem] bg-[#0b1120] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-white/5 p-8 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Order Details</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20">
                      {selectedOrder.order_id || `#${selectedOrder.id}`}
                    </p>
                    <span
                      className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${selectedOrder.status === "Delivered"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : selectedOrder.status === "Cancelled"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : selectedOrder.status === "Pending" || selectedOrder.status === "New Order"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                    >
                      {selectedOrder.status === "Pending" ? "New Order" : selectedOrder.status || "Unknown"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full bg-white/5 p-3 text-white/40 hover:bg-white/10 hover:text-white transition-all hover:scale-110 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40 mb-3 flex items-center gap-2">
                    <FiUser className="w-4 h-4" /> Customer Info
                  </h4>
                  <p className="font-black text-white text-lg">{selectedOrder.customer_name || "—"}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40 mb-4 px-2">Products Included</h4>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-[#070b13]/60 shadow-inner">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-white/40 border-b border-white/5">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Product</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-center">Qty</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Price</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedOrder.items.map((item, idx) => {
                            const price = Number(item.price || 0);
                            const qty = Number(item.quantity || 1);
                            const total = price * qty;
                            const imageSrc = item.image || item.image_url || item.product_image;

                            return (
                              <tr key={idx} className="bg-transparent hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    {imageSrc ? (
                                      <img
                                        src={imageSrc}
                                        alt={item.name || item.product_name || "Product"}
                                        className="h-12 w-12 rounded-[1rem] object-cover bg-white/5 shadow-sm border border-white/5 group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/5 text-white/30 border border-white/5 group-hover:scale-105 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                    <span className="font-bold text-white/80 group-hover:text-white transition-colors">
                                      {item.name || item.product_name || "Product"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-white/60 font-black">{qty}</td>
                                <td className="px-6 py-4 text-right text-white/60 font-semibold tracking-wide">₹{price.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-black text-emerald-400 tracking-wide">₹{total.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8 text-center">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No product details available.</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-white/5 flex justify-between items-center px-2">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Total Amount</h4>
                  <p className="text-3xl font-black text-white tracking-tight">
                    ₹{Number(selectedOrder.chef_total_amount ?? selectedOrder.total_amount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
