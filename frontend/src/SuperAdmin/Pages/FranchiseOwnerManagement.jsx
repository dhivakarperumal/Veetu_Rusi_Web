import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search, Plus, Trash2, Edit2, Landmark, MapPin,
  CheckCircle, Copy, Eye, EyeOff, UserCheck, KeyRound, X,
  List, LayoutGrid
} from "lucide-react";

const FranchiseOwnerManagement = () => {
  const [franchises, setFranchises] = useState([]);
  const [filteredFranchises, setFilteredFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState(null);

  // Approve modal: holds the franchise being approved + password input
  const [approveModal, setApproveModal] = useState(null); // { franchise } | null
  const [approvePw, setApprovePw] = useState("");
  const [showApprovePw, setShowApprovePw] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Credentials modal
  const [credModal, setCredModal] = useState(null); // { email, password, owner_name, franchise_name, franch_user_id }
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    franchise_name: "", owner_name: "", mobile: "", email: "",
    city: "", state: "", commission_percentage: "10.00", status: "Pending"
  });

  useEffect(() => { fetchFranchises(); }, []);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/franchises");
      setFranchises(res.data);
      setFilteredFranchises(res.data);
    } catch { toast.error("Failed to load franchises."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let filtered = franchises;

    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.franchise_name?.toLowerCase().includes(lower) ||
        f.owner_name?.toLowerCase().includes(lower) ||
        f.city?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    setFilteredFranchises(filtered);
  }, [search, statusFilter, franchises]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFranchise) {
        await api.put(`/superadmin/franchises/${editingFranchise.id}`, form);
        toast.success("Franchise updated.");
      } else {
        await api.post("/superadmin/franchises", form);
        toast.success("Franchise registered. Click Approve to create login credentials.");
      }
      setIsModalOpen(false);
      resetForm();
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save franchise.");
    }
  };

  // Step 1: open password entry modal
  const handleApprove = (franchise) => {
    setApprovePw("");
    setShowApprovePw(false);
    setApproveModal({ franchise });
  };

  // Step 2: submit with password
  const confirmApprove = async () => {
    if (!approvePw.trim()) { toast.error("Please enter a password."); return; }
    const franchise = approveModal.franchise;
    setApprovingId(franchise.id);
    try {
      const res = await api.patch(`/superadmin/franchises/approve/${franchise.id}`, { password: approvePw });
      const data = res.data;
      setApproveModal(null);
      if (data.alreadyApproved) {
        toast("Already approved.", { icon: "ℹ️" });
        setCredModal({ email: data.email, password: null, owner_name: data.owner_name, franchise_name: data.franchise_name, franch_user_id: data.franch_user_id });
      } else {
        toast.success("Franchise approved & credentials created!");
        setCredModal({ email: data.email, password: approvePw, owner_name: data.owner_name, franchise_name: data.franchise_name, franch_user_id: data.franch_user_id });
      }
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed.");
    } finally { setApprovingId(null); }
  };

  const handleEdit = (franchise) => {
    setEditingFranchise(franchise);
    setForm({
      franchise_name: franchise.franchise_name,
      owner_name: franchise.owner_name,
      mobile: franchise.mobile,
      email: franchise.email,
      city: franchise.city,
      state: franchise.state,
      commission_percentage: franchise.commission_percentage,
      status: franchise.status
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (franchise) => {
    const nextStatus = franchise.status === "Active" ? "Inactive" : "Active";
    if (nextStatus === "Active" && !franchise.franch_user_id) {
      handleApprove(franchise);
      return;
    }
    try {
      const updatedForm = {
        franchise_name: franchise.franchise_name,
        owner_name: franchise.owner_name,
        mobile: franchise.mobile,
        email: franchise.email,
        city: franchise.city,
        state: franchise.state,
        commission_percentage: franchise.commission_percentage,
        status: nextStatus
      };
      await api.put(`/superadmin/franchises/${franchise.id}`, updatedForm);
      toast.success(`Franchise status updated to ${nextStatus}.`);
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this franchise owner?")) return;
    try {
      await api.delete(`/superadmin/franchises/${id}`);
      toast.success("Franchise removed.");
      fetchFranchises();
    } catch { toast.error("Failed to delete."); }
  };

  const resetForm = () => {
    setEditingFranchise(null);
    setForm({ franchise_name: "", owner_name: "", mobile: "", email: "", city: "", state: "", commission_percentage: "10.00", status: "Pending" });
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all";

  const totalCount = franchises.length;
  const activeCount = franchises.filter(f => f.status === "Active").length;
  const pendingCount = franchises.filter(f => f.status === "Pending").length;
  const inactiveCount = franchises.filter(f => f.status === "Inactive").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
         
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Franchise
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Franchises</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{totalCount}</h4>
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Owners</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{activeCount}</h4>
          </div>
        </div>

        {/* Inactive Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-amber-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 flex-shrink-0">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Pending & Inactive</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{pendingCount + inactiveCount}</h4>
          </div>
        </div>
      </div>

      {/* Toolbar: Search on Left, View Mode Switcher on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search by franchise name, owner or city..."
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
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
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
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-700">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">S.No</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Franchise</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Owner</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Territory</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Commission</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFranchises.map((f, index) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* S.No */}
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">
                      {index + 1}
                    </td>
                    {/* Franchise */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{f.franchise_name}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Owner */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700">{f.owner_name}</p>
                      <p className="text-xs text-slate-400 font-semibold">{f.mobile}</p>
                    </td>
                    {/* Territory */}
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{f.city}, {f.state}</span>
                      </div>
                    </td>
                    {/* Commission */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md">
                        {f.commission_percentage}%
                      </span>
                    </td>
                    {/* Status */}
                    <td 
                      className="px-5 py-4 cursor-pointer select-none" 
                      onDoubleClick={() => handleToggleStatus(f)}
                      title="Double-click to toggle status"
                    >
                      <div className="space-y-1">
                        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          f.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : f.status === "Inactive"
                            ? "bg-red-50 text-red-700 border border-red-200/50"
                            : "bg-amber-50 text-amber-700 border border-amber-200/50"
                        }`}>{f.status}</span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approve */}
                        {(!f.franch_user_id || f.status !== "Active") && (
                          <button
                            onClick={() => handleApprove(f)}
                            disabled={approvingId === f.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition disabled:opacity-50"
                            title="Approve & Create Credentials"
                          >
                            <UserCheck className="w-3 h-3" />
                            {approvingId === f.id ? "…" : "Approve"}
                          </button>
                        )}
                        {/* View Creds if linked */}
                        {f.franch_user_id && (
                          <button
                            onClick={() => setCredModal({ email: f.email, password: null, owner_name: f.owner_name, franchise_name: f.franchise_name, franch_user_id: f.franch_user_id })}
                            className="p-2 hover:bg-teal-50 text-teal-600 rounded-lg transition"
                            title="View Credentials"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(f)} className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFranchises.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No franchise owners registered yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredFranchises.map(f => {
            const initials = f.owner_name ? f.owner_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FO';
            return (
              <div key={f.id} className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
                {/* Header: Title and Status */}
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 tracking-tight">{f.franchise_name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs text-slate-500 font-semibold">{f.city}, {f.state}</span>
                    </div>
                  </div>
                  
                  <span 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase cursor-pointer select-none ${
                      f.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : f.status === "Inactive"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                    onDoubleClick={() => handleToggleStatus(f)}
                    title="Double-click to toggle status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      f.status === "Active" ? "bg-emerald-500" : f.status === "Inactive" ? "bg-rose-500" : "bg-amber-500"
                    }`} />
                    {f.status}
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
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{f.owner_name}</p>
                    </div>
                  </div>

                  {/* Contact & Business Info */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobile Number</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{f.mobile}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1 truncate" title={f.email}>{f.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Commission Rate</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">{f.commission_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Status</p>
                      {f.franch_user_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200/20 px-2 py-0.5 rounded-md mt-1">
                          Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200/20 px-2 py-0.5 rounded-md mt-1">
                          Not Setup
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {!f.franch_user_id ? (
                      <button
                        onClick={() => handleApprove(f)}
                        disabled={approvingId === f.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => setCredModal({ email: f.email, password: null, owner_name: f.owner_name, franchise_name: f.franchise_name, franch_user_id: f.franch_user_id })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-sm"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Credentials
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(f)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="Edit Owner Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Delete Franchise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFranchises.length === 0 && (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl py-16 text-center">
              <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No franchise owners registered yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">
                {editingFranchise ? "Edit Franchise" : "Register New Franchise"}
              </h3>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-1">Configure owner and territory details</p>
            </div>
            <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Franchise Name / Branch</label>
                <input type="text" required value={form.franchise_name} onChange={e => setForm({ ...form, franchise_name: e.target.value })} placeholder="e.g. Veetu Rusi Coimbatore" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Owner Name</label>
                  <input type="text" required value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Ram Kumar" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Mobile Number</label>
                  <input type="text" required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="9876543210" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Email Address</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ram@veeturusi.com" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">City</label>
                  <input type="text" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Coimbatore" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">State</label>
                  <input type="text" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Tamil Nadu" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Commission (%)</label>
                  <input type="number" step="0.01" required value={form.commission_percentage} onChange={e => setForm({ ...form, commission_percentage: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/70 flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition active:scale-95">
                {editingFranchise ? "Update" : "Register Franchise"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition">
                Cancel
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Approve Password Modal */}
      {approveModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApproveModal(null)} />
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Approve Franchise</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{approveModal.franchise.franchise_name}</p>
                </div>
              </div>
              <button onClick={() => setApproveModal(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">Set a login password for <span className="text-slate-800 font-bold">{approveModal.franchise.owner_name}</span>. This will create an <span className="text-emerald-700 font-bold">admin</span> account using the registered email.</p>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Login Email</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 font-mono">{approveModal.franchise.email}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showApprovePw ? "text" : "password"}
                    value={approvePw}
                    onChange={e => setApprovePw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmApprove()}
                    placeholder="Enter password for this franchise admin"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 pr-12 transition-all"
                  />
                  <button type="button" onClick={() => setShowApprovePw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                    {showApprovePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmApprove}
                  disabled={approvingId === approveModal.franchise.id}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {approvingId === approveModal.franchise.id ? "Approving…" : "Approve & Create Account"}
                </button>
                <button onClick={() => setApproveModal(null)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-xl transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Credentials Modal */}
      {credModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setCredModal(null); setShowPw(false); }} />
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Login Credentials</h3>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">admin access</p>
                </div>
              </div>
              <button onClick={() => { setCredModal(null); setShowPw(false); }} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Franchise info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Franchise</p>
                <p className="text-sm font-black text-slate-800">{credModal.franchise_name}</p>
                <p className="text-xs text-slate-500 font-semibold">{credModal.owner_name}</p>
              </div>

              {/* User ID */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Franchise User ID (UUID)</p>
                {credModal.franch_user_id ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-teal-700 font-mono flex-1 truncate">{credModal.franch_user_id}</code>
                    <button onClick={() => copy(credModal.franch_user_id)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                    ⏳ Pending Approval — UUID assigned after Approve
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Login Email</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 flex-1">{credModal.email}</span>
                  <button onClick={() => copy(credModal.email)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Password</p>
                {credModal.password ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700 flex-1 font-mono">
                      {showPw ? credModal.password : "•".repeat(credModal.password.length)}
                    </span>
                    <button onClick={() => setShowPw(p => !p)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copy(credModal.password)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Password was set at registration — not shown again for security. Reset if needed.</p>
                )}
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <div>
                  <p className="text-[10px] text-teal-700 font-black uppercase tracking-widest">Role Assigned</p>
                  <p className="text-xs text-slate-700 font-bold">admin</p>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 italic text-center">Share these credentials securely. Password cannot be recovered later.</p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { setCredModal(null); setShowPw(false); }}
                className="w-full py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white font-black text-xs uppercase tracking-widest rounded-xl transition active:scale-95 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FranchiseOwnerManagement;
