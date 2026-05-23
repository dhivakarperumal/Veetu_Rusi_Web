import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { DollarSign, Search, Filter, Plus, CreditCard, Clock } from "lucide-react";

const PayoutManagement = () => {
  const [payouts, setPayouts] = useState([]);
  const [filteredPayouts, setFilteredPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPaidAmount = payouts.reduce(
    (sum, payout) => sum + (parseFloat(payout.paid_amount) || 0),
    0,
  );
  const totalPendingAmount = payouts.reduce(
    (sum, payout) => sum + (parseFloat(payout.pending_amount) || 0),
    0,
  );
  const totalEarningsAmount = payouts.reduce(
    (sum, payout) => sum + (parseFloat(payout.total_earnings) || 0),
    0,
  );

  // New Payout form state
  const [newPayout, setNewPayout] = useState({
    user_name: "",
    role: "Home Chef",
    total_earnings: "",
    pending_amount: "",
    paid_amount: "",
    transaction_id: "",
    payment_status: "Paid"
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/payouts");
      setPayouts(res.data);
      setFilteredPayouts(res.data);
    } catch (error) {
      toast.error("Failed to load payout histories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = payouts;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.user_name.toLowerCase().includes(lower) ||
          (p.transaction_id && p.transaction_id.toLowerCase().includes(lower))
      );
    }
    if (roleFilter !== "All") {
      result = result.filter((p) => p.role === roleFilter);
    }
    if (statusFilter !== "All") {
      result = result.filter((p) => p.payment_status === statusFilter);
    }
    setFilteredPayouts(result);
  }, [search, roleFilter, statusFilter, payouts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/superadmin/payouts", newPayout);
      toast.success("Payout transaction logged successfully.");
      setIsModalOpen(false);
      setNewPayout({
        user_name: "",
        role: "Home Chef",
        total_earnings: "",
        pending_amount: "",
        paid_amount: "",
        transaction_id: "",
        payment_status: "Paid"
      });
      fetchPayouts();
    } catch (error) {
      toast.error("Failed to submit payout.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Payouts & Earnings</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Track and dispatch payouts to restaurants, home chefs, delivery drivers, and franchises
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Payout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-[#0B1120]/80 border border-white/10 p-5 shadow-inner">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40 font-black">Total Payouts</p>
          <p className="mt-4 text-3xl font-black text-white">{payouts.length}</p>
          <p className="mt-2 text-xs text-white/40">Logged payout records</p>
        </div>
        <div className="rounded-3xl bg-[#0B1120]/80 border border-white/10 p-5 shadow-inner">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40 font-black">Total Paid</p>
          <p className="mt-4 text-3xl font-black text-emerald-300">₹{totalPaidAmount.toLocaleString()}</p>
          <p className="mt-2 text-xs text-white/40">Amount disbursed</p>
        </div>
        <div className="rounded-3xl bg-[#0B1120]/80 border border-white/10 p-5 shadow-inner">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40 font-black">Total Pending</p>
          <p className="mt-4 text-3xl font-black text-amber-300">₹{totalPendingAmount.toLocaleString()}</p>
          <p className="mt-2 text-xs text-white/40">Amount awaiting settlement</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by payee name or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 w-full bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Home Chef">Home Chef</option>
              <option value="Delivery Partner">Delivery Partner</option>
              <option value="Franchise">Franchise</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 w-full bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
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
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#070b13]/30 text-white/80">
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Payee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Earnings</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Paid Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Transaction ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white">{payout.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{payout.role}</td>
                    <td className="px-6 py-5 text-sm font-black text-white">₹{parseFloat(payout.total_earnings).toLocaleString()}</td>
                    <td className="px-6 py-5 text-sm font-black text-emerald-400">₹{parseFloat(payout.paid_amount).toLocaleString()}</td>
                    <td className="px-6 py-5 text-xs font-semibold text-white/40">{payout.transaction_id || "Cash Payment"}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          payout.payment_status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {payout.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPayouts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No logged payout records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleSubmit}
            className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Log Payout Transaction</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Disburse payee settlements</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Payee Name</label>
                <input
                  type="text"
                  required
                  value={newPayout.user_name}
                  onChange={(e) => setNewPayout({ ...newPayout, user_name: e.target.value })}
                  placeholder="e.g. Annapoorna Veg or Saraswathi"
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Payee Role</label>
                  <select
                    value={newPayout.role}
                    onChange={(e) => setNewPayout({ ...newPayout, role: e.target.value })}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 cursor-pointer"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Home Chef">Home Chef</option>
                    <option value="Delivery Partner">Delivery Partner</option>
                    <option value="Franchise">Franchise Owner</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={newPayout.transaction_id}
                    onChange={(e) => setNewPayout({ ...newPayout, transaction_id: e.target.value })}
                    placeholder="e.g. TXN98765432"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Total Earned (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPayout.total_earnings}
                    onChange={(e) => setNewPayout({ ...newPayout, total_earnings: e.target.value })}
                    placeholder="12000"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Paid (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPayout.paid_amount}
                    onChange={(e) => setNewPayout({ ...newPayout, paid_amount: e.target.value })}
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Pending (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPayout.pending_amount}
                    onChange={(e) => setNewPayout({ ...newPayout, pending_amount: e.target.value })}
                    placeholder="2000"
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
              >
                Log Transaction
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

export default PayoutManagement;
