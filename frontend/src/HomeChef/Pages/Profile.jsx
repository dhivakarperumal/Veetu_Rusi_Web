import { useEffect, useState } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { FiUser, FiMail, FiPhone, FiHash, FiShield, FiCalendar, FiMapPin } from "react-icons/fi";

const formatLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/Id\b/, "ID");
};

const Profile = () => {
  const { user } = useAuth();
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

  const [activeTab, setActiveTab] = useState("details");

  if (!user && !loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-white/80 p-8 shadow-lg shadow-slate-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Profile not available</h2>
          <p className="mt-3 text-sm text-slate-500">Please log in again to view your chef profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-white/80 p-8 shadow-lg shadow-slate-200">
        <div className="text-center text-slate-500">Loading chef profile...</div>
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
    { id: "chefFields", label: "Home Chef Profile", icon: FiShield },
    { id: "orders", label: "Recent Orders", icon: FiCalendar },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/3 xl:w-1/4 sticky top-6 space-y-6">
        {/* Profile Card */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-slate-900 text-5xl font-black text-white">
            {(user.name || user.username || "U").charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">{user.name || user.username || "Chef"}</h1>
          <p className="mt-1 text-sm text-slate-500 uppercase tracking-[0.2em]">Chef Profile</p>
          <div className="mt-4 inline-block rounded-3xl bg-slate-50 px-4 py-2 text-slate-700 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">User ID</p>
            <p className="mt-1 text-lg font-black text-slate-900">{user.user_id || "-"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
                <span className="font-bold text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content */}
      <div className="w-full lg:w-2/3 xl:w-3/4">
        {error && (
          <div className="mb-6 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black text-slate-900">Account Details</h2>
              <p className="mt-2 text-sm text-slate-500">Your basic account information.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {details.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-slate-500">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
                    </div>
                    <p className="text-base font-semibold text-slate-800 break-words">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "chefFields" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black text-slate-900">Home Chef Profile Fields</h2>
              <p className="mt-2 text-sm text-slate-500">Displaying all columns from the home_chefs table.</p>
            </div>
            {homeChef ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {chefFields.map((field) => (
                  <div key={field.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400 mb-2">{field.label}</p>
                    <p className="text-base font-semibold text-slate-800 break-words">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
                <p className="text-sm text-slate-500">No home chef record was found for this account.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">My Recent Orders</h2>
                  <p className="mt-2 text-sm text-slate-500">Only orders assigned to your chef account are shown here.</p>
                </div>
                <a
                  href="/chef/orders?status=All"
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  View All Orders
                </a>
              </div>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="h-16 rounded-3xl bg-slate-100/70 animate-pulse" />
                ))}
              </div>
            ) : ordersError ? (
              <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6 text-slate-500">No orders found for your chef account yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {orders.slice(0, 6).map((order) => (
                  <div key={order.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-950/95 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Order ID</p>
                    <p className="mt-2 text-sm font-black text-white">{order.order_id || `#${order.id}`}</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>
                        <span className="font-semibold text-slate-100">Customer:</span> {order.customer_name || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-100">Amount:</span> ₹{Number(order.chef_total_amount ?? order.total_amount ?? 0).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-100">Status:</span> {order.status || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
