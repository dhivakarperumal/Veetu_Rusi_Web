import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Download, RefreshCw, ShieldCheck, Users, Wallet, Ticket, Clock3, Plus, X } from 'lucide-react';
import api from '../../api';

const generateReferralCode = () => {
  const prefix = 'USER';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const statusBadge = (status) => {
  const base = 'rounded-full px-3 py-1 text-xs font-semibold';
  if (status === 'rewarded') return `${base} bg-emerald-100 text-emerald-700`;
  if (status === 'pending') return `${base} bg-amber-100 text-amber-700`;
  if (status === 'rejected') return `${base} bg-rose-100 text-rose-700`;
  if (status === 'cancelled') return `${base} bg-slate-100 text-slate-700`;
  return `${base} bg-sky-100 text-sky-700`;
};

const ReferralManagement = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    is_enabled: true,
    referrer_reward_amount: 50,
    referee_reward_amount: 50,
    reward_type: 'wallet_credit',
    min_order_value: 0,
    first_order_only: true,
    reward_expiry_days: 30,
    max_referrals_per_user: 10,
    daily_referral_limit: 5,
    monthly_referral_limit: 20,
  });
  const [reports, setReports] = useState({ stats: {}, wallet_balance: 0 });
  const [referrals, setReferrals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: '', referral_code: '', notes: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, reportsRes, referralsRes] = await Promise.all([
        api.get('/referrals/admin/settings'),
        api.get('/referrals/admin/reports'),
        api.get('/referrals/admin/list'),
      ]);
      setSettings(settingsRes.data || {});
      setReports(reportsRes.data || {});
      setReferrals(referralsRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load referrals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateSetting = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/referrals/admin/settings', settings);
      toast.success('Referral settings updated.');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, action) => {
    try {
      await api.put(`/referrals/admin/${id}/status`, { status: action });
      toast.success(`Referral ${action}d.`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update referral.');
    }
  };

  const exportCsv = async () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/referrals/admin/export?format=csv`, '_blank');
  };

  const loadUserOptions = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/admin/users');
      setUserOptions(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const openCreateModal = async () => {
    if (!userOptions.length) {
      await loadUserOptions();
    }
    setCreateForm({ user_id: '', referral_code: generateReferralCode(), notes: '' });
    setShowCreateModal(true);
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    try {
      setCreatingCode(true);
      await api.post('/referrals/admin/create-code', {
        user_id: createForm.user_id,
        referral_code: createForm.referral_code,
        notes: createForm.notes,
      });
      toast.success('Referral code created.');
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create referral code.');
    } finally {
      setCreatingCode(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="rounded-4xl border border-white/10 bg-[#08120f]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Referral Management</p>
            <h1 className="mt-2 text-3xl font-black text-white">Track referrals, payouts, and campaign settings</h1>
            <p className="mt-2 text-sm text-slate-400">Manage rewards, approve pending referrals, and export the referral ledger.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportCsv} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"><span className="flex items-center gap-2"><Download size={16} /> Export CSV</span></button>
            <button onClick={loadData} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"><span className="flex items-center gap-2"><RefreshCw size={16} /> Refresh</span></button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Total Referral Users', value: reports.stats?.total_referrals || 0, icon: <Users size={18} /> },
          { label: 'Successful', value: reports.stats?.successful || 0, icon: <ShieldCheck size={18} /> },
          { label: 'Pending', value: reports.stats?.pending || 0, icon: <Clock3 size={18} /> },
          { label: 'Rewards Paid', value: reports.stats?.total_rewards_paid || 0, icon: <Wallet size={18} /> },
          { label: 'Wallet Balance', value: `₹${Number(reports.wallet_balance || 0).toFixed(2)}`, icon: <Ticket size={18} /> },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-white/10 bg-[#0b1512] p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">{card.icon} {card.label}</div>
            <div className="mt-3 text-2xl font-black text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6">
        <div className="rounded-4xl border border-white/10 bg-[#08120f]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Referral ledger</h2>
              <p className="text-sm text-slate-400">Approve, reject, cancel, or resend referrals.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} /> Add New
            </button>
          </div>
          <div className="mt-6 overflow-x-auto w-full">
            <table className="w-full min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="py-3 pr-4 font-semibold">Referrer</th>
                  <th className="py-3 pr-4 font-semibold">Referee</th>
                  <th className="py-3 pr-4 font-semibold">Reward</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="py-6 text-center text-slate-500">Loading referrals...</td></tr> : referrals.map((item) => (
                  <tr key={item.id} className="border-b border-white/10">
                    <td className="py-3 pr-4 text-slate-200">{item.referrer_name || item.referrer_email || item.referrer_user_id}</td>
                    <td className="py-3 pr-4 text-slate-200">{item.referee_name || item.referee_email || item.referee_user_id}</td>
                    <td className="py-3 pr-4 text-slate-200">₹{Number(item.reward_amount || 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">{statusBadge(item.status)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => changeStatus(item.id, 'approve')} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Approve</button>
                        <button onClick={() => changeStatus(item.id, 'reject')} className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">Reject</button>
                        <button onClick={() => changeStatus(item.id, 'cancel')} className="rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-300">Cancel</button>
                        <button onClick={() => changeStatus(item.id, 'resend')} className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">Resend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-4xl border border-white/10 bg-[#08120f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Create referral code</h3>
                <p className="mt-1 text-sm text-slate-400">Assign a new referral code to a user from the admin panel.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="mt-6 space-y-4">
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">User</span>
                <select
                  required
                  value={createForm.user_id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  disabled={loadingUsers}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-black outline-none"
                >
                  <option value="">{loadingUsers ? 'Loading users...' : 'Select a user'}</option>
                  {userOptions.map((user) => {
                    const userValue = user.user_id || user.id;
                    const label = user.name || user.email || user.user_id || user.id;
                    return (
                      <option key={userValue} value={userValue}>
                        {label} {user.email ? `(${user.email})` : ''}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Referral code</span>
                <input
                  required
                  type="text"
                  value={createForm.referral_code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, referral_code: e.target.value }))}
                  placeholder="e.g. USER1234"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Notes</span>
                <textarea
                  rows="3"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional admin notes"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={creatingCode} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{creatingCode ? 'Creating...' : 'Create code'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralManagement;
