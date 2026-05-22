import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { 
  Search, Filter, Trash2, Check, X, ShieldAlert, Eye, 
  Landmark, UserCheck, FileText, MapPin, Clock, CheckCircle, 
  List, LayoutGrid, Plus, Edit2 
} from "lucide-react";

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRest, setSelectedRest] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("outlet");
  const [isModalOpen, setIsModalOpen] = useState(false); // Used to toggle Right-Side Form
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [viewMode, setViewMode] = useState("table");
  const [modalTab, setModalTab] = useState("basic");

  const [editingRest, setEditingRest] = useState(null);
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    email: "",
    mobile: "",
    address: "",
    gst_number: "",
    fssai_number: "",
    status: "Pending",
    
    restaurant_type: "Both",
    cuisine_type: "Multi Cuisine",
    description: "",
    opening_date: "",
    logo_url: "",
    banner_url: "",
    gallery_urls: "",
    
    alt_mobile: "",
    whatsapp_number: "",
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
    email_verified: false
  });

  const resetForm = () => {
    setEditingRest(null);
    setModalTab("basic");
    setForm({
      name: "",
      owner_name: "",
      email: "",
      mobile: "",
      address: "",
      gst_number: "",
      fssai_number: "",
      status: "Pending",
      
      restaurant_type: "Both",
      cuisine_type: "Multi Cuisine",
      description: "",
      opening_date: "",
      logo_url: "",
      banner_url: "",
      gallery_urls: "",
      
      alt_mobile: "",
      whatsapp_number: "",
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
      email_verified: false
    });
  };

  const handleEdit = (rest) => {
    setEditingRest(rest);
    setSelectedRest(null); // Close details view
    setModalTab("basic");
    setForm({
      name: rest.name || "",
      owner_name: rest.owner_name || "",
      email: rest.email || "",
      mobile: rest.mobile || "",
      address: rest.address || "",
      gst_number: rest.gst_number || "",
      fssai_number: rest.fssai_number || "",
      status: rest.status || "Pending",
      
      restaurant_type: rest.restaurant_type || "Both",
      cuisine_type: rest.cuisine_type || "Multi Cuisine",
      description: rest.description || "",
      opening_date: rest.opening_date ? rest.opening_date.substring(0, 10) : "",
      logo_url: rest.logo_url || "",
      banner_url: rest.banner_url || "",
      gallery_urls: rest.gallery_urls || "",
      
      alt_mobile: rest.alt_mobile || "",
      whatsapp_number: rest.whatsapp_number || "",
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
      email_verified: !!rest.email_verified
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRest && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      if (editingRest) {
        await api.put(`/superadmin/restaurants/${editingRest.id}`, form);
        toast.success("Restaurant details updated successfully.");
      } else {
        await api.post("/superadmin/restaurants", form);
        toast.success("Restaurant registered successfully.");
      }
      setIsModalOpen(false);
      resetForm();
      fetchRestaurants();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save restaurant.");
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/restaurants");
      setRestaurants(res.data);
      setFilteredRestaurants(res.data);
    } catch (error) {
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
          r.email?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((r) => r.status === statusFilter);
    }
    setFilteredRestaurants(result);
  }, [search, statusFilter, restaurants]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const target = restaurants.find((r) => r.id === id);
      if (!target) return;
      await api.put(`/superadmin/restaurants/${id}`, {
        ...target,
        status: newStatus
      });
      toast.success(`Restaurant status updated to ${newStatus}`);
      fetchRestaurants();
      if (selectedRest?.id === id) {
        setSelectedRest((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error("Failed to change restaurant status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) return;
    try {
      await api.delete(`/superadmin/restaurants/${id}`);
      toast.success("Restaurant removed successfully.");
      fetchRestaurants();
      if (selectedRest?.id === id) {
        setSelectedRest(null);
      }
    } catch (error) {
      toast.error("Failed to delete restaurant.");
    }
  };

  const totalCount = restaurants.length;
  const approvedCount = restaurants.filter(r => r.status === "Approved").length;
  const pendingCount = restaurants.filter(r => r.status === "Pending").length;
  const suspendedCount = restaurants.filter(r => r.status === "Suspended" || r.status === "Blocked" || r.status === "Rejected").length;

  const totalPages = Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Restaurant Management</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage and register restaurant outlets</p>
        </div>
        <button
          onClick={() => { resetForm(); setSelectedRest(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-slate-400 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 flex-shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Restaurants</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{totalCount}</h4>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Approved Outlets</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{approvedCount}</h4>
          </div>
        </div>

        {/* Pending Card */}
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

      {/* Main split-pane content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Search + List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Toolbar */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurant or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] uppercase tracking-wider text-slate-650 focus:bg-white focus:border-emerald-600/40 transition cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Blocked">Blocked</option>
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "table" ? "bg-white text-[#1B4D22] shadow-xs" : "text-slate-500 hover:text-[#1B4D22]"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "card" ? "bg-white text-[#1B4D22] shadow-xs" : "text-slate-500 hover:text-[#1B4D22]"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* List Data View */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : viewMode === "table" ? (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-250">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-700 text-white border-b border-slate-100">
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-white/95">Outlet</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-white/95">Status</th>
                      <th className="px-4 py-3.5 text-[9px] font-black uppercase tracking-wider text-white/95 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRestaurants.map((rest) => {
                      const isSelected = selectedRest?.id === rest.id;
                      return (
                        <tr 
                          key={rest.id} 
                          onClick={() => {
                            setSelectedRest(rest);
                            setIsModalOpen(false);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <h4 className="text-xs font-black text-slate-800">{rest.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{rest.city || "No City"} • {rest.owner_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              rest.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-250/20" :
                              rest.status === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-250/20" :
                              "bg-red-50 text-red-700 border border-red-250/20"
                            }`}>
                              {rest.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setSelectedRest(rest); setIsModalOpen(false); setActiveDetailTab("outlet"); }}
                                className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(rest)}
                                className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(rest.id)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedRestaurants.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-xs text-slate-400 italic">
                          No restaurants found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-250">
              {paginatedRestaurants.map((rest) => {
                const isSelected = selectedRest?.id === rest.id;
                const initials = rest.owner_name ? rest.owner_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'OW';
                return (
                  <div
                    key={rest.id}
                    onClick={() => {
                      setSelectedRest(rest);
                      setIsModalOpen(false);
                    }}
                    className={`p-4 border rounded-xl shadow-xs cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-emerald-50/20 border-emerald-500/20 shadow-xs" 
                        : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{rest.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{rest.city || "No City"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Owner: {rest.owner_name}</p>
                      </div>
                      <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        rest.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                        rest.status === "Pending" ? "bg-yellow-50 text-yellow-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {rest.status}
                      </span>
                    </div>
                    <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedRest(rest); setIsModalOpen(false); setActiveDetailTab("outlet"); }}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(rest)}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rest.id)}
                        className="p-1 hover:bg-red-50 text-red-550 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {paginatedRestaurants.length === 0 && (
                <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-xs text-slate-400 italic">
                  No restaurants found.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-550 hover:text-slate-800 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:hover:text-slate-500 transition"
              >
                Prev
              </button>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-550 hover:text-slate-800 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:hover:text-slate-500 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Details OR Register/Edit Form OR Placeholder */}
        <div className="lg:col-span-7">
          
          {isModalOpen ? (
            /* ================= REGISTRATION / EDIT FORM ================= */
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200 flex flex-col">
              
              {/* Form Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {editingRest ? "Edit Restaurant Details" : "Register New Restaurant"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Fill all required fields to register the outlet
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 overflow-x-auto gap-2 scrollbar-none">
                {[
                  { id: "basic", label: "Basic Info" },
                  { id: "contact", label: "Contact & Address" },
                  { id: "timing", label: "Timing" },
                  { id: "auth", label: "Auth & Status" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id)}
                    className={`py-3 px-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition flex-shrink-0 ${
                      modalTab === tab.id
                        ? "border-[#1B4D22] text-[#1B4D22]"
                        : "border-transparent text-slate-450 hover:text-slate-650"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* TAB 1: Basic Info */}
                {modalTab === "basic" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Restaurant ID (Read-only if editing) */}
                      {editingRest && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant ID</label>
                          <input
                            type="text" readOnly
                            value={`# ${editingRest.id}`}
                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm outline-none"
                          />
                        </div>
                      )}
                      
                      {/* Restaurant Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant Name *</label>
                        <input
                          type="text" required
                          placeholder="e.g. Grandma's Kitchen"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                        />
                      </div>
                      
                      {/* Owner Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Owner Name *</label>
                        <input
                          type="text" required
                          placeholder="e.g. John Doe"
                          value={form.owner_name}
                          onChange={e => setForm({ ...form, owner_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-355"
                        />
                      </div>

                      {/* Restaurant Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant Type *</label>
                        <select
                          value={form.restaurant_type}
                          onChange={e => setForm({ ...form, restaurant_type: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        >
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Both">Both (Veg & Non-Veg)</option>
                        </select>
                      </div>

                      {/* Cuisine Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cuisine Type *</label>
                        <select
                          value={form.cuisine_type}
                          onChange={e => setForm({ ...form, cuisine_type: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        >
                          <option value="South Indian">South Indian</option>
                          <option value="North Indian">North Indian</option>
                          <option value="Chinese">Chinese</option>
                          <option value="Fast Food">Fast Food</option>
                          <option value="Bakery">Bakery</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Multi Cuisine">Multi Cuisine</option>
                        </select>
                      </div>

                      {/* Opening Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opening Date</label>
                        <input
                          type="date"
                          value={form.opening_date}
                          onChange={e => setForm({ ...form, opening_date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-805 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition text-slate-600"
                        />
                      </div>

                      {/* Logo URL */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logo Image URL</label>
                        <input
                          type="text"
                          placeholder="https://example.com/logo.png"
                          value={form.logo_url}
                          onChange={e => setForm({ ...form, logo_url: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                        />
                      </div>

                      {/* Banner Image URL */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Banner Image URL</label>
                        <input
                          type="text"
                          placeholder="https://example.com/banner.jpg"
                          value={form.banner_url}
                          onChange={e => setForm({ ...form, banner_url: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                        />
                      </div>

                      {/* Photos Gallery */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Photos Gallery URLs (comma separated)</label>
                        <input
                          type="text"
                          placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                          value={form.gallery_urls}
                          onChange={e => setForm({ ...form, gallery_urls: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                        />
                      </div>

                      {/* GST License */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GST Certificate Number</label>
                        <input
                          type="text"
                          value={form.gst_number}
                          onChange={e => setForm({ ...form, gst_number: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                          placeholder="e.g. 22AAAAA0000A1Z5"
                        />
                      </div>

                      {/* FSSAI License */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FSSAI License Number</label>
                        <input
                          type="text"
                          value={form.fssai_number}
                          onChange={e => setForm({ ...form, fssai_number: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition placeholder:text-slate-350"
                          placeholder="e.g. 12345678901234"
                        />
                      </div>

                      {/* Restaurant Description */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant Description</label>
                        <textarea
                          rows="2"
                          placeholder="Describe the restaurant style, specialties, history..."
                          value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition resize-none placeholder:text-slate-350"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Contact & Address */}
                {modalTab === "contact" && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h4 className="text-[10px] font-black text-slate-550 uppercase tracking-widest border-b border-slate-100 pb-1">Contact Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mobile */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number *</label>
                        <input
                          type="text" required
                          placeholder="e.g. 9876543210"
                          value={form.mobile}
                          onChange={e => setForm({ ...form, mobile: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>

                      {/* Alt Mobile */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alternate Mobile</label>
                        <input
                          type="text"
                          placeholder="e.g. 9876500000"
                          value={form.alt_mobile}
                          onChange={e => setForm({ ...form, alt_mobile: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">WhatsApp Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={form.whatsapp_number}
                          onChange={e => setForm({ ...form, whatsapp_number: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address *</label>
                        <input
                          type="email" required
                          placeholder="e.g. contact@domain.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>

                      {/* Website */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Website URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://domain.com"
                          value={form.website_url}
                          onChange={e => setForm({ ...form, website_url: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>

                      {/* Support Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer Support Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 1800-123-4567"
                          value={form.customer_support}
                          onChange={e => setForm({ ...form, customer_support: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white focus:border-[#1B4D22]/40 transition"
                        />
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-slate-555 uppercase tracking-widest border-b border-slate-100 pb-1 pt-2">Address details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Door No */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Door Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 12/A"
                          value={form.door_number}
                          onChange={e => setForm({ ...form, door_number: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        />
                      </div>
                      
                      {/* Street */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Street Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Gandhi Marg"
                          value={form.street_name}
                          onChange={e => setForm({ ...form, street_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        />
                      </div>

                      {/* Area */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Area Name</label>
                        <input
                          type="text"
                          placeholder="e.g. T. Nagar"
                          value={form.area_name}
                          onChange={e => setForm({ ...form, area_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Landmark */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Landmark</label>
                        <input
                          type="text"
                          placeholder="Near Park"
                          value={form.landmark}
                          onChange={e => setForm({ ...form, landmark: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">City</label>
                        <input
                          type="text"
                          placeholder="Chennai"
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* District */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">District</label>
                        <input
                          type="text"
                          placeholder="Chennai District"
                          value={form.district}
                          onChange={e => setForm({ ...form, district: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">State</label>
                        <input
                          type="text"
                          placeholder="Tamil Nadu"
                          value={form.state}
                          onChange={e => setForm({ ...form, state: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pincode</label>
                        <input
                          type="text"
                          placeholder="600017"
                          value={form.pincode}
                          onChange={e => setForm({ ...form, pincode: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Lat */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Latitude</label>
                        <input
                          type="text"
                          placeholder="13.08"
                          value={form.latitude}
                          onChange={e => setForm({ ...form, latitude: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Long */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Longitude</label>
                        <input
                          type="text"
                          placeholder="80.27"
                          value={form.longitude}
                          onChange={e => setForm({ ...form, longitude: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Map Link */}
                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Google Map Location Link</label>
                        <input
                          type="url"
                          placeholder="https://maps.google.com/?q=..."
                          value={form.map_link}
                          onChange={e => setForm({ ...form, map_link: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm"
                        />
                      </div>

                      {/* Address Summary */}
                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Address Summary *</label>
                        <textarea
                          required rows="2"
                          placeholder="Door No. 12/A, Gandhi Street, Chennai"
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Timing */}
                {modalTab === "timing" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Opening Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opening Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 07:00 AM"
                          value={form.opening_time}
                          onChange={e => setForm({ ...form, opening_time: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-805 text-sm"
                        />
                      </div>
                      
                      {/* Closing Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Closing Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 11:00 PM"
                          value={form.closing_time}
                          onChange={e => setForm({ ...form, closing_time: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-805 text-sm"
                        />
                      </div>

                      {/* Working Days */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Working Days</label>
                        <input
                          type="text"
                          placeholder="e.g. Mon - Sun"
                          value={form.working_days}
                          onChange={e => setForm({ ...form, working_days: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-805 text-sm"
                        />
                      </div>

                      {/* Peak Hours */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peak Hours</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 PM - 3 PM"
                          value={form.peak_hours}
                          onChange={e => setForm({ ...form, peak_hours: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-805 text-sm"
                        />
                      </div>

                      {/* 24 Hours */}
                      <div className="space-y-1 flex flex-col justify-center">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">24 Hours Available</label>
                        <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                          <input
                            type="checkbox"
                            checked={form.is_24_hours}
                            onChange={e => setForm({ ...form, is_24_hours: e.target.checked })}
                            className="w-4.5 h-4.5 text-[#1B4D22] border-slate-350 rounded focus:ring-[#1B4D22]"
                          />
                          <span className="text-xs font-semibold text-slate-700">Yes, open 24 hours</span>
                        </label>
                      </div>

                      {/* Holiday Details */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Holiday Details</label>
                        <textarea
                          rows="2"
                          placeholder="Closed on National Holidays..."
                          value={form.holiday_details}
                          onChange={e => setForm({ ...form, holiday_details: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Auth & Status */}
                {modalTab === "auth" && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <h4 className="text-[10px] font-black text-slate-550 uppercase tracking-widest border-b border-slate-100 pb-1">Login & Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Username */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Username</label>
                        <input
                          type="text"
                          placeholder="grandmaskitchen"
                          value={form.username}
                          onChange={e => setForm({ ...form, username: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        />
                      </div>

                      {/* Role */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role *</label>
                        <select
                          value={form.role}
                          onChange={e => setForm({ ...form, role: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        >
                          <option value="Restaurant Admin">Restaurant Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {editingRest ? "Change Password (optional)" : "Password *"}
                        </label>
                        <input
                          type="password"
                          required={!editingRest}
                          placeholder={editingRest ? "Leave blank to keep same" : "••••••••"}
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {editingRest ? "Confirm New Password" : "Confirm Password *"}
                        </label>
                        <input
                          type="password"
                          required={!editingRest && form.password}
                          placeholder={editingRest ? "Leave blank to keep same" : "••••••••"}
                          value={form.confirmPassword}
                          onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        />
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-slate-555 uppercase tracking-widest border-b border-slate-100 pb-1 pt-2">Account Status</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-sm focus:bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </div>

                      {/* Verifications */}
                      <div className="flex flex-col justify-end gap-2 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.otp_verified}
                            onChange={e => setForm({ ...form, otp_verified: e.target.checked })}
                            className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded focus:ring-[#1B4D22]"
                          />
                          <span className="text-xs font-semibold text-slate-700">OTP Verified</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.email_verified}
                            onChange={e => setForm({ ...form, email_verified: e.target.checked })}
                            className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded focus:ring-[#1B4D22]"
                          />
                          <span className="text-xs font-semibold text-slate-700">Email Verified</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Footer Controls inside Card */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    {modalTab !== "auth" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (modalTab === "basic") setModalTab("contact");
                          else if (modalTab === "contact") setModalTab("timing");
                          else if (modalTab === "timing") setModalTab("auth");
                        }}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition hover:bg-slate-50"
                      >
                        Next
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                  >
                    {editingRest ? "Save Changes" : "Register Restaurant"}
                  </button>
                </div>

              </form>
            </div>
          ) : selectedRest ? (
            /* ================= DETAILED VIEW TABS PANEL ================= */
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200 flex flex-col p-6">
              
              {/* Detailed Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">{selectedRest.name}</h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs text-slate-500 font-semibold">{selectedRest.city || "No City Specified"}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${
                    selectedRest.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                    selectedRest.status === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200/50" :
                    "bg-red-50 text-red-700 border border-red-200/50"
                  }`}>
                    {selectedRest.status}
                  </span>
                  
                  {/* Actions in Header */}
                  <button
                    onClick={() => handleEdit(selectedRest)}
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title="Edit restaurant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedRest.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedRest(null)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition ml-1"
                    title="Close Details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid content inside details */}
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Vertical Tabs on the Left */}
                <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-1 border-r border-slate-100 pr-4">
                  {[
                    { id: "outlet", label: "Outlet Info", icon: Landmark },
                    { id: "owner", label: "Owner Profile", icon: UserCheck },
                    { id: "address", label: "Address Details", icon: MapPin },
                    { id: "timing", label: "Timing Info", icon: Clock },
                    { id: "compliance", label: "Compliance & Docs", icon: FileText },
                    { id: "auth", label: "Auth & Status", icon: ShieldAlert }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-left ${
                          activeDetailTab === tab.id
                            ? "bg-[#1B4D22] text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content on the Right */}
                <div className="flex-1 min-w-0">
                  
                  {activeDetailTab === "outlet" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Outlet Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Outlet Name</span>
                          <span className="font-bold text-slate-800">{selectedRest.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant ID</span>
                          <span className="font-bold text-slate-700 font-mono">#{selectedRest.id}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Restaurant Type</span>
                          <span className="font-bold text-slate-800">{selectedRest.restaurant_type || "Both"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cuisine Type</span>
                          <span className="font-bold text-slate-800">{selectedRest.cuisine_type || "Multi Cuisine"}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                          <p className="font-semibold text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                            {selectedRest.description || "No description provided."}
                          </p>
                        </div>
                        
                        {selectedRest.logo_url && (
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Logo</span>
                            <img src={selectedRest.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-xs mt-1" />
                          </div>
                        )}
                        {selectedRest.banner_url && (
                          <div className="sm:col-span-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Banner</span>
                            <img src={selectedRest.banner_url} alt="Banner" className="w-full h-24 object-cover rounded-lg border border-slate-200 shadow-xs mt-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "owner" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Owner Profile & Contact</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Owner Name</span>
                          <span className="font-bold text-slate-800">{selectedRest.owner_name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                          <span className="font-bold text-slate-850">{selectedRest.email}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mobile</span>
                          <span className="font-bold text-slate-800">{selectedRest.mobile}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Alternate Mobile</span>
                          <span className="font-bold text-slate-800">{selectedRest.alt_mobile || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">WhatsApp</span>
                          <span className="font-bold text-slate-800">{selectedRest.whatsapp_number || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Customer Support</span>
                          <span className="font-bold text-slate-800">{selectedRest.customer_support || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "address" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Address Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Door / Street</span>
                          <span className="font-bold text-slate-800">{selectedRest.door_number} {selectedRest.street_name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Area / City</span>
                          <span className="font-bold text-slate-800">{selectedRest.area_name}, {selectedRest.city}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">District / State</span>
                          <span className="font-bold text-slate-800">{selectedRest.district}, {selectedRest.state} - {selectedRest.pincode}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Coordinates</span>
                          <span className="font-mono text-slate-700">{selectedRest.latitude || "0.0"}, {selectedRest.longitude || "0.0"}</span>
                        </div>
                        {selectedRest.map_link && (
                          <div className="sm:col-span-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Maps Location</span>
                            <a href={selectedRest.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#1B4D22] font-black hover:underline mt-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Open Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "timing" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Timing & Schedule</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Timings</span>
                          <span className="font-bold text-slate-800">{selectedRest.opening_time} - {selectedRest.closing_time}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Working Days</span>
                          <span className="font-bold text-slate-800">{selectedRest.working_days || "Mon - Sun"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Peak Hours</span>
                          <span className="font-bold text-slate-800">{selectedRest.peak_hours || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">24 Hours Available</span>
                          <span className="font-bold text-slate-800">{selectedRest.is_24_hours ? "Yes" : "No"}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Holiday Details</span>
                          <p className="font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                            {selectedRest.holiday_details || "No special holiday details declared."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "compliance" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Compliance & Licensing</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">GST Registration</span>
                          <span className="font-bold text-slate-850 font-mono">{selectedRest.gst_number || "Not Provided"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">FSSAI License</span>
                          <span className="font-bold text-slate-850 font-mono">{selectedRest.fssai_number || "Not Provided"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "auth" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">Authentication & Status</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Login Username</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedRest.username || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">User Role</span>
                          <span className="font-bold text-slate-800">{selectedRest.role || "Restaurant Admin"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">OTP Verified</span>
                          <span className={`inline-flex items-center text-[8px] font-black px-2 py-0.5 rounded uppercase mt-0.5 ${
                            selectedRest.otp_verified ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>{selectedRest.otp_verified ? "OTP Verified" : "Pending OTP"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Email Verified</span>
                          <span className={`inline-flex items-center text-[8px] font-black px-2 py-0.5 rounded uppercase mt-0.5 ${
                            selectedRest.email_verified ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>{selectedRest.email_verified ? "Email Verified" : "Pending Email"}</span>
                        </div>
                      </div>

                      {/* Approval controls in detail panel */}
                      {selectedRest.status === "Pending" && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4 space-y-3">
                          <p className="text-[10px] text-amber-800 font-bold leading-normal">
                            This restaurant application is currently pending verification. Double-check all business and compliance details before choosing an action.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(selectedRest.id, "Approved")}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition active:scale-95"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(selectedRest.id, "Rejected")}
                              className="px-3.5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : (
            /* ================= DEFAULT PLACEHOLDER PANEL ================= */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[500px]">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Landmark className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Restaurant Selected</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mt-2 leading-relaxed">
                Select a restaurant from the list on the left to view its detailed operational profile, address, timings, and credentials. Or click the button below to register a new outlet.
              </p>
              <button
                onClick={() => { resetForm(); setSelectedRest(null); setIsModalOpen(true); }}
                className="mt-6 flex items-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95"
              >
                <Plus className="w-4 h-4" /> Register New Restaurant
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default RestaurantManagement;
