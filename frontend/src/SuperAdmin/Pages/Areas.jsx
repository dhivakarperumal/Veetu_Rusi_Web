import React, { useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Areas = () => {
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Area name is required");
    if (!/^[0-9]{3,6}$/.test(pincode.trim())) return toast.error("Enter a valid pincode");
    try {
      setLoading(true);
      const res = await api.post('/areas', { name: name.trim(), pincode: pincode.trim() });
      toast.success(res?.data?.message || 'Area added');
      setName('');
      setPincode('');
      // Optionally navigate or refresh; stay on page
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to add area');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-black mb-4">Area & Pincode Management</h1>
        <p className="text-sm text-slate-500 mb-6">Add a new service area and its pincode.</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div>
            <label className="block text-sm font-bold text-slate-700">Area Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rajajinagar"
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Pincode</label>
            <input
              value={pincode}
              onChange={e => setPincode(e.target.value)}
              placeholder="e.g. 560001"
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black">{loading ? 'Adding...' : 'Add Area'}</button>
            <button type="button" onClick={() => { setName(''); setPincode(''); }} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Clear</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Areas;
