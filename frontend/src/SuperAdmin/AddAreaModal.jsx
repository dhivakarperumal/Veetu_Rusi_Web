import React, { useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";

const AddAreaModal = ({ open, onClose, onSuccess }) => {
  const [areaName, setAreaName] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) return toast.error("Area name is required");
    if (!/^[0-9]{3,6}$/.test(pincode.trim())) return toast.error("Enter a valid pincode");
    try {
      setLoading(true);
      const payload = { name: areaName.trim(), pincode: pincode.trim() };
      // Attempt to post to /areas — adjust endpoint if your API differs
      const res = await api.post('/areas', payload);
      toast.success(res?.data?.message || 'Area added');
      setAreaName("");
      setPincode("");
      onSuccess && onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error('Add area error', err);
      toast.error(err?.response?.data?.message || 'Failed to add area');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-black mb-2">Add New Area</h2>
        <p className="text-sm text-slate-500 mb-4">Provide area name and pincode to register a new service area.</p>

        <label className="block mb-3">
          <span className="text-xs font-bold text-slate-600 uppercase">Area Name</span>
          <input
            value={areaName}
            onChange={e => setAreaName(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none text-sm text-slate-800 placeholder-slate-400"
            placeholder="e.g. Rajajinagar"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-bold text-slate-600 uppercase">Pincode</span>
          <input
            value={pincode}
            onChange={e => setPincode(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none text-sm text-slate-800 placeholder-slate-400"
            placeholder="e.g. 560001"
          />
        </label>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black">
            {loading ? 'Adding...' : 'Add Area'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAreaModal;
