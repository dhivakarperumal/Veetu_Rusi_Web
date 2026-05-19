import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Plus, Trash2, Edit2, Landmark, MapPin } from "lucide-react";

const FranchiseOwnerManagement = () => {
  const [franchises, setFranchises] = useState([]);
  const [filteredFranchises, setFilteredFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState(null);

  // Form State
  const [form, setForm] = useState({
    franchise_name: "",
    owner_name: "",
    mobile: "",
    email: "",
    city: "",
    state: "",
    commission_percentage: "10.00",
    status: "Active"
  });

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/franchises");
      setFranchises(res.data);
      setFilteredFranchises(res.data);
    } catch (error) {
      toast.error("Failed to load franchises.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim()) {
      const lower = search.toLowerCase();
      setFilteredFranchises(
        franchises.filter(
          (f) =>
            f.franchise_name.toLowerCase().includes(lower) ||
            f.owner_name.toLowerCase().includes(lower) ||
            f.city.toLowerCase().includes(lower)
        )
      );
    } else {
      setFilteredFranchises(franchises);
    }
  }, [search, franchises]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFranchise) {
        await api.put(`/superadmin/franchises/${editingFranchise.id}`, form);
        toast.success("Franchise configuration updated.");
      } else {
        await api.post("/superadmin/franchises", form);
        toast.success("New franchise owner registered successfully.");
      }
      setIsModalOpen(false);
      resetForm();
      fetchFranchises();
    } catch (error) {
      toast.error("Failed to save franchise.");
    }
  };

  const handleEdit = (franchise) => {
    setEditingFranchise(franchise);
    setForm(franchise);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this franchise?")) return;
    try {
      await api.delete(`/superadmin/franchises/${id}`);
      toast.success("Franchise owner removed.");
      fetchFranchises();
    } catch (error) {
      toast.error("Failed to delete franchise.");
    }
  };

  const resetForm = () => {
    setEditingFranchise(null);
    setForm({
      franchise_name: "",
      owner_name: "",
      mobile: "",
      email: "",
      city: "",
      state: "",
      commission_percentage: "10.00",
      status: "Active"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Franchise Owners</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Register new franchise territories, manage owner details, and track payouts
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Franchise
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by franchise name, owner or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Franchise Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Owner Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Territory</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Commission Share</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFranchises.map((f) => (
                  <tr key={f.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{f.franchise_name}</h4>
                          <p className="text-xs text-white/40 font-semibold">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{f.owner_name}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{f.city}, {f.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-white">{f.commission_percentage}%</td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          f.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
                          title="Delete Franchise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFranchises.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No franchise owners registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleSubmit}
            className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">
                {editingFranchise ? "Edit Franchise configuration" : "Register New Franchise"}
              </h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Configure owner and territory details</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Franchise Name / Branch</label>
                  <input
                    type="text"
                    required
                    value={form.franchise_name}
                    onChange={(e) => setForm({ ...form, franchise_name: e.target.value })}
                    placeholder="e.g. Veetu Rusi Coimbatore"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    placeholder="Ram Kumar"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ram@veeturusi.com"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Coimbatore"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">State</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Tamil Nadu"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Commission Share (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.commission_percentage}
                    onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                    placeholder="10.00"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
              >
                {editingFranchise ? "Update Settings" : "Register Franchise"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FranchiseOwnerManagement;
