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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Commission settings</h2>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
          Adjust global percentage fees collected on order checkouts from different partners
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commissions.map((comm) => {
            const isEditing = editingId === comm.id;
            return (
              <div
                key={comm.id}
                className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-6 rounded-[2.2rem] flex flex-col justify-between shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-xl">
                    <Percent className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    Fee Collected
                  </span>
                </div>
                <div>
                  <h4 className="text-md font-black text-white uppercase tracking-tight mb-2">
                    {comm.type} Commission
                  </h4>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-[#070b13] border border-white/10 rounded-xl px-4 py-2 text-white font-black text-xl w-32 outline-none"
                      />
                    ) : (
                      <span className="text-3xl font-black text-white">
                        {comm.commission_value}%
                      </span>
                    )}
                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                      per order checkout
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleUpdate(comm.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(comm.id);
                        setEditValue(comm.commission_value);
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-400" /> Edit rate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;
