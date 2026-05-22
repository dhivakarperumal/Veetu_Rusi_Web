import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Eye,
  Bike,
  List,
  LayoutGrid,
  CheckCircle,
  Clock,
} from "lucide-react";

const DeliveryPartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  // View Details Modal
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/delivery-partners");
      setPartners(res.data);
      setFilteredPartners(res.data);
    } catch (error) {
      toast.error("Failed to load delivery partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = partners;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.mobile?.includes(lower) ||
          p.vehicle_number?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }
    setFilteredPartners(result);
  }, [search, statusFilter, partners]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const target = partners.find((p) => p.id === id);
      if (!target) return;
      await api.put(`/superadmin/delivery-partners/${id}`, {
        ...target,
        status: newStatus,
      });
      toast.success(`Delivery partner status updated to ${newStatus}`);
      fetchPartners();
      if (selectedPartner?.id === id) {
        setSelectedPartner((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error("Failed to change delivery partner status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery partner?")) return;
    try {
      await api.delete(`/superadmin/delivery-partners/${id}`);
      toast.success("Delivery partner removed.");
      fetchPartners();
      if (selectedPartner?.id === id) {
        setSelectedPartner(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete partner.");
    }
  };

  const approvedCount = partners.filter((p) => p.status === "Approved").length;
  const pendingCount = partners.filter((p) => p.status === "Pending").length;
  const suspendedCount = partners.filter((p) =>
    ["Suspended", "Rejected"].includes(p.status)
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Partners */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#0f1628] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-700/40">
              <List className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-violet-300/70 font-black uppercase tracking-[0.2em]">
                Total Partners
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {partners.length}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                All registered delivery partners
              </p>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">
                Approved Partners
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {approvedCount}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                Active & verified partners
              </p>
            </div>
          </div>
        </div>

        {/* Pending & Suspended */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">
                Pending & Suspended
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {pendingCount + suspendedCount}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                Awaiting review or action
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, mobile or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-600 focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-emerald-700"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${
                viewMode === "card"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-emerald-700"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-200">
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center w-16">
                    S.No
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Partner Info
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Vehicle Details
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Total Deliveries
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Earnings
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((partner, index) => (
                  <tr
                    key={partner.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-4 text-center text-sm font-black text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{partner.name}</h4>
                          <p className="text-xs text-slate-400 font-medium">{partner.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {partner.vehicle_type} &bull; {partner.vehicle_number}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-slate-700">
                      {partner.total_deliveries || 0}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-emerald-600">
                      ₹{parseFloat(partner.earnings || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          partner.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : partner.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {partner.status !== "Approved" && (
                          <button
                            onClick={() => handleStatusChange(partner.id, "Approved")}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition"
                            title="Approve Partner"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {partner.status === "Approved" && (
                          <button
                            onClick={() => handleStatusChange(partner.id, "Suspended")}
                            className="p-1.5 hover:bg-amber-50 text-amber-500 hover:text-amber-700 rounded-lg transition"
                            title="Suspend Partner"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPartners.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-xs text-slate-400 italic"
                    >
                      No delivery partners match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800">{partner.name}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{partner.vehicle_type}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      partner.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : partner.status === "Pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {partner.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p>
                    <strong className="text-slate-600">Mobile:</strong> {partner.mobile}
                  </p>
                  <p>
                    <strong className="text-slate-600">Vehicle No:</strong>{" "}
                    {partner.vehicle_number}
                  </p>
                  <p>
                    <strong className="text-slate-600">Deliveries:</strong>{" "}
                    {partner.total_deliveries || 0}
                  </p>
                  <p>
                    <strong className="text-slate-600">Earnings:</strong>{" "}
                    <span className="text-emerald-600 font-black">
                      ₹{parseFloat(partner.earnings || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedPartner(partner);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:text-slate-800 transition text-center border border-slate-200"
                >
                  Details
                </button>
                {partner.status !== "Approved" && (
                  <button
                    onClick={() => handleStatusChange(partner.id, "Approved")}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition border border-emerald-200"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {partner.status === "Approved" && (
                  <button
                    onClick={() => handleStatusChange(partner.id, "Suspended")}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition border border-amber-200"
                    title="Suspend"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="p-2 bg-slate-50 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition border border-slate-200"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredPartners.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 italic py-8">
              No delivery partners match your criteria.
            </p>
          )}
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen &&
        selectedPartner &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] bg-white">
              {/* Modal Header */}
              <div className="p-8 text-white flex-shrink-0 flex justify-between items-center bg-emerald-800 rounded-t-[2.5rem] border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">
                    {selectedPartner.name}
                  </h3>
                  <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1">
                    Delivery Partner Overview
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-full text-white/70 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: "Mobile Number", value: selectedPartner.mobile },
                    { label: "Email", value: selectedPartner.email || "N/A" },
                    { label: "Vehicle Type", value: selectedPartner.vehicle_type },
                    { label: "Vehicle Number", value: selectedPartner.vehicle_number },
                    { label: "Driving License", value: selectedPartner.license_number || "N/A" },
                    { label: "Aadhaar Number", value: selectedPartner.aadhaar_number || "N/A" },
                    { label: "Total Deliveries", value: `${selectedPartner.total_deliveries || 0} completed` },
                    { label: "Total Earnings", value: `₹${parseFloat(selectedPartner.earnings || 0).toLocaleString()}` },
                    { label: "Status", value: selectedPartner.status },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {label}
                      </p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
                {selectedPartner.status !== "Approved" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedPartner.id, "Approved");
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                  >
                    Approve Partner
                  </button>
                )}
                {selectedPartner.status === "Pending" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedPartner.id, "Rejected");
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                  >
                    Reject Application
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DeliveryPartnerManagement;
