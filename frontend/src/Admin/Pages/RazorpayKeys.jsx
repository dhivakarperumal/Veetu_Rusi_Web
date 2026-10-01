import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Building2, CalendarDays, KeyRound, Pencil, Plus, Power, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import api from "../../api";

const usageOptions = ["User Checkout", "Delivery Partner", "Home Chef", "General"];
const emptyForm = { key_name: "", key_id: "", key_secret: "", business_name: "", key_usage: "", status: "Inactive" };

const maskKey = (value = "") => value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "-";

const RazorpayKeys = () => {
  const location = useLocation();
  const apiPath = location.pathname.startsWith("/superadmin") ? "/superadmin/razorpay-keys" : "/admin/razorpay-keys";
  const [keys, setKeys] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadKeys = async () => {
    try {
      const response = await api.get(apiPath);
      setKeys(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load Razorpay keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    api.get(apiPath)
      .then((response) => { if (mounted) setKeys(response.data || []); })
      .catch((error) => { if (mounted) toast.error(error.response?.data?.message || "Could not load Razorpay keys."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [apiPath]);

  const filteredKeys = keys.filter((key) =>
    [key.key_name, key.key_id, key.business_name].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditingKey(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (key) => {
    setEditingKey(key);
    setForm({ key_name: key.key_name, key_id: key.key_id, key_secret: "", business_name: key.business_name || "", key_usage: key.key_usage || "General", status: key.status });
    setModalOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingKey) await api.put(`${apiPath}/${editingKey.id}`, form);
      else await api.post(apiPath, form);
      toast.success(editingKey ? "Razorpay key updated." : "Razorpay key added.");
      setModalOpen(false);
      await loadKeys();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save this Razorpay key.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (key) => {
    const status = key.status === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`${apiPath}/${key.id}/status`, { status });
      toast.success(`Key ${status.toLowerCase()}.`);
      await loadKeys();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not change key status.");
    }
  };

  const deleteKey = async (key) => {
    if (!window.confirm(`Delete ${key.key_name}? Any users assigned to it will be unassigned.`)) return;
    try {
      await api.delete(`${apiPath}/${key.id}`);
      toast.success("Razorpay key deleted.");
      await loadKeys();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this Razorpay key.");
    }
  };

  const activeCount = keys.filter((key) => key.status === "Active").length;
  const assignedCount = keys.reduce((total, key) => total + Number(key.assigned_count || 0), 0);

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      <Toaster position="top-right" />
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-300">
            <KeyRound size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Payments / Configuration</span>
          </div>
          <h1 className="text-2xl font-black text-white">Razorpay Keys</h1>
          <p className="mt-1 text-sm text-slate-400">Manage payment accounts and user assignments.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400">
          <Plus size={17} /> Add Razorpay Key
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0c1915] p-4">
          <span className="rounded-md bg-emerald-400/10 p-2 text-emerald-300"><KeyRound size={19} /></span>
          <div><p className="text-xs text-slate-400">Configurations</p><p className="text-xl font-bold text-white">{keys.length}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0c1915] p-4">
          <span className="rounded-md bg-teal-400/10 p-2 text-teal-300"><ShieldCheck size={19} /></span>
          <div><p className="text-xs text-slate-400">Active keys</p><p className="text-xl font-bold text-white">{activeCount}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0c1915] p-4">
          <span className="rounded-md bg-sky-400/10 p-2 text-sky-300"><Users size={19} /></span>
          <div><p className="text-xs text-slate-400">User assignments</p><p className="text-xl font-bold text-white">{assignedCount}</p></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1512]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold text-white">Payment configurations</h2><p className="mt-1 text-xs text-slate-400">Secrets are encrypted and never displayed after saving.</p></div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search keys or business" className="w-full rounded-md border border-white/10 bg-[#07100d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-left">
            <thead className="bg-white/3 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-16 whitespace-nowrap px-4 py-3 font-bold">S.No</th>
                <th className="px-4 py-3 font-bold">Configuration</th>
                <th className="px-4 py-3 font-bold">Key ID</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Dates</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {filteredKeys.map((key, index) => (
                <tr key={key.id} className="align-top transition hover:bg-white/2.5">
                  <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-slate-400">{index + 1}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{key.key_name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Building2 size={13} />{[key.business_name, key.key_usage || "General"].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-slate-300">{maskKey(key.key_id)}</td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${key.status === "Active" ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-400"}`}>{key.status}</span></td>
                  <td className="px-4 py-4 text-xs text-slate-400"><p className="flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(key.created_at)}</p></td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleStatus(key)} title={key.status === "Active" ? "Deactivate key" : "Activate key"} aria-label={key.status === "Active" ? "Deactivate key" : "Activate key"} className="rounded-md p-2 text-slate-400 transition hover:bg-emerald-400/10 hover:text-emerald-300"><Power size={16} /></button>
                      <button onClick={() => openEdit(key)} title="Edit key" aria-label="Edit key" className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                      <button onClick={() => deleteKey(key)} title="Delete key" aria-label="Delete key" className="rounded-md p-2 text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredKeys.length === 0 && <tr><td colSpan="6" className="px-4 py-12 text-center text-sm text-slate-400">{search ? "No matching Razorpay configurations." : "No Razorpay keys have been added."}</td></tr>}
              {loading && <tr><td colSpan="6" className="px-4 py-12 text-center text-sm text-slate-400">Loading configurations...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && createPortal(
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
          <form onSubmit={submit} className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0b1512] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="razorpay-dialog-title">
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div><h2 id="razorpay-dialog-title" className="text-lg font-bold text-white">{editingKey ? "Edit Razorpay Key" : "Add Razorpay Key"}</h2><p className="mt-1 text-xs text-slate-400">Key Secret stays private to the backend.</p></div>
              <button type="button" onClick={() => setModalOpen(false)} title="Close" aria-label="Close" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Key Name *</span><input required maxLength={150} value={form.key_name} onChange={(event) => setForm({ ...form, key_name: event.target.value })} placeholder="e.g. Franchise Payments" className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Razorpay Key ID *</span><input required value={form.key_id} onChange={(event) => setForm({ ...form, key_id: event.target.value })} placeholder="rzp_live_..." className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-emerald-500/60" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Razorpay Key Secret {editingKey ? "(optional to keep unchanged)" : "*"}</span><input required={!editingKey} type="password" autoComplete="new-password" value={form.key_secret} onChange={(event) => setForm({ ...form, key_secret: event.target.value })} placeholder={editingKey ? "Leave blank to keep the existing secret" : "Enter secret"} className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Account / Business Name</span><input maxLength={255} value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} placeholder="Business or account name" className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Razorpay Usage *</span><select required value={form.key_usage} onChange={(event) => setForm({ ...form, key_usage: event.target.value })} className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60"><option value="" disabled>Select Razorpay Usage</option>{usageOptions.map((usage) => <option key={usage} value={usage}>{usage}</option>)}</select></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-300">Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-md border border-white/10 bg-[#06100c] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60"><option>Active</option><option>Inactive</option></select></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5">Cancel</button>
              <button disabled={saving} type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : editingKey ? "Save Changes" : "Add Key"}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RazorpayKeys;