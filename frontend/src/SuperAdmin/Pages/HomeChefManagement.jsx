import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Trash2, Check, X, ShieldAlert, Eye, Plus } from "lucide-react";

const HomeChefManagement = () => {
  const [chefs, setChefs] = useState([]);
  const [filteredChefs, setFilteredChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedChef, setSelectedChef] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/homechefs");
      setChefs(res.data);
      setFilteredChefs(res.data);
    } catch (error) {
      toast.error("Failed to load home chefs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = chefs;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.mobile.includes(lower) ||
          c.email.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFilteredChefs(result);
  }, [search, statusFilter, chefs]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/superadmin/homechefs/status/${id}`, { status: newStatus });
      toast.success(`Home Chef status updated to ${newStatus}`);
      fetchChefs();
      if (selectedChef?.id === id) {
        setSelectedChef((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error("Failed to change home chef status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this home chef?")) return;
    try {
      await api.delete(`/superadmin/homechefs/${id}`);
      toast.success("Home chef profile removed.");
      fetchChefs();
    } catch (error) {
      toast.error("Failed to delete chef.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Home Chef Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Approve applications, inspect documents and suspend/delete chefs
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email or mobile..."
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

      {/* Loading Skeleton / Table */}
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
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Chef Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Mobile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">FSSAI</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredChefs.map((chef) => (
                  <tr key={chef.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <h4 className="text-sm font-black text-white">{chef.name}</h4>
                        <p className="text-xs text-white/40 font-semibold">{chef.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{chef.mobile}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{chef.fssai_number || "N/A"}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          chef.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : chef.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {chef.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedChef(chef);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {chef.status !== "Approved" && (
                          <button
                            onClick={() => handleStatusChange(chef.id, "Approved")}
                            className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition"
                            title="Approve Chef"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {chef.status === "Approved" && (
                          <button
                            onClick={() => handleStatusChange(chef.id, "Suspended")}
                            className="p-2 hover:bg-amber-500/10 text-amber-400 rounded-xl transition"
                            title="Suspend Chef"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(chef.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
                          title="Delete Chef"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredChefs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No home chefs match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedChef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">{selectedChef.name}</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Home Chef Details</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Mobile Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedChef.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Email Address</p>
                  <p className="text-sm font-black mt-0.5">{selectedChef.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-white/40 font-bold uppercase">Pickup Address</p>
                  <p className="text-sm font-bold mt-0.5 text-white/80">{selectedChef.address}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">FSSAI License Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedChef.fssai_number || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Application Status</p>
                  <p className="text-sm font-black mt-0.5">{selectedChef.status}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Uploaded Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#070b13] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-between text-center gap-3">
                    <p className="text-[10px] font-black uppercase text-white/50">Aadhaar Card</p>
                    {selectedChef.aadhaar_url ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/../uploads/homechefs/${selectedChef.aadhaar_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold transition uppercase"
                      >
                        View File
                      </a>
                    ) : (
                      <p className="text-xs text-white/20 italic">No Upload</p>
                    )}
                  </div>
                  <div className="bg-[#070b13] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-between text-center gap-3">
                    <p className="text-[10px] font-black uppercase text-white/50">PAN Card</p>
                    {selectedChef.pan_url ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/../uploads/homechefs/${selectedChef.pan_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold transition uppercase"
                      >
                        View File
                      </a>
                    ) : (
                      <p className="text-xs text-white/20 italic">No Upload</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              {selectedChef.status !== "Approved" && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedChef.id, "Approved");
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                >
                  Approve Application
                </button>
              )}
              {selectedChef.status === "Pending" && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedChef.id, "Rejected");
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                >
                  Reject Application
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeChefManagement;
