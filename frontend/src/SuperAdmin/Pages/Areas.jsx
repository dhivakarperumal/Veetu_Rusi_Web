import React, { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2 } from "lucide-react";
import api from "../../api";
import { toast } from "react-hot-toast";
import AddAreaModal from "../AddAreaModal";

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const res = await api.get('/areas');
      setAreas(res?.data || []);
    } catch (err) {
      console.error('Fetch areas error', err);
      toast.error(err?.response?.data?.message || 'Unable to load areas');
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!search.trim()) return areas;
    const term = search.toLowerCase();
    return areas.filter(
      (area) =>
        area.name?.toLowerCase().includes(term) ||
        area.pincode?.toString().includes(term) ||
        area.created_by?.toLowerCase().includes(term)
    );
  }, [areas, search]);

  const handleAreaAdded = (area) => {
    setAreas((prev) => [area, ...prev]);
    toast.success('Area added successfully');
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Areas Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Manage service areas and pincodes for your delivery zones. Add new areas and review registered ones from one place.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Add Area
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-4xl border border-white/10 bg-[#0B1120]/80 p-5 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Areas</p>
          <p className="mt-4 text-4xl font-black text-white">{areas.length}</p>
          <p className="mt-2 text-sm text-slate-500">All registered delivery areas</p>
        </div>

        <div className="rounded-4xl border border-white/10 bg-[#0B1120]/80 p-5 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Search</p>
          <div className="mt-4 relative rounded-3xl border border-white/10 bg-[#070B13]/80 px-4 py-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search area, pincode or creator"
              className="w-full bg-transparent pl-10 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-[#0B1120]/80 p-5 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Matched Results</p>
          <p className="mt-4 text-4xl font-black text-white">{filteredAreas.length}</p>
          <p className="mt-2 text-sm text-slate-500">Showing filtered area count</p>
        </div>
      </div>

      <div className="rounded-4xl border border-white/10 bg-[#0B1120]/60 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-white">Registered Areas</h2>
            <p className="text-sm text-slate-400">Browse your active delivery areas with pincodes.</p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#070B13]/80 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search areas"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                <th className="px-5 py-4">S.NO</th>
                <th className="px-5 py-4">Area</th>
                <th className="px-5 py-4">Pincode</th>
                <th className="px-5 py-4">Created By</th>
                <th className="px-5 py-4">Created At</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loadingAreas ? (
                [...Array(6)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                    <td className="h-16 px-5 py-4 bg-white/5 rounded-xl"></td>
                  </tr>
                ))
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                    No areas match your search.
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area, index) => (
                  <tr key={area.id || index} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-300">{index + 1}</td>
                    <td className="px-5 py-4 text-white font-semibold">{area.name}</td>
                    <td className="px-5 py-4 text-slate-300">{area.pincode}</td>
                    <td className="px-5 py-4 text-slate-300">{area.created_by || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-300">{area.created_at ? new Date(area.created_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button type="button" className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddAreaModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={(data) => {
            handleAreaAdded(data.area || data);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Areas;
