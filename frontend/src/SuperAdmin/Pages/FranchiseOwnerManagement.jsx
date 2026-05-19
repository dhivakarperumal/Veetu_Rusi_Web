import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search, Plus, Trash2, Edit2, Landmark, MapPin,
  CheckCircle, Copy, Eye, EyeOff, UserCheck, KeyRound, X
} from "lucide-react";

const FranchiseOwnerManagement = () => {
  const [franchises, setFranchises] = useState([]);
  const [filteredFranchises, setFilteredFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    if (search.trim()) {
      const lower = search.toLowerCase();
      setFilteredFranchises(franchises.filter(f =>
        f.franchise_name?.toLowerCase().includes(lower) ||
        f.owner_name?.toLowerCase().includes(lower) ||
        f.city?.toLowerCase().includes(lower)
      ));
    } else { setFilteredFranchises(franchises); }
  }, [search, franchises]);

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

  const inputCls = "w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Franchise Owners</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Register territories, approve owners & manage credentials</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Franchise
        </button>
      </div>

      {/* Search */}
      <div className="flex bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text" placeholder="Search by franchise name, owner or city..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#070b13]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Franchise</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Owner</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Territory</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Commission</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFranchises.map(f => (
                  <tr key={f.id} className="hover:bg-white/5 transition-colors">
                    {/* Franchise */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{f.franchise_name}</h4>
                          <p className="text-xs text-white/40">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Owner */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-white/80">{f.owner_name}</p>
                      <p className="text-xs text-white/40">{f.mobile}</p>
                    </td>
                    {/* Territory */}
                    <td className="px-5 py-4 text-sm font-bold text-white/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{f.city}, {f.state}</span>
                      </div>
                    </td>
                    {/* Commission */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-1 rounded-lg">
                        {f.commission_percentage}%
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          f.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : f.status === "Inactive"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>{f.status}</span>
                        {f.franch_user_id && (
                          <p className="text-[9px] text-white/20 font-mono">{f.franch_user_id.slice(0, 8)}…</p>
                        )}
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
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition disabled:opacity-50"
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
                            className="p-2 hover:bg-white/10 text-teal-400 rounded-xl transition"
                            title="View Credentials"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(f)} className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFranchises.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <Landmark className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No franchise owners registered yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">
                {editingFranchise ? "Edit Franchise" : "Register New Franchise"}
              </h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Configure owner and territory details</p>
            </div>
            <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Franchise Name / Branch</label>
                <input type="text" required value={form.franchise_name} onChange={e => setForm({ ...form, franchise_name: e.target.value })} placeholder="e.g. Veetu Rusi Coimbatore" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Owner Name</label>
                  <input type="text" required value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Ram Kumar" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Mobile Number</label>
                  <input type="text" required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="9876543210" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Email Address</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ram@veeturusi.com" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">City</label>
                  <input type="text" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Coimbatore" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">State</label>
                  <input type="text" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Tamil Nadu" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Commission (%)</label>
                  <input type="number" step="0.01" required value={form.commission_percentage} onChange={e => setForm({ ...form, commission_percentage: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95">
                {editingFranchise ? "Update" : "Register Franchise"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition">
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setApproveModal(null)} />
          <div className="bg-[#0B1120] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-900/70 to-[#0B1120] p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Approve Franchise</h3>
                  <p className="text-[10px] text-white/40 font-bold mt-0.5">{approveModal.franchise.franchise_name}</p>
                </div>
              </div>
              <button onClick={() => setApproveModal(null)} className="p-2 hover:bg-white/10 text-white/40 rounded-xl transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-white/50">Set a login password for <span className="text-white font-bold">{approveModal.franchise.owner_name}</span>. This will create an <span className="text-emerald-400 font-bold">admin</span> account using the registered email.</p>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Login Email</label>
                <div className="px-4 py-3 bg-white/5 rounded-2xl text-sm text-white/60 font-mono">{approveModal.franchise.email}</div>
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showApprovePw ? "text" : "password"}
                    value={approvePw}
                    onChange={e => setApprovePw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmApprove()}
                    placeholder="Enter password for this franchise admin"
                    autoFocus
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/10 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/40 pr-12"
                  />
                  <button type="button" onClick={() => setShowApprovePw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition">
                    {showApprovePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmApprove}
                  disabled={approvingId === approveModal.franchise.id}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {approvingId === approveModal.franchise.id ? "Approving…" : "Approve & Create Account"}
                </button>
                <button onClick={() => setApproveModal(null)} className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase rounded-2xl transition">
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setCredModal(null); setShowPw(false); }} />
          <div className="bg-[#0B1120] border border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/40 p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Login Credentials</h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">admin access</p>
                </div>
              </div>
              <button onClick={() => { setCredModal(null); setShowPw(false); }} className="p-2 hover:bg-white/10 text-white/40 rounded-xl transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Franchise info */}
              <div className="bg-white/5 rounded-2xl p-4 space-y-1">
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Franchise</p>
                <p className="text-sm font-black text-white">{credModal.franchise_name}</p>
                <p className="text-xs text-white/50">{credModal.owner_name}</p>
              </div>

              {/* User ID */}
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Franchise User ID (UUID)</p>
                {credModal.franch_user_id ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-teal-400 font-mono flex-1 truncate">{credModal.franch_user_id}</code>
                    <button onClick={() => copy(credModal.franch_user_id)} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                    ⏳ Pending Approval — UUID assigned after Approve
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Login Email</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white flex-1">{credModal.email}</span>
                  <button onClick={() => copy(credModal.email)} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Password</p>
                {credModal.password ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-400 flex-1 font-mono">
                      {showPw ? credModal.password : "•".repeat(credModal.password.length)}
                    </span>
                    <button onClick={() => setShowPw(p => !p)} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copy(credModal.password)} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-white/30 italic">Password was set at registration — not shown again for security. Reset if needed.</p>
                )}
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="text-[10px] text-teal-400 font-black uppercase tracking-widest">Role Assigned</p>
                  <p className="text-xs text-white/60 font-bold">admin</p>
                </div>
              </div>

              <p className="text-[9px] text-white/20 italic text-center">Share these credentials securely. Password cannot be recovered later.</p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { setCredModal(null); setShowPw(false); }}
                className="w-full py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition active:scale-95"
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
