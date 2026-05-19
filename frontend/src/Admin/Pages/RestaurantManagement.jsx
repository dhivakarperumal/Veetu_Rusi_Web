import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Trash2, Check, X, ShieldAlert, Eye, ArrowLeft, Landmark, UserCheck, FileText, MapPin, Clock, CheckCircle } from "lucide-react";

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRest, setSelectedRest] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("outlet");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

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
          r.name.toLowerCase().includes(lower) ||
          r.owner_name.toLowerCase().includes(lower) ||
          r.email.toLowerCase().includes(lower)
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
      // Fetch details first to modify
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
    } catch (error) {
      toast.error("Failed to delete restaurant.");
    }
  };

  if (selectedRest) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header with Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setSelectedRest(null)}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl transition shadow-sm active:scale-95 self-start animate-in fade-in duration-255"
          >
            ← Back to List
          </button>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {selectedRest.status !== "Approved" && (
              <button
                onClick={async () => {
                  const targetId = selectedRest.id;
                  await handleStatusChange(targetId, "Approved");
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
              >
                <Check className="w-4 h-4" /> Approve Restaurant
              </button>
            )}
            {selectedRest.status === "Approved" && (
              <button
                onClick={async () => {
                  const targetId = selectedRest.id;
                  await handleStatusChange(targetId, "Suspended");
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" /> Suspend Restaurant
              </button>
            )}
            <button
              onClick={async () => {
                const id = selectedRest.id;
                setSelectedRest(null);
                await handleDelete(id);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Restaurant
            </button>
          </div>
        </div>

        {/* Full Details Content Card */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">{selectedRest.name}</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-500 font-semibold">{selectedRest.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                selectedRest.status === "Approved"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                  : selectedRest.status === "Pending"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200/50"
                  : "bg-red-50 text-red-700 border border-red-200/50"
              }`}>{selectedRest.status}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Tabs */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 border-r border-slate-100 pr-6">
              <button
                onClick={() => setActiveDetailTab("outlet")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${
                  activeDetailTab === "outlet"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Landmark className="w-4 h-4" />
                Outlet Info
              </button>
              <button
                onClick={() => setActiveDetailTab("owner")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${
                  activeDetailTab === "owner"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Owner Profile
              </button>
              <button
                onClick={() => setActiveDetailTab("compliance")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${
                  activeDetailTab === "compliance"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Compliance & Docs
              </button>
            </div>

            {/* Right Side: Tab Details Content */}
            <div className="flex-1 min-w-0">
              {activeDetailTab === "outlet" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Outlet Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Outlet Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedRest.name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Status</span>
                      <span className={`inline-flex text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider mt-0.5 ${
                        selectedRest.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : selectedRest.status === "Pending"
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200/50"
                          : "bg-red-50 text-red-700 border border-red-200/50"
                      }`}>{selectedRest.status}</span>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Outlet Address</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                        <span className="text-sm font-bold text-slate-700">{selectedRest.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "owner" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Owner Profile Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Owner Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedRest.owner_name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Email Address</span>
                      <span className="text-sm font-bold text-slate-800">{selectedRest.email}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Mobile Phone</span>
                      <span className="text-sm font-bold text-slate-800">{selectedRest.mobile}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "compliance" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Compliance & Licensing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">GST Registration Number</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{selectedRest.gst_number || "Not Provided"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">FSSAI License Number</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{selectedRest.fssai_number || "Not Provided"}</span>
                    </div>
                  </div>
                  
                  {/* Action verification boxes */}
                  {selectedRest.status === "Pending" && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center text-amber-600 border border-amber-200/50 flex-shrink-0">
                          <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-800 uppercase tracking-tight">Pending Compliance Verification</p>
                          <p className="text-xs text-amber-600/80 font-bold mt-0.5">Verify that the GST and FSSAI license numbers match legal documents before approving.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={async () => {
                            await handleStatusChange(selectedRest.id, "Approved");
                            setSelectedRest(null);
                          }}
                          className="px-5 py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-xl text-xs font-black uppercase tracking-widest transition active:scale-95 shadow-md flex-shrink-0"
                        >
                          Approve Outlet
                        </button>
                        <button
                          onClick={async () => {
                            await handleStatusChange(selectedRest.id, "Rejected");
                            setSelectedRest(null);
                          }}
                          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition active:scale-95 shadow-md flex-shrink-0"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }  const totalCount = restaurants.length;
  const approvedCount = restaurants.filter(r => r.status === "Approved").length;
  const pendingCount = restaurants.filter(r => r.status === "Pending").length;
  const suspendedCount = restaurants.filter(r => r.status === "Suspended").length;

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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Restaurant Management</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Approve/Reject restaurants, verify GST/FSSAI compliance and manage outlets
          </p>
        </div>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, owner or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 text-xs uppercase tracking-wider focus:bg-white focus:border-slate-300 transition-all cursor-pointer shadow-sm min-w-[160px]"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Suspended">Suspended</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700 text-white border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">S.No</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Outlet Details</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Owner Info</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Compliance / Docs</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white/90 text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRestaurants.map((rest, index) => {
                  const sNo = ((currentPage - 1) * ITEMS_PER_PAGE) + index + 1;
                  return (
                    <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{sNo}</td>
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{rest.name}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{rest.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-700">{rest.owner_name}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{rest.mobile}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs text-slate-500 font-semibold">
                          <div>GST: <span className="font-bold text-slate-700 font-mono">{rest.gst_number || "N/A"}</span></div>
                          <div>FSSAI: <span className="font-bold text-slate-700 font-mono">{rest.fssai_number || "N/A"}</span></div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 cursor-pointer select-none"
                        onDoubleClick={() => {
                          const nextStatus = rest.status === "Approved" ? "Suspended" : "Approved";
                          handleStatusChange(rest.id, nextStatus);
                        }}
                        title="Double click to toggle status"
                      >
                        <span
                          className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition ${
                            rest.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : rest.status === "Pending"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200/50"
                              : "bg-red-50 text-red-700 border border-red-200/50"
                          }`}
                        >
                          {rest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRest(rest);
                              setActiveDetailTab("outlet");
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {rest.status !== "Approved" && (
                            <button
                              onClick={() => handleStatusChange(rest.id, "Approved")}
                              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
                              title="Approve Restaurant"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {rest.status === "Approved" && (
                            <button
                              onClick={() => handleStatusChange(rest.id, "Suspended")}
                              className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition"
                              title="Suspend Restaurant"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(rest.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                            title="Delete Restaurant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedRestaurants.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-xs text-slate-400 italic">
                      No restaurants match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRestaurants.length)} of {filteredRestaurants.length} entries
          </p>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition disabled:cursor-not-allowed shadow-sm"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 text-[10px] font-black rounded-xl transition ${
                  currentPage === page
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;
