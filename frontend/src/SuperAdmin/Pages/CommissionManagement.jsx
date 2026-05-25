import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { 
  Percent, 
  Save, 
  Edit2, 
  Search, 
  List, 
  LayoutGrid,
  Plus,
  Eye,
  Trash2,
  Building,
  CheckCircle2,
  XCircle,
  X
} from "lucide-react";

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  // State for Add Commission Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [franchises, setFranchises] = useState([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [newCommissionRate, setNewCommissionRate] = useState("");
  const [loadingFranchises, setLoadingFranchises] = useState(false);

  const fallbackCommissions = [
    {
      id: 1,
      type: "Franchise",
      commission_value: 2.5,
      description: "Fee collected from franchise transactions when the order is completed.",
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
      let data = Array.isArray(res.data) && res.data.length ? res.data : fallbackCommissions;
      
      // Only keep franchise commissions
      data = data.filter(c => c.type && c.type.toLowerCase().includes('franchise'));
      if (data.length === 0) data = fallbackCommissions;
      
      setCommissions(data);
    } catch (error) {
      setCommissions(fallbackCommissions);
      toast.error("Failed to load commission settings. Showing sample data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      setLoadingFranchises(true);
      const res = await api.get("/superadmin/franchises");
      setFranchises(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch franchise owners.");
    } finally {
      setLoadingFranchises(false);
    }
  };

  const handleOpenAddModal = () => {
    fetchFranchises();
    setIsAddModalOpen(true);
    setSelectedFranchiseId("");
    setNewCommissionRate("");
  };

  const handleAddCommission = async () => {
    if (!selectedFranchiseId) {
      return toast.error("Please select a franchise owner.");
    }
    if (!newCommissionRate || isNaN(newCommissionRate) || Number(newCommissionRate) < 0) {
      return toast.error("Please enter a valid commission rate.");
    }

    try {
      // Find the selected franchise to keep its existing data
      const franchise = franchises.find(f => String(f.id) === String(selectedFranchiseId));
      if (!franchise) return toast.error("Franchise not found.");

      const updatedForm = {
        franchise_name: franchise.franchise_name,
        owner_name: franchise.owner_name,
        mobile: franchise.mobile,
        email: franchise.email,
        city: franchise.city,
        state: franchise.state,
        commission_percentage: newCommissionRate,
        status: franchise.status
      };

      await api.put(`/superadmin/franchises/${selectedFranchiseId}`, updatedForm);
      toast.success("Commission added/updated for franchise owner successfully!");
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update commission.");
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
    <div className="p-6 space-y-6  min-h-screen font-sans">
      
      {/* Top Header Section */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#1b4332] hover:bg-[#143425] text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          ADD COMMISSION
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-5 border-l-[6px] border-l-slate-400">
          <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL COMMISSIONS</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{totalRules}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-5 border-l-[6px] border-l-emerald-500">
          <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">HIGHEST RATE</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{highestRate}%</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-5 border-l-[6px] border-l-amber-500">
          <div className="w-14 h-14 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">LOWEST RATE</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{lowestRate}%</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search commission type or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 uppercase tracking-wider focus:outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-md transition-all ${viewMode === "card" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card view implementation (simplified for brevity) */}
          {visibleCommissions.map((comm) => (
            <div key={comm.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                   <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                     <Percent className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800">{comm.type}</h4>
                     <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{comm.status}</span>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{comm.commission_value}%</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6">{comm.description}</p>
              <div className="flex justify-end gap-2">
                 <button onClick={() => { setEditingId(comm.id); setEditValue(comm.commission_value); }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-lg hover:bg-emerald-50">
                   <Edit2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a3441] text-white">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest w-20">S.No</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Commission Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Rate</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCommissions.length ? visibleCommissions.map((comm, index) => {
                  const isEditing = editingId === comm.id;
                  return (
                    <tr key={comm.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-500">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Percent className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{comm.type}</p>
                            <p className="text-xs text-slate-400">Commission Rule</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-md">
                            {comm.commission_value}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500 line-clamp-2 max-w-xs">{comm.description}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                          {comm.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdate(comm.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button className="text-slate-400 hover:text-emerald-600 transition-colors">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(comm.id);
                                setEditValue(comm.commission_value);
                              }}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button className="text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-500 text-sm">
                      No commissions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Commission Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Add Commission</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Franchise Owner</label>
                <select
                  value={selectedFranchiseId}
                  onChange={(e) => setSelectedFranchiseId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">-- Choose Franchise Owner --</option>
                  {franchises.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.franchise_name} ({f.owner_name}) - Current: {f.commission_percentage}%
                    </option>
                  ))}
                </select>
                {loadingFranchises && <p className="text-xs text-emerald-600 font-semibold animate-pulse">Loading franchises...</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 10.0"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCommission}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;

