import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api";
import { toast } from "react-hot-toast";

const AddAreaModal = ({ open, onClose, onSuccess, initialData }) => {
  const [areaName, setAreaName] = useState("");
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setAreaName(initialData.name || "");
      setPincode(initialData.pincode?.toString() || "");
      setStatus(initialData.status || "Active");
    } else {
      setAreaName("");
      setPincode("");
      setStatus("Active");
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) return toast.error("Area name is required");
    if (!/^[0-9]{3,6}$/.test(pincode.trim())) return toast.error("Enter a valid pincode");

    try {
      setLoading(true);
      const payload = { name: areaName.trim(), pincode: pincode.trim(), status };
      const res = isEdit
        ? await api.put(`/areas/${initialData.id}`, payload)
        : await api.post('/areas', payload);

      toast.success(res?.data?.message || (isEdit ? 'Area updated' : 'Area added'));
      setAreaName("");
      setPincode("");
      setStatus("Active");
      onSuccess && onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error('Area modal error', err, err?.response?.data);
      toast.error(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} area`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-slate-200/50 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">{isEdit ? 'Edit Area' : 'Add New Area'}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {isEdit
              ? 'Update area details and save changes.'
              : 'Provide area name and pincode to register a new service area.'}
          </p>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Area Name</span>
          <input
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="e.g. Rajajinagar"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <label className="block mb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pincode</span>
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="e.g. 560001"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (isEdit ? 'Saving...' : 'Adding...') : isEdit ? 'Save Changes' : 'Add Area'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAreaModal;
