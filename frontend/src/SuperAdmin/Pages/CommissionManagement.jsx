import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Percent, Save, Edit2 } from "lucide-react";

const CommissionManagement = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/commissions");
      setCommissions(res.data);
    } catch (error) {
      toast.error("Failed to load commission settings.");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Commission Settings</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-2 max-w-2xl">
            Manage the platform commission rates for restaurants, home chefs and delivery partners. Keep the fee structure aligned with your operational policy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0B1120]/40 border border-white/5 rounded-4xl p-6 shadow-xl">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mb-3">Total Rules</p>
          <p className="text-4xl font-black text-white">{totalRules}</p>
        </div>
        <div className="bg-[#0B1120]/40 border border-white/5 rounded-4xl p-6 shadow-xl">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mb-3">Highest Rate</p>
          <p className="text-4xl font-black text-white">{highestRate}%</p>
        </div>
        <div className="bg-[#0B1120]/40 border border-white/5 rounded-4xl p-6 shadow-xl">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mb-3">Lowest Rate</p>
          <p className="text-4xl font-black text-white">{lowestRate}%</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-4xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-160">
              <thead>
                <tr className="bg-[#070b13]/70 border-b border-white/10">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Commission Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Current Rate</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {commissions.map((comm) => {
                  const isEditing = editingId === comm.id;
                  return (
                    <tr key={comm.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Percent className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{comm.type} Commission</p>
                            <p className="text-[11px] text-white/40 uppercase tracking-[0.2em]">{comm.type}</p>
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
                            className="bg-[#070b13] border border-white/10 rounded-2xl px-4 py-3 text-white font-black text-lg w-28 outline-none"
                          />
                        ) : (
                          <span className="text-3xl font-black text-white">{comm.commission_value}%</span>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-sm text-white/50 leading-6">
                        Fee collected from {comm.type.toLowerCase()} transactions when the order is completed.
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
                              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
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
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Rate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;
