import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Trash2, Check, X, ShieldAlert, Eye, Plus, Edit2, List, LayoutGrid, MapPin, Store, CheckCircle, Clock } from "lucide-react";

const emptyForm = {
  restaurant_id: "",
  name: "",
  owner_name: "",
  restaurant_type: "Both",
  cuisine_type: "Multi Cuisine",
  description: "",
  opening_date: "",
  logo_url: "",
  banner_url: "",
  gallery_urls: "",
  gst_number: "",
  fssai_number: "",
  mobile: "",
  alt_mobile: "",
  whatsapp_number: "",
  email: "",
  website_url: "",
  customer_support: "",
  door_number: "",
  street_name: "",
  area_name: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  map_link: "",
  status: "Pending",
  verification_status: "Pending",
  opening_time: "",
  closing_time: "",
  working_days: "",
  holiday_details: "",
  is_24_hours: false,
  peak_hours: "",
  username: "",
  password: "",
  confirmPassword: "",
  role: "Restaurant Admin",
  otp_verified: false,
  email_verified: false,
  aadhaar_url: "",
  pan_url: "",
  gst_certificate_url: "",
  shop_license_url: "",
  restaurant_photos_urls: "",
  kitchen_photos_urls: "",
  signature_url: "",
};

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  // View Details Modal
  const [selectedRest, setSelectedRest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Add / Edit Popup Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRest, setEditingRest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic");

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/restaurants");
      setRestaurants(res.data);
      setFilteredRestaurants(res.data);
    } catch {
      toast.error("Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = restaurants;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(lower) ||
          r.owner_name?.toLowerCase().includes(lower) ||
          r.email?.toLowerCase().includes(lower) ||
          r.city?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") result = result.filter((r) => r.status === statusFilter);
    setFilteredRestaurants(result);
  }, [search, statusFilter, restaurants]);

  const openAddModal = () => {
    setEditingRest(null);
    setForm(emptyForm);
    setActiveFormTab("basic");
    setIsFormOpen(true);
  };

  const openEditModal = (rest) => {
    setEditingRest(rest);
    setActiveFormTab("basic");
    setForm({
      restaurant_id: rest.restaurant_id || "",
      name: rest.name || "",
      owner_name: rest.owner_name || "",
      restaurant_type: rest.restaurant_type || "Both",
      cuisine_type: rest.cuisine_type || "Multi Cuisine",
      description: rest.description || "",
      opening_date: rest.opening_date ? rest.opening_date.substring(0, 10) : "",
      logo_url: rest.logo_url || "",
      banner_url: rest.banner_url || "",
      gallery_urls: rest.gallery_urls || "",
      gst_number: rest.gst_number || "",
      fssai_number: rest.fssai_number || "",
      mobile: rest.mobile || "",
      alt_mobile: rest.alt_mobile || "",
      whatsapp_number: rest.whatsapp_number || "",
      email: rest.email || "",
      website_url: rest.website_url || "",
      customer_support: rest.customer_support || "",
      door_number: rest.door_number || "",
      street_name: rest.street_name || "",
      area_name: rest.area_name || "",
      landmark: rest.landmark || "",
      city: rest.city || "",
      district: rest.district || "",
      state: rest.state || "",
      pincode: rest.pincode || "",
      latitude: rest.latitude || "",
      longitude: rest.longitude || "",
      map_link: rest.map_link || "",
      status: rest.status || "Pending",
      verification_status: rest.verification_status || "Pending",
      opening_time: rest.opening_time || "",
      closing_time: rest.closing_time || "",
      working_days: rest.working_days || "",
      holiday_details: rest.holiday_details || "",
      is_24_hours: !!rest.is_24_hours,
      peak_hours: rest.peak_hours || "",
      username: rest.username || "",
      password: "",
      confirmPassword: "",
      role: rest.role || "Restaurant Admin",
      otp_verified: !!rest.otp_verified,
      email_verified: !!rest.email_verified,
      aadhaar_url: rest.aadhaar_url || "",
      pan_url: rest.pan_url || "",
      gst_certificate_url: rest.gst_certificate_url || "",
      shop_license_url: rest.shop_license_url || "",
      restaurant_photos_urls: rest.restaurant_photos_urls || "",
      kitchen_photos_urls: rest.kitchen_photos_urls || "",
      signature_url: rest.signature_url || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRest && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSaving(true);

      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] instanceof FileList || Array.isArray(form[key])) {
          for (let i = 0; i < form[key].length; i++) {
            formData.append(key, form[key][i]);
          }
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (editingRest) {
        await api.put(`/superadmin/restaurants/${editingRest.id}`, formData);
        toast.success("Restaurant updated successfully.");
      } else {
        await api.post("/superadmin/restaurants", formData);
        toast.success("Restaurant created successfully.");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingRest(null);
      fetchRestaurants();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save restaurant.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const target = restaurants.find((r) => r.id === id);
      if (!target) return;
      await api.put(`/superadmin/restaurants/${id}`, { ...target, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchRestaurants();
      if (selectedRest?.id === id) setSelectedRest((prev) => ({ ...prev, status: newStatus }));
    } catch {
      toast.error("Failed to change status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) return;
    try {
      await api.delete(`/superadmin/restaurants/${id}`);
      toast.success("Restaurant removed.");
      fetchRestaurants();
      if (selectedRest?.id === id) { setSelectedRest(null); setIsDetailOpen(false); }
    } catch {
      toast.error("Failed to delete restaurant.");
    }
  };

  const approvedCount = restaurants.filter((r) => r.status === "Approved").length;
  const pendingCount = restaurants.filter((r) => r.status === "Pending").length;
  const suspendedCount = restaurants.filter((r) => ["Suspended", "Rejected"].includes(r.status)).length;

  const inp = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition-all placeholder:text-slate-400";
  const lbl = "text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
         
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 border-l-4 border-l-slate-400 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Outlets</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{restaurants.length}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Approved Outlets</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{approvedCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 border-l-4 border-l-amber-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Pending & Suspended</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{pendingCount + suspendedCount}</h4>
          </div>
        </div>
      </div>

      {/* Toolbar: Search on Left, View Mode Switcher on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search by restaurant name, owner or city..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Right: Filters & View toggle mode */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-600 focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-white text-[#1B4D22] shadow-sm"
                  : "text-slate-500 hover:text-[#1B4D22]"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${
                viewMode === "card"
                  ? "bg-white text-[#1B4D22] shadow-sm"
                  : "text-slate-500 hover:text-[#1B4D22]"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View (Table / Cards) */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-700">
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">S.No</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">Outlet Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">Owner Name</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">GST Number</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRestaurants.map((rest, index) => (
                <tr key={rest.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-sm font-bold text-slate-700 text-center">{index + 1}</td>
                  <td className="px-6 py-5">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{rest.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{rest.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{rest.owner_name}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{rest.gst_number || "N/A"}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.18em] ${
                      rest.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : rest.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {rest.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setSelectedRest(rest); setIsDetailOpen(true); }}
                        className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(rest)}
                        className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                        title="Edit Restaurant"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {rest.status !== "Approved" && (
                        <button
                          onClick={() => handleStatusChange(rest.id, "Approved")}
                          className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-xl transition"
                          title="Approve Restaurant"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {rest.status === "Approved" && (
                        <button
                          onClick={() => handleStatusChange(rest.id, "Suspended")}
                          className="p-2 hover:bg-amber-100 text-amber-600 rounded-xl transition"
                          title="Suspend Restaurant"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rest.id)}
                        className="p-2 hover:bg-rose-100 text-rose-600 rounded-xl transition"
                        title="Delete Restaurant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRestaurants.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-xs text-slate-500 italic">
                    No restaurants match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredRestaurants.map((rest) => {
            const initials = rest.owner_name ? rest.owner_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'RO';
            return (
              <div key={rest.id} className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
                {/* Header: Title and Status */}
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 tracking-tight">{rest.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs text-slate-500 font-semibold">{rest.city || "N/A"}, {rest.state || "N/A"}</span>
                    </div>
                  </div>
                  
                  <span 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      rest.status === "Approved" ? "bg-emerald-500" : rest.status === "Pending" ? "bg-amber-500" : "bg-rose-500"
                    }`} />
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      rest.status === "Approved"
                        ? "text-emerald-700 bg-emerald-50"
                        : rest.status === "Pending"
                        ? "text-amber-700 bg-amber-50"
                        : "text-rose-700 bg-rose-50"
                    }`}>{rest.status}</span>
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-4 flex-1">
                  {/* Owner Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold border border-slate-200/50">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{rest.owner_name}</p>
                    </div>
                  </div>

                  {/* Contact & Business Info */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobile Number</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{rest.mobile || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cuisine</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1 truncate" title={rest.cuisine_type}>{rest.cuisine_type || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type</p>
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded border mt-1 ${
                        rest.restaurant_type === "Veg"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                          : rest.restaurant_type === "Non-Veg"
                          ? "bg-red-50 text-red-700 border-red-200/50"
                          : "bg-amber-50 text-amber-700 border-amber-200/50"
                      }`}>{rest.restaurant_type || "N/A"}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">GST Number</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1 truncate" title={rest.gst_number}>{rest.gst_number || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-2">
                    {/* Approve / Suspend Button */}
                    {rest.status !== "Approved" ? (
                      <button
                        onClick={() => handleStatusChange(rest.id, "Approved")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(rest.id, "Suspended")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedRest(rest); setIsDetailOpen(true); }}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="View Restaurant Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(rest)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="Edit Restaurant Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rest.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Delete Restaurant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredRestaurants.length === 0 && (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl py-16 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No restaurants registered yet</p>
            </div>
          )}
        </div>
      )}

      {/* ===== VIEW DETAILS MODAL ===== */}
      {isDetailOpen && selectedRest && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">{selectedRest.name}</h3>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-1">Restaurant Details</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-slate-800 overflow-y-auto max-h-[55vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Owner Name</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.mobile || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">GST Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.gst_number || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">FSSAI License</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.fssai_number || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Outlet Address</p>
                  <p className="text-sm font-bold mt-0.5 text-slate-600">{selectedRest.address || "Not Provided"}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              {selectedRest.status !== "Approved" && (
                <button
                  onClick={() => { handleStatusChange(selectedRest.id, "Approved"); setIsDetailOpen(false); }}
                  className="flex-1 py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition active:scale-95"
                >
                  Approve
                </button>
              )}
              {selectedRest.status === "Pending" && (
                <button
                  onClick={() => { handleStatusChange(selectedRest.id, "Rejected"); setIsDetailOpen(false); }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition active:scale-95"
                >
                  Reject
                </button>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== ADD / EDIT POPUP MODAL ===== */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 mt-4 sm:mt-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white border border-slate-100 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="bg-[#1B4D22] p-7 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">
                  {editingRest ? "Edit Restaurant" : "Register New Restaurant"}
                </h3>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-0.5">
                  {editingRest ? "Update outlet information" : "Fill in the details to add a new outlet"}
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-slate-100 shrink-0 custom-scrollbar bg-slate-50">
                {[
                  { id: "basic", label: "Basic Info" },
                  { id: "contact", label: "Contact" },
                  { id: "address", label: "Address" },
                  { id: "login", label: "Login & Auth" },
                  { id: "timing", label: "Timing" },
                  { id: "kyc", label: "KYC & Docs" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`whitespace-nowrap px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                      activeFormTab === tab.id
                        ? "text-[#1B4D22] border-b-[3px] border-[#1B4D22] bg-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-b-[3px] border-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto flex-1 p-7 bg-slate-50/50">
                <div className="space-y-5">
                  {activeFormTab === "basic" && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">Basic Restaurant Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {editingRest && (
                      <div className="space-y-1 sm:col-span-2">
                        <label className={lbl}>Restaurant ID</label>
                        <input type="text" disabled value={form.restaurant_id || "Auto generated after save"} className={inp + " bg-slate-900/80 cursor-not-allowed"} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className={lbl}>Restaurant Name *</label>
                      <input type="text" required placeholder="e.g. Grandma's Kitchen" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Owner Name *</label>
                      <input type="text" required placeholder="e.g. John Doe" value={form.owner_name}
                        onChange={e => setForm({ ...form, owner_name: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Restaurant Type</label>
                      <select value={form.restaurant_type} onChange={e => setForm({ ...form, restaurant_type: e.target.value })} className={inp + " cursor-pointer"}>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Cuisine Type</label>
                      <select value={form.cuisine_type} onChange={e => setForm({ ...form, cuisine_type: e.target.value })} className={inp + " cursor-pointer"}>
                        <option value="South Indian">South Indian</option>
                        <option value="North Indian">North Indian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Fast Food">Fast Food</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Multi Cuisine">Multi Cuisine</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Restaurant Description</label>
                      <textarea rows="3" placeholder="Enter restaurant description" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Opening Date</label>
                      <input type="date" value={form.opening_date}
                        onChange={e => setForm({ ...form, opening_date: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Restaurant Logo</label>
                      <input type="file" accept="image/*"
                        onChange={e => setForm({ ...form, logo_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Restaurant Banner</label>
                      <input type="file" accept="image/*"
                        onChange={e => setForm({ ...form, banner_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Gallery Images</label>
                      <input type="file" accept="image/*" multiple
                        onChange={e => setForm({ ...form, gallery_urls: e.target.files })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                  </div>
                </div>
                )}

                {activeFormTab === "contact" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">Contact Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={lbl}>Mobile Number *</label>
                      <input type="text" required placeholder="9876543210" value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Alternate Mobile</label>
                      <input type="text" placeholder="Alternate contact" value={form.alt_mobile}
                        onChange={e => setForm({ ...form, alt_mobile: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>WhatsApp Number</label>
                      <input type="text" placeholder="WhatsApp number" value={form.whatsapp_number}
                        onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Email Address *</label>
                      <input type="email" required placeholder="owner@example.com" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Website URL</label>
                      <input type="url" placeholder="https://example.com" value={form.website_url}
                        onChange={e => setForm({ ...form, website_url: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Customer Support Number</label>
                      <input type="text" placeholder="Support phone" value={form.customer_support}
                        onChange={e => setForm({ ...form, customer_support: e.target.value })} className={inp} />
                    </div>
                  </div>
                </div>
                )}

                {activeFormTab === "address" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">Address Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={lbl}>Door Number</label>
                      <input type="text" placeholder="Door / Flat no." value={form.door_number}
                        onChange={e => setForm({ ...form, door_number: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Street Name</label>
                      <input type="text" placeholder="Street" value={form.street_name}
                        onChange={e => setForm({ ...form, street_name: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Area Name</label>
                      <input type="text" placeholder="Area / locality" value={form.area_name}
                        onChange={e => setForm({ ...form, area_name: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Landmark</label>
                      <input type="text" placeholder="Landmark" value={form.landmark}
                        onChange={e => setForm({ ...form, landmark: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>City</label>
                      <input type="text" placeholder="City" value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>District</label>
                      <input type="text" placeholder="District" value={form.district}
                        onChange={e => setForm({ ...form, district: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>State</label>
                      <input type="text" placeholder="State" value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Pincode</label>
                      <input type="text" placeholder="Pincode" value={form.pincode}
                        onChange={e => setForm({ ...form, pincode: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Latitude</label>
                      <input type="text" placeholder="Latitude" value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Longitude</label>
                      <input type="text" placeholder="Longitude" value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Google Map Location Link</label>
                      <input type="url" placeholder="Google Maps URL" value={form.map_link}
                        onChange={e => setForm({ ...form, map_link: e.target.value })} className={inp} />
                    </div>
                  </div>
                </div>
                )}

                {activeFormTab === "login" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">Login & Verification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!editingRest && (
                      <div className="space-y-1">
                        <label className={lbl}>Username *</label>
                        <input type="text" required placeholder="Login username" value={form.username}
                          onChange={e => setForm({ ...form, username: e.target.value })} className={inp} />
                      </div>
                    )}
                    {!editingRest && (
                      <div className="space-y-1">
                        <label className={lbl}>Password *</label>
                        <input type="password" required placeholder="Set password" value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })} className={inp} />
                      </div>
                    )}
                    {!editingRest && (
                      <div className="space-y-1">
                        <label className={lbl}>Confirm Password *</label>
                        <input type="password" required placeholder="Repeat password" value={form.confirmPassword}
                          onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={inp} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className={lbl}>Role</label>
                      <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inp + " cursor-pointer"}>
                        <option value="Restaurant Admin">Restaurant Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>OTP Verified</label>
                      <select value={form.otp_verified ? "Yes" : "No"} onChange={e => setForm({ ...form, otp_verified: e.target.value === "Yes" })} className={inp + " cursor-pointer"}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Email Verified</label>
                      <select value={form.email_verified ? "Yes" : "No"} onChange={e => setForm({ ...form, email_verified: e.target.value === "Yes" })} className={inp + " cursor-pointer"}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Account Status</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp + " cursor-pointer"}>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Verification Status</label>
                      <select value={form.verification_status} onChange={e => setForm({ ...form, verification_status: e.target.value })} className={inp + " cursor-pointer"}>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>
                )}

                {activeFormTab === "timing" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">Restaurant Timing</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={lbl}>Opening Time</label>
                      <input type="time" value={form.opening_time}
                        onChange={e => setForm({ ...form, opening_time: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Closing Time</label>
                      <input type="time" value={form.closing_time}
                        onChange={e => setForm({ ...form, closing_time: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Working Days</label>
                      <input type="text" placeholder="e.g. Mon-Sat" value={form.working_days}
                        onChange={e => setForm({ ...form, working_days: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Holiday Details</label>
                      <textarea rows="2" placeholder="Holiday schedule" value={form.holiday_details}
                        onChange={e => setForm({ ...form, holiday_details: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>24 Hours Available</label>
                      <select value={form.is_24_hours ? "Yes" : "No"} onChange={e => setForm({ ...form, is_24_hours: e.target.value === "Yes" })} className={inp + " cursor-pointer"}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Peak Hours</label>
                      <input type="text" placeholder="e.g. 7pm-9pm" value={form.peak_hours}
                        onChange={e => setForm({ ...form, peak_hours: e.target.value })} className={inp} />
                    </div>
                  </div>
                </div>
                )}

                {activeFormTab === "kyc" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs text-[#1B4D22] uppercase tracking-[0.25em] font-black mb-5">KYC & Verification Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={lbl}>Owner Aadhaar Card</label>
                      <input type="file" accept="image/*,.pdf"
                        onChange={e => setForm({ ...form, aadhaar_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>PAN Card</label>
                      <input type="file" accept="image/*,.pdf"
                        onChange={e => setForm({ ...form, pan_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>GST Certificate</label>
                      <input type="file" accept="image/*,.pdf"
                        onChange={e => setForm({ ...form, gst_certificate_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Shop License</label>
                      <input type="file" accept="image/*,.pdf"
                        onChange={e => setForm({ ...form, shop_license_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Restaurant Photos</label>
                      <input type="file" accept="image/*" multiple
                        onChange={e => setForm({ ...form, restaurant_photos_urls: e.target.files })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Kitchen Photos</label>
                      <input type="file" accept="image/*" multiple
                        onChange={e => setForm({ ...form, kitchen_photos_urls: e.target.files })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={lbl}>Signature Image</label>
                      <input type="file" accept="image/*"
                        onChange={e => setForm({ ...form, signature_url: e.target.files[0] })} className={inp + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"} />
                    </div>
                  </div>
                </div>
                )}
              </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#1B4D22] hover:bg-[#153b1a] disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition active:scale-95"
                >
                  {saving ? "Saving..." : editingRest ? "Update Restaurant" : "Register Restaurant"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RestaurantManagement;
