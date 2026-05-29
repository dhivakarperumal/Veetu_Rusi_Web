import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  ChevronLeft, Phone, Mail, MapPin, Utensils, Package,
  ShoppingCart, Truck, FileText, User, Star, Clock,
  CheckCircle, AlertCircle, XCircle, ChefHat, Home,
  PlusCircle, Eye, Calendar, Shield
} from "lucide-react";

const HomeChefDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [chefFoods, setChefFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [chefOrders, setChefOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const tabs = [
    { id: "overview", icon: User, label: "Overview" },
    { id: "foods", icon: Utensils, label: "Chef Foods" },
    { id: "products", icon: Package, label: "Products" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "documents", icon: FileText, label: "Documents" },
  ];

  useEffect(() => {
    const fetchChef = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/superadmin/homechefs/${id}`);
        setChef(res.data);
      } catch {
        toast.error("Unable to load home chef details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchChef();
  }, [id]);

  useEffect(() => {
    if (activeTab === "foods" && chef) {
      fetchChefFoods();
    }
    if (activeTab === "orders" && chef) {
      fetchChefOrders();
    }
  }, [activeTab, chef]);

  const fetchChefFoods = async () => {
    setLoadingFoods(true);
    try {
      const params = {};
      if (chef.chef_id) params.chef_id = chef.chef_id;
      const res = await api.get("/chef-foods", { params });
      setChefFoods(Array.isArray(res.data) ? res.data : []);
    } catch {
      setChefFoods([]);
    } finally {
      setLoadingFoods(false);
    }
  };

  const fetchChefOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/user-food-orders", { params: { chef_id: chef.chef_id || chef.id } });
      const data = res.data;
      setChefOrders(Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []);
    } catch {
      setChefOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getDocLink = (filename) =>
    filename ? `${import.meta.env.VITE_API_URL}/../uploads/homechefs/${filename}` : null;

  const formatAmount = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const getChefOrderAmount = (order) => {
    if (order.chef_total_amount != null) {
      return formatAmount(order.chef_total_amount);
    }
    if (Array.isArray(order.items)) {
      const total = order.items.reduce((sum, item) => {
        const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + price * qty;
      }, 0);
      return formatAmount(total);
    }
    return formatAmount(order.total_amount);
  };

  const StatusBadge = ({ status }) => {
    const map = {
      Approved: "bg-emerald-100 text-emerald-700",
      Active: "bg-emerald-100 text-emerald-700",
      Pending: "bg-amber-100 text-amber-700",
      Rejected: "bg-rose-100 text-rose-700",
      Inactive: "bg-slate-100 text-slate-500",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${map[status] || "bg-slate-100 text-slate-500"}`}>
        {(status === "Approved" || status === "Active") && <CheckCircle className="h-3 w-3" />}
        {status === "Pending" && <AlertCircle className="h-3 w-3" />}
        {(status === "Rejected" || status === "Inactive") && <XCircle className="h-3 w-3" />}
        {status || "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-5">
        <div className="h-10 w-40 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-40 rounded-[2rem] bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ChefHat className="h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-black text-slate-700">Chef Not Found</h2>
        <p className="text-slate-500">This chef ID may be invalid or the record was removed.</p>
        <button onClick={() => navigate(-1)} className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HERO HEADER ── */}
      <div
        className="relative overflow-hidden rounded-b-[2.5rem] px-8 pb-10 pt-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f4c35 100%)" }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Home Chefs
        </button>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/30 flex items-center justify-center text-3xl font-black text-emerald-300 shrink-0">
              {chef.name ? chef.name.charAt(0).toUpperCase() : <ChefHat />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">{chef.name || "Home Chef"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={chef.status} />
                {chef.chef_unique_code && (
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white/70">
                    ID: {chef.chef_unique_code}
                  </span>
                )}
                {chef.cuisine_type && (
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white/70 flex items-center gap-1">
                    <Utensils className="h-3 w-3" /> {chef.cuisine_type}
                  </span>
                )}
                {chef.city && (
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white/70 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {chef.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/admin/products/add?chefId=${id}`)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition shadow-lg"
            >
              <PlusCircle className="h-4 w-4" /> Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Products", value: chef.product_count ?? 0, icon: Package, color: "blue" },
            { label: "Total Orders", value: chef.total_orders ?? 0, icon: ShoppingCart, color: "emerald" },
            { label: "Pending Orders", value: chef.pending_orders ?? 0, icon: Clock, color: "amber" },
            { label: "Rating", value: chef.rating ? `${chef.rating}★` : "N/A", icon: Star, color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3
                ${stat.color === "blue" ? "bg-blue-100 text-blue-600" :
                  stat.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                  stat.color === "amber" ? "bg-amber-100 text-amber-600" :
                  "bg-purple-100 text-purple-600"}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar Tabs */}
          <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-fit">
            <div className="mb-4 px-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sections</p>
              <h2 className="mt-1 text-base font-black text-slate-800">Chef Details</h2>
            </div>
            <div className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition text-left
                    ${activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                {/* Single unified info card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-0">
                    {/* Contact Info */}
                    <div className="pb-6 md:pb-0 md:pr-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <h3 className="font-black text-slate-700">Contact Info</h3>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        {[
                          { label: "Mobile", value: chef.mobile },
                          { label: "Email", value: chef.email },
                          { label: "WhatsApp", value: chef.whatsapp_number },
                          { label: "Emergency", value: chef.emergency_contact },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-start gap-2">
                            <span className="text-slate-400 font-semibold shrink-0">{label}</span>
                            <span className="text-slate-700 font-bold text-right break-all">{value || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kitchen Info */}
                    <div className="py-6 md:py-0 md:px-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Home className="h-4 w-4" />
                        </div>
                        <h3 className="font-black text-slate-700">Kitchen Info</h3>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        {[
                          { label: "Kitchen", value: chef.kitchen_name },
                          { label: "Cuisine", value: chef.cuisine_type },
                          { label: "Specialty", value: chef.specialty_food },
                          { label: "Signature", value: chef.signature_dish },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-start gap-2">
                            <span className="text-slate-400 font-semibold shrink-0">{label}</span>
                            <span className="text-slate-700 font-bold text-right">{value || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="pt-6 md:pt-0 md:pl-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <h3 className="font-black text-slate-700">Location</h3>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        {[
                          { label: "City", value: chef.city },
                          { label: "District", value: chef.district },
                          { label: "State", value: chef.state },
                          { label: "Pincode", value: chef.pincode },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-start gap-2">
                            <span className="text-slate-400 font-semibold shrink-0">{label}</span>
                            <span className="text-slate-700 font-bold text-right">{value || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <h3 className="font-black text-slate-700">Chef Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Gender", value: chef.gender },
                      { label: "Date of Birth", value: chef.date_of_birth ? new Date(chef.date_of_birth).toLocaleDateString("en-IN") : null },
                      { label: "Age", value: chef.age },
                      { label: "Verification", value: chef.verification_status },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                        <p className="mt-1.5 font-black text-slate-800">{value || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                {chef.address && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <h3 className="font-black text-slate-700">Full Address</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{chef.address}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── CHEF FOODS TAB ── */}
            {activeTab === "foods" && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800">Chef Food Products</h3>
                        <p className="text-xs text-slate-400">Foods created by this chef</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{chefFoods.length} items</span>
                      <button
                        onClick={() => navigate(`/admin/products/add?chefId=${id}`)}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add Food
                      </button>
                    </div>
                  </div>

                  {loadingFoods ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading foods...</p>
                    </div>
                  ) : chefFoods.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            {["Food Name", "Category", "Price", "Dietary", "Status"].map(h => (
                              <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {chefFoods.map((food) => (
                            <tr key={food.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-xl bg-orange-100 grid place-items-center text-orange-700 font-black text-sm shrink-0">
                                    {String(food.name || "F").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{food.name}</p>
                                    <p className="text-xs text-slate-400">{food.cuisine || "Home cooked"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{food.category}</td>
                              <td className="px-6 py-4 font-black text-emerald-600">₹{food.final_price ?? food.mrp ?? 0}</td>
                              <td className="px-6 py-4 text-slate-500">{food.dietary_tag || "—"}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
                                  ${food.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  {food.status || "Unknown"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                        <Utensils className="h-7 w-7 text-slate-300" />
                      </div>
                      <h4 className="font-bold text-slate-700">No Chef Foods Yet</h4>
                      <p className="mt-1 text-sm text-slate-400 max-w-xs">This chef hasn't added any food products yet.</p>
                      <button
                        onClick={() => navigate(`/admin/products/add?chefId=${id}`)}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition"
                      >
                        <PlusCircle className="h-4 w-4" /> Add First Food
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === "products" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <Package className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-black text-slate-800">{chef.product_count ?? 0}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Total Products</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                      <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-black text-slate-800">{chef.pending_products ?? 0}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Pending Review</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 mb-3">Add a new product for this chef</p>
                    <button
                      onClick={() => navigate(`/admin/products/add?chefId=${id}`)}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white hover:bg-emerald-500 transition"
                    >
                      Add Product
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Use the <strong className="text-slate-700">Add Product</strong> button above to create product listings for this chef. Products will appear in the chef's profile and can be managed from the product management section.
                  </p>
                </div>
              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: "Total Orders", value: chef.total_orders ?? 0, color: "emerald", icon: ShoppingCart },
                    { label: "Pending", value: chef.pending_orders ?? 0, color: "amber", icon: Clock },
                    { label: "Completed", value: chef.completed_orders ?? 0, color: "blue", icon: CheckCircle },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3
                        ${s.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                          s.color === "amber" ? "bg-amber-100 text-amber-600" :
                          "bg-blue-100 text-blue-600"}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <p className="text-3xl font-black text-slate-800">{s.value}</p>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800">Order History</h3>
                    <button
                      onClick={() => navigate("/admin/food-orders")}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> View All Orders
                    </button>
                  </div>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                  ) : chefOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            {["Order ID", "Customer", "Items", "Amount", "Status", "Placed"].map(h => (
                              <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {chefOrders.slice(0, 10).map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{order.order_id || `#${order.id}`}</td>
                              <td className="px-6 py-4 text-slate-600">{order.customer_name || order.ordered_by_name || "—"}</td>
                              <td className="px-6 py-4 space-y-2 text-slate-700">
                                {Array.isArray(order.items) && order.items.length > 0 ? (
                                  order.items.map((item, idx) => {
                                    const itemPrice = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;
                                    const itemQty = Number(item.quantity) || 1;
                                    return (
                                      <div key={idx} className="rounded-2xl bg-slate-50 p-3">
                                        <p className="font-semibold text-slate-800">{item.name || item.product_name || 'Item'}</p>
                                        <p className="text-xs text-slate-500">
                                          Qty {itemQty} × {formatAmount(itemPrice)} = {formatAmount(itemPrice * itemQty)}
                                        </p>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs text-slate-400">Chef-specific items not found</p>
                                )}
                              </td>
                              <td className="px-6 py-4 font-black text-emerald-600">{getChefOrderAmount(order)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
                                  ${order.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                                    order.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                                    order.status === "Preparing" ? "bg-violet-100 text-violet-700" :
                                    order.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                    order.status === "Out for Delivery" ? "bg-orange-100 text-orange-700" :
                                    order.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
                                    "bg-slate-100 text-slate-500"}`}>
                                  {order.status || "Pending"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">{order.ordered_at ? new Date(order.ordered_at).toLocaleDateString("en-IN") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ShoppingCart className="h-12 w-12 text-slate-200 mb-3" />
                      <h4 className="font-bold text-slate-600">No orders yet</h4>
                      <p className="text-sm text-slate-400 mt-1">This chef has no orders linked to their profile.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === "documents" && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800">Verification Documents</h3>
                      <p className="text-xs text-slate-400">KYC and compliance documents uploaded by this chef</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Aadhaar Front", key: "aadhaar_front_url" },
                      { label: "Aadhaar Back", key: "aadhaar_back_url" },
                      { label: "PAN Card", key: "pan_card_url" },
                      { label: "FSSAI Certificate", key: "fssai_certificate_url" },
                      { label: "GST Certificate", key: "gst_certificate_url" },
                      { label: "Signature", key: "signature_url" },
                      { label: "Selfie Verification", key: "selfie_verification_url" },
                    ].map((doc) => {
                      const link = getDocLink(chef[doc.key]);
                      return (
                        <div
                          key={doc.key}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center
                              ${link ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{doc.label}</span>
                          </div>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                            >
                              <Eye className="h-3 w-3" /> View
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-400">
                              <XCircle className="h-3 w-3" /> Not Uploaded
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default HomeChefDetail;
