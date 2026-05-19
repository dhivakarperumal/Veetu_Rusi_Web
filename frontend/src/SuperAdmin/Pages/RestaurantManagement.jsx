import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Trash2, Check, X, ShieldAlert, Eye, Plus, Edit2 } from "lucide-react";

const emptyForm = {
  name: "",
  owner_name: "",
  email: "",
  mobile: "",
  address: "",
  gst_number: "",
  fssai_number: "",
  status: "Pending",
  username: "",
  password: "",
  confirmPassword: "",
};

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // View Details Modal
  const [selectedRest, setSelectedRest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Add / Edit Popup Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRest, setEditingRest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
          r.email?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") result = result.filter((r) => r.status === statusFilter);
    setFilteredRestaurants(result);
  }, [search, statusFilter, restaurants]);

  const openAddModal = () => {
    setEditingRest(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = (rest) => {
    setEditingRest(rest);
    setForm({
      name: rest.name || "",
      owner_name: rest.owner_name || "",
      email: rest.email || "",
      mobile: rest.mobile || "",
      address: rest.address || "",
      gst_number: rest.gst_number || "",
      fssai_number: rest.fssai_number || "",
      status: rest.status || "Pending",
      username: rest.username || "",
      password: "",
      confirmPassword: "",
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
      if (editingRest) {
        await api.put(`/superadmin/restaurants/${editingRest.id}`, form);
        toast.success("Restaurant updated successfully.");
      } else {
        await api.post("/superadmin/restaurants", form);
        toast.success("Restaurant registered successfully.");
      }
      setIsFormOpen(false);
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

  const inp = "w-full px-4 py-2.5 bg-[#070b13]/60 border border-white/10 rounded-xl outline-none font-medium text-white text-sm focus:border-emerald-500/40 transition-all placeholder:text-white/20";
  const lbl = "text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Restaurant Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Approve/Reject restaurants, verify GST/FSSAI compliance and manage outlets
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/30 transition active:scale-95 self-start sm:self-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, owner or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Suspended">Suspended</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Outlet Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Owner Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">GST Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRestaurants.map((rest) => (
                  <tr key={rest.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <h4 className="text-sm font-black text-white">{rest.name}</h4>
                        <p className="text-xs text-white/40 font-semibold">{rest.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{rest.owner_name}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{rest.gst_number || "N/A"}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        rest.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : rest.status === "Pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {rest.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedRest(rest); setIsDetailOpen(true); }}
                          className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(rest)}
                          className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-xl transition"
                          title="Edit Restaurant"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {rest.status !== "Approved" && (
                          <button
                            onClick={() => handleStatusChange(rest.id, "Approved")}
                            className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition"
                            title="Approve Restaurant"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {rest.status === "Approved" && (
                          <button
                            onClick={() => handleStatusChange(rest.id, "Suspended")}
                            className="p-2 hover:bg-amber-500/10 text-amber-400 rounded-xl transition"
                            title="Suspend Restaurant"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rest.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
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
                    <td colSpan="5" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No restaurants match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== VIEW DETAILS MODAL ===== */}
      {isDetailOpen && selectedRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
          <div className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">{selectedRest.name}</h3>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Restaurant Details</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[55vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Owner Name</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Contact Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.mobile || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Email Address</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">GST Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.gst_number || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">FSSAI License</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.fssai_number || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Status</p>
                  <p className="text-sm font-black mt-0.5">{selectedRest.status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-white/40 font-bold uppercase">Outlet Address</p>
                  <p className="text-sm font-bold mt-0.5 text-white/80">{selectedRest.address || "Not Provided"}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              {selectedRest.status !== "Approved" && (
                <button
                  onClick={() => { handleStatusChange(selectedRest.id, "Approved"); setIsDetailOpen(false); }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                >
                  Approve
                </button>
              )}
              {selectedRest.status === "Pending" && (
                <button
                  onClick={() => { handleStatusChange(selectedRest.id, "Rejected"); setIsDetailOpen(false); }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                >
                  Reject
                </button>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT POPUP MODAL ===== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-[#0B1120] border border-white/8 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1B4D22] to-emerald-800 p-7 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">
                  {editingRest ? "Edit Restaurant" : "Register New Restaurant"}
                </h3>
                <p className="text-xs text-emerald-300/70 font-bold uppercase tracking-widest mt-0.5">
                  {editingRest ? "Update outlet information" : "Fill in the details to add a new outlet"}
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-7 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
                  <label className={lbl}>Email Address *</label>
                  <input type="email" required placeholder="owner@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
                </div>

                <div className="space-y-1">
                  <label className={lbl}>Mobile Number *</label>
                  <input type="text" required placeholder="9876543210" value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })} className={inp} />
                </div>

                <div className="space-y-1">
                  <label className={lbl}>GST Number</label>
                  <input type="text" placeholder="22AAAAA0000A1Z5" value={form.gst_number}
                    onChange={e => setForm({ ...form, gst_number: e.target.value })} className={inp} />
                </div>

                <div className="space-y-1">
                  <label className={lbl}>FSSAI License</label>
                  <input type="text" placeholder="12345678901234" value={form.fssai_number}
                    onChange={e => setForm({ ...form, fssai_number: e.target.value })} className={inp} />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className={lbl}>Address</label>
                  <input type="text" placeholder="Full outlet address" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} className={inp} />
                </div>

                <div className="space-y-1">
                  <label className={lbl}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className={inp + " cursor-pointer"}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {!editingRest && (
                  <div className="space-y-1">
                    <label className={lbl}>Username *</label>
                    <input type="text" required placeholder="Login username" value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })} className={inp} />
                  </div>
                )}

                {!editingRest && (
                  <>
                    <div className="space-y-1">
                      <label className={lbl}>Password *</label>
                      <input type="password" required placeholder="Set password" value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })} className={inp} />
                    </div>
                    <div className="space-y-1">
                      <label className={lbl}>Confirm Password *</label>
                      <input type="password" required placeholder="Repeat password" value={form.confirmPassword}
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={inp} />
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-900/30 transition active:scale-95"
                >
                  {saving ? "Saving..." : editingRest ? "Update Restaurant" : "Register Restaurant"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;
