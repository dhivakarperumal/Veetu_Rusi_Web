import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Percent, Save, Edit2, Search, List, LayoutGrid } from "lucide-react";

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [usingDummyData, setUsingDummyData] = useState(false);

  const fallbackCommissions = [
    {
      id: 1,
      type: "Delivery Partner",
      commission_value: 5.0,
      description: "Fee collected from delivery partner transactions when the order is completed.",
      status: "Active"
    },
    {
      id: 2,
      type: "Franchise",
      commission_value: 2.5,
      description: "Fee collected from franchise transactions when the order is completed.",
      status: "Active"
    },
    {
      id: 3,
      type: "Home Chef",
      commission_value: 10.0,
      description: "Fee collected from home chef transactions when the order is completed.",
      status: "Active"
    }
  ];

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/commissions");
      const data = Array.isArray(res.data) && res.data.length ? res.data : fallbackCommissions;
      setCommissions(data);
      setUsingDummyData(!Array.isArray(res.data) || res.data.length === 0);
    } catch (error) {
      setCommissions(fallbackCommissions);
      setUsingDummyData(true);
      toast.error("Failed to load commission settings. Showing sample data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const numVal = parseFloat(editValue);
      if (isNaN(numVal) || numVal < 0) {
        toast.error("Please enter a valid positive number.");
        return;
      }
      await api.put(`/superadmin/commissions/${id}`, {
        commission_value: numVal,
        is_percentage: 1
      });
      toast.success("Commission rule updated.");
      setEditingId(null);
      fetchCommissions();
    } catch (error) {
      toast.error("Failed to update commission.");
    }
  };

  const totalRules = commissions.length;
  const highestRate = commissions.length > 0 ? Math.max(...commissions.map((c) => Number(c.commission_value))) : 0;
  const lowestRate = commissions.length > 0 ? Math.min(...commissions.map((c) => Number(c.commission_value))) : 0;

  const visibleCommissions = commissions.filter((comm) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [comm.type, String(comm.commission_value), comm.description]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "All" || !comm.status || comm.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-4xl p-4 md:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search commission type or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-[1.75rem] border border-slate-800 bg-slate-900 text-slate-100 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-40 px-4 py-3 rounded-[1.75rem] border border-slate-800 bg-slate-900 text-slate-100 text-xs uppercase tracking-[0.18em] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="inline-flex rounded-[1.75rem] border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-3 rounded-xl transition ${viewMode === "table" ? "bg-emerald-500/10 text-emerald-300 shadow-sm" : "text-slate-400 hover:text-white"}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`p-3 rounded-xl transition ${viewMode === "card" ? "bg-emerald-500/10 text-emerald-300 shadow-sm" : "text-slate-400 hover:text-white"}`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {usingDummyData && (
        <div className="flex justify-end">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-700 shadow-sm">
            Demo data in use
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-4xl bg-slate-300/80 border border-slate-200/80 p-6 shadow-lg">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.35em] font-black mb-3">Total Rules</p>
          <p className="text-5xl font-black text-slate-900">{totalRules}</p>
        </div>
        <div className="rounded-4xl bg-slate-300/80 border border-slate-200/80 p-6 shadow-lg">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.35em] font-black mb-3">Highest Rate</p>
          <p className="text-5xl font-black text-slate-900">{highestRate}%</p>
        </div>
        <div className="rounded-4xl bg-slate-300/80 border border-slate-200/80 p-6 shadow-lg">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.35em] font-black mb-3">Lowest Rate</p>
          <p className="text-5xl font-black text-slate-900">{lowestRate}%</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visibleCommissions.length ? visibleCommissions.map((comm) => {
            const isEditing = editingId === comm.id;
            return (
              <div key={comm.id} className="rounded-4xl border border-white/10 bg-[#0B1120]/60 p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">{comm.type} Commission</p>
                      <p className="mt-2 text-2xl font-black text-white">{comm.commission_value}%</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-2xl bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
                    {comm.status || "Active"}
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-7 mb-6">
                  Fee collected from {comm.type.toLowerCase()} transactions when the order is completed.
                </p>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070b13] px-4 py-3 text-white font-black outline-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdate(comm.id)}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-500"
                      >
                        <Save className="inline-block w-4 h-4 mr-2" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(comm.id);
                      setEditValue(comm.commission_value);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                  >
                    <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Rate
                  </button>
                )}
              </div>
            );
          }) : (
            <div className="w-full rounded-4xl border border-white/10 bg-[#0B1120]/60 p-10 text-center text-sm text-white/60">
              No commissions match your search.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-4xl overflow-hidden shadow-xl border border-slate-200">
          {visibleCommissions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white/70">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Commission Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Current Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Description</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleCommissions.map((comm) => {
                    const isEditing = editingId === comm.id;
                    return (
                      <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <Percent className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{comm.type} Commission</p>
                              <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em]">{comm.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-black text-lg w-28 outline-none"
                            />
                          ) : (
                            <span className="text-3xl font-black text-slate-900">{comm.commission_value}%</span>
                          )}
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-slate-600 leading-6">
                          {comm.description || `Fee collected from ${comm.type.toLowerCase()} transactions when the order is completed.`}
                        </td>
                        <td className="px-6 py-5 align-top text-center">
                          {isEditing ? (
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => handleUpdate(comm.id)}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2"
                              >
                                <Save className="w-4 h-4" /> Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(comm.id);
                                setEditValue(comm.commission_value);
                              }}
                              className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit Rate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              No commissions match your search or filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;
