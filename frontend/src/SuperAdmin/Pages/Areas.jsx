import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import api from "../../api";
import { toast } from "react-hot-toast";
import AddAreaModal from "../AddAreaModal";

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const paginatedAreas = filteredAreas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAreas.length / itemsPerPage);

  const handleAddClick = () => {
    setSelectedArea(null);
    setShowModal(true);
  };

  const handleEditClick = (area) => {
    setSelectedArea(area);
    setShowModal(true);
  };

  const handleAreaAdded = (area) => {
    setAreas((prev) => [area, ...prev]);
    toast.success('Area added successfully');
  };

  const handleAreaUpdated = (updatedArea) => {
    setAreas((prev) => prev.map((area) => (area.id === updatedArea.id ? updatedArea : area)));
    toast.success('Area updated successfully');
  };

  const handleDelete = async (area) => {
    if (!window.confirm(`Delete ${area.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/areas/${area.id}`);
      setAreas((prev) => prev.filter((item) => item.id !== area.id));
      toast.success('Area deleted successfully');
    } catch (err) {
      console.error('Delete area error', err);
      toast.error(err?.response?.data?.message || 'Failed to delete area');
    }
  };

  const handleToggleStatus = async (area) => {
    const nextStatus = String(area.status || 'Active').toLowerCase() === 'active' ? 'Inactive' : 'Active';
    try {
      setStatusUpdatingId(area.id);
      const res = await api.patch(`/areas/status/${area.id}`, { status: nextStatus });
      const updatedArea = res?.data?.area || res?.data;
      if (updatedArea) {
        setAreas((prev) => prev.map((item) => (item.id === updatedArea.id ? updatedArea : item)));
      } else {
        setAreas((prev) => prev.map((item) => (item.id === area.id ? { ...item, status: nextStatus } : item)));
      }
      toast.success(`Area status set to ${nextStatus}.`);
    } catch (err) {
      console.error('Toggle area status error', err);
      toast.error(err?.response?.data?.message || 'Failed to update area status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleModalSuccess = (data) => {
    const area = data.area || data;
    if (selectedArea) {
      handleAreaUpdated(area);
    } else {
      handleAreaAdded(area);
    }
    setShowModal(false);
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
          onClick={handleAddClick}
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
                <th className="px-5 py-4">Status</th>
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
              ) : paginatedAreas.length === 0 && filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                    No areas match your search.
                  </td>
                </tr>
              ) : (
                paginatedAreas.map((area, index) => (
                  <tr key={area.id || index} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-300">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-5 py-4 text-white font-semibold">{area.name}</td>
                    <td className="px-5 py-4 text-slate-300">{area.pincode}</td>
                    <td className="px-5 py-4 text-slate-300">{area.created_by || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-300">{area.created_at ? new Date(area.created_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={statusUpdatingId === area.id}
                        onDoubleClick={() => handleToggleStatus(area)}
                        title="Double click to toggle status"
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] transition ${String(area.status || 'Active').toLowerCase() === 'active'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/15'
                          } ${statusUpdatingId === area.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {statusUpdatingId === area.id ? 'Updating...' : (area.status || 'Active')}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleEditClick(area)}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                          title="Edit area"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(area)}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-rose-300 transition hover:bg-white/10"
                          title="Delete area"
                        >
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition cursor-pointer"
          >
            Previous
          </button>

          <span className="text-sm font-medium text-white">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <AddAreaModal
          open={showModal}
          initialData={selectedArea}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Areas;
