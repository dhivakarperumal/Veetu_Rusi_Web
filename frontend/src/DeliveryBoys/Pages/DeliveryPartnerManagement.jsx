import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, Filter, Trash2, Check, X, ShieldAlert, Eye, Bike, MapPin } from "lucide-react";

const DeliveryPartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
          p.name.toLowerCase().includes(lower) ||
          p.mobile.includes(lower) ||
          p.vehicle_number.toLowerCase().includes(lower)
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
        status: newStatus
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
    } catch (error) {
      toast.error("Failed to delete partner.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Delivery Partner Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Approve onboarding applications, inspect license details and track total deliveries/earnings
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by partner name, mobile or vehicle number..."
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
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Partner Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Vehicle details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Deliveries</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Earnings</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{partner.name}</h4>
                          <p className="text-xs text-white/40 font-semibold">{partner.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">
                      {partner.vehicle_type} ({partner.vehicle_number})
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-white/80">{partner.total_deliveries || 0}</td>
                    <td className="px-6 py-5 text-sm font-black text-emerald-400">₹{parseFloat(partner.earnings || 0).toLocaleString()}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          partner.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : partner.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {partner.status !== "Approved" && (
                          <button
                            onClick={() => handleStatusChange(partner.id, "Approved")}
                            className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition"
                            title="Approve Partner"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {partner.status === "Approved" && (
                          <button
                            onClick={() => handleStatusChange(partner.id, "Suspended")}
                            className="p-2 hover:bg-amber-500/10 text-amber-400 rounded-xl transition"
                            title="Suspend Partner"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
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
                    <td colSpan="6" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No delivery partners match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">{selectedPartner.name}</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Delivery Partner Overview</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Mobile Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Vehicle Type</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.vehicle_type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Vehicle Plate Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Driving License</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.license_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Aadhaar ID Number</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.aadhaar_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Identity Status</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.status}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Approved By</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.approved_by_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Approved At</p>
                  <p className="text-sm font-black mt-0.5">{selectedPartner.approval_date ? new Date(selectedPartner.approval_date).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Total Deliveries</p>
                  <p className="text-sm font-black mt-0.5 text-emerald-400">{selectedPartner.total_deliveries || 0} completed</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase">Total Earnings</p>
                  <p className="text-sm font-black mt-0.5 text-emerald-400">₹{parseFloat(selectedPartner.earnings || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              {selectedPartner.status !== "Approved" && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedPartner.id, "Approved");
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                >
                  Approve Driver
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
                  Reject application
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

export default DeliveryPartnerManagement;
