import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { toast } from 'react-hot-toast';
import {
  Download, RefreshCw, ShieldCheck, Users, Wallet, Ticket, Clock3, Plus, X,
  Settings2, UtensilsCrossed, Bike, UserCheck, AlertTriangle, TrendingUp,
  Filter, Search, ChevronDown, CheckCircle2, XCircle, RotateCcw, Send,
  Copy, Share2, BarChart3, FileText, Star, Zap, List, LayoutGrid
} from 'lucide-react';
import api from '../../api';

/* ─── helpers ─────────────────────────────────────────────────── */
const genCode = (prefix) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let c = prefix;
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
};

const STATUS_MAP = {
  rewarded:  { label: 'Rewarded',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  pending:   { label: 'Pending',   cls: 'bg-amber-500/15  text-amber-400  border-amber-500/30' },
  verified:  { label: 'Verified',  cls: 'bg-sky-500/15    text-sky-400    border-sky-400/30' },
  rejected:  { label: 'Rejected',  cls: 'bg-rose-500/15   text-rose-400   border-rose-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-500/15  text-slate-400  border-slate-500/30' },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.pending;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
};

const TYPE_MAP = {
  customer:         { label: 'Customer',         color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  home_chef:        { label: 'Home Chef',         color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  delivery_partner: { label: 'Delivery Partner',  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
};
const TypeBadge = ({ type }) => {
  const t = TYPE_MAP[type] || TYPE_MAP.customer;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${t.color} ${t.bg} ${t.border}`}>{t.label}</span>;
};

const inputCls = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition';
const selectCls = 'w-full rounded-2xl border border-white/10 bg-[#08120f] px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition';

const TABS = [
  { id: 'overview',  label: 'Overview',          icon: BarChart3 },
  { id: 'customer',  label: 'Customer',          icon: Users },
  { id: 'chef',      label: 'Home Chef',         icon: UtensilsCrossed },
  { id: 'delivery',  label: 'Delivery Partner',  icon: Bike },
  { id: 'reports',   label: 'Reports',           icon: FileText },
];

/* ─── STATUS FLOW COMPONENT ───────────────────────────────────── */
const StatusFlow = () => {
  const steps = ['Invite Sent', 'Registered', 'Verification\nPending', 'Eligible', 'Reward\nApproved', 'Wallet\nCredited', 'Completed'];
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="mt-1 text-center text-[9px] font-semibold text-slate-400 whitespace-pre-line leading-tight">{step}</span>
          </div>
          {i < steps.length - 1 && <div className="h-px w-6 bg-emerald-500/30 flex-shrink-0 mb-3" />}
        </div>
      ))}
    </div>
  );
};

/* ─── MAIN COMPONENT ──────────────────────────────────────────── */
const ReferralManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [viewMode, setViewMode]   = useState('card');

  /* data */
  const [referrals, setReferrals] = useState([]);
  const [reports, setReports]     = useState({ stats: {}, wallet_balance: 0 });
  const [settings, setSettings]   = useState({
    is_enabled: true, referrer_reward_amount: 50, referee_reward_amount: 30,
    reward_type: 'wallet_credit', min_order_value: 200, first_order_only: true,
    reward_expiry_days: 30, max_referrals_per_user: 10,
    daily_referral_limit: 5, monthly_referral_limit: 20,
    chef_referrer_reward: 500, chef_referee_reward: 200,
    dp_referrer_reward: 500, dp_referee_reward: 200,
    dp_required_deliveries: 20,
    chef_referral_enabled: true, dp_referral_enabled: true,
  });

  /* filters */
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [settingsTab, setSettingsTab]   = useState('customer');

  /* modals */
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userOptions, setUserOptions]             = useState([]);
  const [loadingUsers, setLoadingUsers]           = useState(false);
  const [creatingCode, setCreatingCode]           = useState(false);
  const [createForm, setCreateForm]               = useState({ user_id: '', referral_code: '', type: 'customer', notes: '' });

  /* ── load ── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, reportsRes, referralsRes] = await Promise.all([
        api.get('/referrals/admin/settings'),
        api.get('/referrals/admin/reports'),
        api.get('/referrals/admin/list'),
      ]);
      setSettings(prev => ({ ...prev, ...(settingsRes.data || {}) }));
      setReports(reportsRes.data || {});
      setReferrals(Array.isArray(referralsRes.data) ? referralsRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load referrals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateSetting = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/referrals/admin/settings', settings);
      toast.success('Settings saved.');
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
      toast.error(err.response?.data?.message || 'Unable to update.');
    }
  };

  const exportCsv = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/referrals/admin/export?format=csv`, '_blank');
  };

  const loadUserOptions = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/admin/users');
      setUserOptions(res.data || []);
    } catch { toast.error('Unable to load users.'); }
    finally { setLoadingUsers(false); }
  };

  const openCreateModal = async () => {
    if (!userOptions.length) await loadUserOptions();
    setCreateForm({ user_id: '', referral_code: genCode('CUS'), type: 'customer', notes: '' });
    setShowCreateModal(true);
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    try {
      setCreatingCode(true);
      await api.post('/referrals/admin/create-code', createForm);
      toast.success('Referral code created.');
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create code.');
    } finally {
      setCreatingCode(false);
    }
  };

  /* ── derived stats ── */
  const stats = reports.stats || {};
  const totalReferrals  = Number(stats.total_referrals  || 0);
  const successful      = Number(stats.successful       || 0);
  const pending         = Number(stats.pending          || 0);
  const rejected        = Number(stats.rejected         || 0);
  const totalRewardPaid = Number(stats.total_rewards_paid || 0);
  const walletBal       = Number(reports.wallet_balance  || 0);
  const conversionRate  = totalReferrals ? ((successful / totalReferrals) * 100).toFixed(1) : '0.0';

  /* ── filter logic ── */
  const typeFilterMap = { overview: null, customer: 'customer', chef: 'home_chef', delivery: 'delivery_partner', reports: null };
  const typeFilter    = typeFilterMap[activeTab];

  const filtered = useMemo(() => referrals.filter(r => {
    const matchType   = !typeFilter || (r.referral_type || r.type || 'customer') === typeFilter;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      (r.referrer_name   || '').toLowerCase().includes(q) ||
      (r.referee_name    || '').toLowerCase().includes(q) ||
      (r.referral_code   || '').toLowerCase().includes(q) ||
      (r.referrer_email  || '').toLowerCase().includes(q) ||
      (r.referee_email   || '').toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  }), [referrals, typeFilter, filterStatus, search]);

  /* top referrers for reports tab */
  const topReferrers = useMemo(() => {
    const map = {};
    referrals.forEach(r => {
      const k = r.referrer_user_id;
      if (!k) return;
      if (!map[k]) map[k] = { name: r.referrer_name || r.referrer_email || k, count: 0, earned: 0 };
      map[k].count++;
      if (r.status === 'rewarded') map[k].earned += Number(r.reward_amount || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [referrals]);

  /* ── LEDGER VIEW (Table/Card + Pagination) ── */
  const LedgerView = ({ rows, emptyLabel, hidePagination = false }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // reset page if rows change
    useEffect(() => { setCurrentPage(1); }, [rows, viewMode]);

    const totalPages = Math.ceil(rows.length / itemsPerPage);
    const paginatedRows = hidePagination ? rows : rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div className="w-full">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">{emptyLabel || 'No referrals found.'}</div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-slate-400">
                      <th className="py-3 pr-4 font-semibold">Code</th>
                      <th className="py-3 pr-4 font-semibold">Referrer</th>
                      <th className="py-3 pr-4 font-semibold">Referee</th>
                      <th className="py-3 pr-4 font-semibold">Type</th>
                      <th className="py-3 pr-4 font-semibold">Reward</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">Date</th>
                      <th className="py-3 pr-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-0.5">{item.referral_code || '—'}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-slate-200 font-medium">{item.referrer_name || '—'}</div>
                          <div className="text-xs text-slate-500">{item.referrer_email || item.referrer_user_id || ''}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-slate-200 font-medium">{item.referee_name || '—'}</div>
                          <div className="text-xs text-slate-500">{item.referee_email || item.referee_user_id || ''}</div>
                        </td>
                        <td className="py-3 pr-4"><TypeBadge type={item.referral_type || item.type || 'customer'} /></td>
                        <td className="py-3 pr-4 font-semibold text-emerald-400">₹{Number(item.reward_amount || 0).toFixed(2)}</td>
                        <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                        <td className="py-3 pr-4 text-xs text-slate-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1.5">
                            {item.status !== 'rewarded' && (
                              <button onClick={() => changeStatus(item.id, 'approve')} title="Approve"
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1">
                                <CheckCircle2 size={11} /> Approve
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button onClick={() => changeStatus(item.id, 'reject')} title="Reject"
                                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1">
                                <XCircle size={11} /> Reject
                              </button>
                            )}
                            <button onClick={() => changeStatus(item.id, 'resend')} title="Resend"
                              className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 transition flex items-center gap-1">
                              <Send size={11} /> Resend
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {paginatedRows.map(item => (
                   <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0b1512] p-5 space-y-4 hover:border-emerald-500/30 transition">
                     <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-0.5">{item.referral_code || '—'}</span>
                        <StatusBadge status={item.status} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Referrer</div>
                         <div className="text-slate-200 font-semibold text-sm truncate" title={item.referrer_name || '—'}>{item.referrer_name || '—'}</div>
                         <div className="text-xs text-slate-400 truncate" title={item.referrer_email || item.referrer_user_id || ''}>{item.referrer_email || item.referrer_user_id || ''}</div>
                       </div>
                       <div>
                         <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Referee</div>
                         <div className="text-slate-200 font-semibold text-sm truncate" title={item.referee_name || '—'}>{item.referee_name || '—'}</div>
                         <div className="text-xs text-slate-400 truncate" title={item.referee_email || item.referee_user_id || ''}>{item.referee_email || item.referee_user_id || ''}</div>
                       </div>
                     </div>
                     <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <TypeBadge type={item.referral_type || item.type || 'customer'} />
                        <span className="font-black text-emerald-400">₹{Number(item.reward_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '—'}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                       {item.status !== 'rewarded' && (
                         <button onClick={() => changeStatus(item.id, 'approve')}
                           className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition flex justify-center items-center gap-1">
                           <CheckCircle2 size={13} /> Approve
                         </button>
                       )}
                       {item.status !== 'rejected' && (
                         <button onClick={() => changeStatus(item.id, 'reject')}
                           className="flex-1 rounded-xl border border-rose-500/20 bg-rose-500/10 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition flex justify-center items-center gap-1">
                           <XCircle size={13} /> Reject
                         </button>
                       )}
                     </div>
                   </div>
                 ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {!hidePagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
                <div className="text-xs font-semibold text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, rows.length)} of {rows.length} entries
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 transition text-xs font-bold">Prev</button>
                  {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
                    <Fragment key={p}>
                      {i > 0 && arr[i-1] !== p - 1 && <span className="px-2 text-slate-500 flex items-center">...</span>}
                      <button onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${currentPage === p ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                        {p}
                      </button>
                    </Fragment>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 transition text-xs font-bold">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  /* ── SECTION WRAPPER ── */
  const Section = ({ title, subtitle, action, children }) => (
    <div className="rounded-3xl border border-white/10 bg-[#08120f]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  /* ── FILTER BAR ── */
  const FilterBar = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
      <div className="relative w-full md:max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or code…"
          className="w-full rounded-2xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition" />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="w-full sm:w-auto rounded-2xl border border-white/10 bg-[#08120f] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rewarded">Rewarded</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex items-center rounded-2xl border border-white/10 bg-[#08120f] p-1 h-[42px]">
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-xl transition flex items-center justify-center ${viewMode === 'table' ? 'bg-white/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`} title="Table View">
            <List size={18} />
          </button>
          <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-xl transition flex items-center justify-center ${viewMode === 'card' ? 'bg-white/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`} title="Card View">
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ── STAT CARD ── */
  const StatCard = ({ label, value, icon, color = 'text-emerald-400', sub }) => (
    <div className="rounded-3xl border border-white/10 bg-[#0b1512] p-5">
      <div className={`flex items-center gap-2 text-sm font-semibold text-slate-400`}>
        <span className={color}>{icon}</span>{label}
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 text-slate-100">

      {/* ── PAGE HEADER ── */}
      <div className="rounded-3xl border border-white/10 bg-[#08120f]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-black text-white">Referral Management</h1>
            <p className="mt-2 text-sm text-slate-400">Manage Customer, Home Chef & Delivery Partner referrals, rewards, and fraud detection.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportCsv} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              <span className="flex items-center gap-2"><Download size={16} /> Export CSV</span>
            </button>
            <button onClick={loadData} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              <span className="flex items-center gap-2"><RefreshCw size={16} /> Refresh</span>
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              <span className="flex items-center gap-2"><Settings2 size={16} /> Program Settings</span>
            </button>
          </div>
        </div>

        {/* Status Flow */}
        <div className="mt-6 rounded-2xl bg-white/5 border border-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Referral Status Flow</p>
          <StatusFlow />
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold whitespace-nowrap transition ${
                active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}>
              <Icon size={15} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <StatCard label="Total Referrals"  value={totalReferrals}          icon={<Users size={16} />}        color="text-sky-400" />
            <StatCard label="Successful"        value={successful}              icon={<ShieldCheck size={16} />}  color="text-emerald-400" />
            <StatCard label="Pending"           value={pending}                 icon={<Clock3 size={16} />}       color="text-amber-400" />
            <StatCard label="Rejected"          value={rejected}                icon={<XCircle size={16} />}      color="text-rose-400" />
            <StatCard label="Rewards Paid (₹)"  value={`₹${totalRewardPaid}`}  icon={<Wallet size={16} />}       color="text-purple-400" />
            <StatCard label="Conversion Rate"   value={`${conversionRate}%`}    icon={<TrendingUp size={16} />}   color="text-emerald-400" sub="Referrals → Rewarded" />
          </div>

          {/* Type breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { type: 'customer',         label: 'Customer Referrals',         icon: <Users size={18} />,            rewardR: '₹50 wallet', rewardE: '₹30 coupon', min: '₹200 min order' },
              { type: 'home_chef',        label: 'Home Chef Referrals',        icon: <UtensilsCrossed size={18} />,  rewardR: '₹500 wallet', rewardE: '₹200 bonus', min: 'KYC + 1st order' },
              { type: 'delivery_partner', label: 'Delivery Partner Referrals', icon: <Bike size={18} />,             rewardR: '₹500 bonus',  rewardE: '₹200 bonus', min: '20 deliveries' },
            ].map(t => {
              const count = referrals.filter(r => (r.referral_type || r.type || 'customer') === t.type).length;
              const rewarded = referrals.filter(r => (r.referral_type || r.type || 'customer') === t.type && r.status === 'rewarded').length;
              const tm = TYPE_MAP[t.type];
              return (
                <div key={t.type} className={`rounded-3xl border ${tm.border} ${tm.bg} p-5`}>
                  <div className={`flex items-center gap-2 font-semibold text-sm ${tm.color}`}>{t.icon}{t.label}</div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="font-bold text-white">{count}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Rewarded</span><span className="font-bold text-emerald-400">{rewarded}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Referrer gets</span><span className="text-xs font-semibold text-slate-300">{t.rewardR}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Referee gets</span><span className="text-xs font-semibold text-slate-300">{t.rewardE}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Trigger</span><span className="text-xs font-semibold text-slate-300">{t.min}</span></div>
                  </div>
                  <button onClick={() => setActiveTab(t.type === 'customer' ? 'customer' : t.type === 'home_chef' ? 'chef' : 'delivery')}
                    className={`mt-4 w-full rounded-xl py-2 text-xs font-bold ${tm.color} ${tm.bg} border ${tm.border} hover:opacity-80 transition`}>
                    View {t.label} →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recent referrals */}
          <Section title="Recent Referrals" subtitle="Latest 10 across all types"
            action={
              <button onClick={openCreateModal} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                <Plus size={15} /> Add New
              </button>
            }>
            <FilterBar />
            <LedgerView rows={filtered.slice(0, 10)} hidePagination={true} />
          </Section>
        </div>
      )}

      {/* ══ CUSTOMER / CHEF / DELIVERY TABS ══ */}
      {['customer', 'chef', 'delivery'].includes(activeTab) && (
        <div className="space-y-6">
          {/* Type-specific info banner */}
          {activeTab === 'customer' && (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex flex-wrap gap-6 text-sm">
              <span className="text-sky-400 font-semibold flex items-center gap-1.5"><Users size={14} />Customer Referral</span>
              <span className="text-slate-300">Referrer: <strong className="text-white">₹50 Wallet Credit</strong></span>
              <span className="text-slate-300">Referee: <strong className="text-white">₹30 Welcome Coupon</strong></span>
              <span className="text-slate-300">Min Order: <strong className="text-white">₹200</strong></span>
              <span className="text-slate-300">Trigger: <strong className="text-white">First successful paid order</strong></span>
            </div>
          )}
          {activeTab === 'chef' && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 flex flex-wrap gap-6 text-sm">
              <span className="text-orange-400 font-semibold flex items-center gap-1.5"><UtensilsCrossed size={14} />Home Chef Referral</span>
              <span className="text-slate-300">Referrer: <strong className="text-white">₹500 Wallet Credit</strong></span>
              <span className="text-slate-300">Referee: <strong className="text-white">₹200 Joining Bonus</strong></span>
              <span className="text-slate-300">Trigger: <strong className="text-white">KYC + Approval + 1 Food Item + 1st Order</strong></span>
            </div>
          )}
          {activeTab === 'delivery' && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-wrap gap-6 text-sm">
              <span className="text-purple-400 font-semibold flex items-center gap-1.5"><Bike size={14} />Delivery Partner Referral</span>
              <span className="text-slate-300">Referrer: <strong className="text-white">₹500 Bonus</strong></span>
              <span className="text-slate-300">Referee: <strong className="text-white">₹200 Joining Bonus</strong></span>
              <span className="text-slate-300">Trigger: <strong className="text-white">KYC + Vehicle Verified + 20 Deliveries</strong></span>
            </div>
          )}

          <Section
            title={activeTab === 'customer' ? 'Customer Referral Ledger' : activeTab === 'chef' ? 'Home Chef Referral Ledger' : 'Delivery Partner Referral Ledger'}
            subtitle="Manage, approve, reject, and track referrals"
            action={
              <button onClick={openCreateModal} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                <Plus size={15} /> Add New
              </button>
            }>
            <FilterBar />
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading referrals…</div>
            ) : (
              <LedgerView rows={filtered} />
            )}
            <div className="mt-4 text-xs font-semibold text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</div>
          </Section>

          {/* Fraud detection notice */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2"><AlertTriangle size={15} /> Fraud Prevention Active</div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span>✓ Self-referral blocked</span>
              <span>✓ Duplicate email/mobile blocked</span>
              <span>✓ One code per account</span>
              <span>✓ Reward reversed on refund</span>
              <span>✓ Daily & monthly limits enforced</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTS TAB ══ */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Referrals"  value={totalReferrals}  icon={<Users size={16} />}       color="text-sky-400" />
            <StatCard label="Rewards Credited" value={`₹${totalRewardPaid}`} icon={<Wallet size={16} />} color="text-emerald-400" />
            <StatCard label="Pending Rewards"  value={pending}         icon={<Clock3 size={16} />}      color="text-amber-400" />
            <StatCard label="Conversion Rate"  value={`${conversionRate}%`} icon={<TrendingUp size={16} />} color="text-purple-400" />
          </div>

          {/* Top referrers */}
          <Section title="Top Referrers" subtitle="Users with the most successful referrals">
            {topReferrers.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No referral data yet.</p>
            ) : (
              <div className="space-y-3">
                {topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>#{i + 1}</span>
                      <span className="text-sm font-semibold text-white">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-slate-400">{r.count} referrals</span>
                      <span className="font-semibold text-emerald-400">₹{r.earned.toFixed(2)} earned</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* By type breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { type: 'customer',         label: 'Customer',         icon: <Users size={16} /> },
              { type: 'home_chef',        label: 'Home Chef',        icon: <UtensilsCrossed size={16} /> },
              { type: 'delivery_partner', label: 'Delivery Partner', icon: <Bike size={16} /> },
            ].map(t => {
              const rows = referrals.filter(r => (r.referral_type || r.type || 'customer') === t.type);
              const rew = rows.filter(r => r.status === 'rewarded').length;
              const pend = rows.filter(r => r.status === 'pending').length;
              const rej = rows.filter(r => r.status === 'rejected').length;
              const tm = TYPE_MAP[t.type];
              return (
                <div key={t.type} className={`rounded-3xl border ${tm.border} ${tm.bg} p-5`}>
                  <div className={`flex items-center gap-2 font-semibold text-sm ${tm.color} mb-4`}>{t.icon}{t.label}</div>
                  <div className="space-y-2 text-sm">
                    {[['Total', rows.length, 'text-white'], ['Rewarded', rew, 'text-emerald-400'], ['Pending', pend, 'text-amber-400'], ['Rejected', rej, 'text-rose-400']].map(([l, v, c]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-slate-400">{l}</span>
                        <span className={`font-bold ${c}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All referrals export */}
          <Section title="All Referrals" subtitle="Full referral ledger across all types"
            action={
              <button onClick={exportCsv} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10 transition">
                <Download size={15} /> Export CSV
              </button>
            }>
            <FilterBar />
            <LedgerView rows={filtered} />
          </Section>
        </div>
      )}

      {/* ══ CREATE CODE MODAL ══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#08120f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Create Referral Code</h3>
                <p className="mt-1 text-sm text-slate-400">Assign a referral code to any user from the admin panel.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Referral Type</span>
                <select value={createForm.type} onChange={e => {
                  const prefix = e.target.value === 'home_chef' ? 'HC' : e.target.value === 'delivery_partner' ? 'DP' : 'CUS';
                  setCreateForm(p => ({ ...p, type: e.target.value, referral_code: genCode(prefix) }));
                }} className={selectCls}>
                  <option value="customer">Customer</option>
                  <option value="home_chef">Home Chef</option>
                  <option value="delivery_partner">Delivery Partner</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">User</span>
                <select required value={createForm.user_id} onChange={e => setCreateForm(p => ({ ...p, user_id: e.target.value }))} disabled={loadingUsers} className={selectCls}>
                  <option value="">{loadingUsers ? 'Loading users…' : 'Select a user'}</option>
                  {userOptions.map(u => {
                    const val = u.user_id || u.id;
                    const lbl = u.name || u.email || val;
                    return <option key={val} value={val}>{lbl}{u.email ? ` (${u.email})` : ''}</option>;
                  })}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Referral Code</span>
                <div className="flex gap-2">
                  <input required type="text" value={createForm.referral_code}
                    onChange={e => setCreateForm(p => ({ ...p, referral_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CUSA1234" className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => {
                    const prefix = createForm.type === 'home_chef' ? 'HC' : createForm.type === 'delivery_partner' ? 'DP' : 'CUS';
                    setCreateForm(p => ({ ...p, referral_code: genCode(prefix) }));
                  }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10 transition">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </label>
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Notes (optional)</span>
                <textarea rows="2" value={createForm.notes} onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Admin notes…" className={inputCls} />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Cancel</button>
                <button type="submit" disabled={creatingCode} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                  {creatingCode ? 'Creating…' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ PROGRAM SETTINGS MODAL ══ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}>
          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-[#08120f] border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] p-8 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Program Settings</h2>
                <p className="text-sm text-slate-400 mt-1">Configure all referral types from one place.</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 transition"><X size={16} /></button>
            </div>

            {/* Settings sub-tabs */}
            <div className="flex gap-2">
              {[['customer', 'Customer', Users], ['chef', 'Home Chef', UtensilsCrossed], ['dp', 'Delivery', Bike]].map(([id, lbl, Icon]) => (
                <button key={id} onClick={() => setSettingsTab(id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${settingsTab === id ? 'bg-emerald-600 text-white' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                  <Icon size={12} />{lbl}
                </button>
              ))}
            </div>

            {/* ─ Customer settings ─ */}
            {settingsTab === 'customer' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 cursor-pointer">
                  <span>Enable Customer Referral</span>
                  <input type="checkbox" checked={Boolean(settings.is_enabled)} onChange={e => updateSetting('is_enabled', e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Referrer Reward (₹)', 'referrer_reward_amount', 50],
                    ['Referee Reward (₹)',  'referee_reward_amount',  30],
                    ['Min Order Value (₹)', 'min_order_value',        200],
                    ['Reward Expiry Days',  'reward_expiry_days',     30],
                    ['Max Referrals/User',  'max_referrals_per_user', 10],
                    ['Daily Limit',         'daily_referral_limit',   5],
                    ['Monthly Limit',       'monthly_referral_limit', 20],
                  ].map(([lbl, key]) => (
                    <label key={key} className="text-sm text-slate-300">
                      <span className="mb-2 block">{lbl}</span>
                      <input type="number" value={settings[key] || 0} onChange={e => updateSetting(key, Number(e.target.value))} className={inputCls} />
                    </label>
                  ))}
                  <label className="text-sm text-slate-300">
                    <span className="mb-2 block">Reward Type</span>
                    <select value={settings.reward_type || 'wallet_credit'} onChange={e => updateSetting('reward_type', e.target.value)} className={selectCls}>
                      <option value="wallet_credit">Wallet Credit</option>
                      <option value="coupon">Coupon</option>
                      <option value="discount">Discount</option>
                      <option value="cashback">Cashback</option>
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={Boolean(settings.first_order_only)} onChange={e => updateSetting('first_order_only', e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                  <span>Reward only on first completed order</span>
                </label>
              </div>
            )}

            {/* ─ Chef settings ─ */}
            {settingsTab === 'chef' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 cursor-pointer">
                  <span>Enable Home Chef Referral</span>
                  <input type="checkbox" checked={Boolean(settings.chef_referral_enabled)} onChange={e => updateSetting('chef_referral_enabled', e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Referrer Reward (₹)', 'chef_referrer_reward', 500],
                    ['Referee Joining Bonus (₹)', 'chef_referee_reward', 200],
                  ].map(([lbl, key]) => (
                    <label key={key} className="text-sm text-slate-300">
                      <span className="mb-2 block">{lbl}</span>
                      <input type="number" value={settings[key] || 0} onChange={e => updateSetting(key, Number(e.target.value))} className={inputCls} />
                    </label>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200 mb-2">Verification Requirements</p>
                  <p>✓ New Home Chef completes KYC</p>
                  <p>✓ Admin approves the account</p>
                  <p>✓ Chef publishes at least 1 food item</p>
                  <p>✓ Chef receives the first successful order</p>
                </div>
              </div>
            )}

            {/* ─ Delivery settings ─ */}
            {settingsTab === 'dp' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 cursor-pointer">
                  <span>Enable Delivery Partner Referral</span>
                  <input type="checkbox" checked={Boolean(settings.dp_referral_enabled)} onChange={e => updateSetting('dp_referral_enabled', e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Referrer Reward (₹)',        'dp_referrer_reward',       500],
                    ['Referee Joining Bonus (₹)',  'dp_referee_reward',        200],
                    ['Required Deliveries',        'dp_required_deliveries',   20],
                  ].map(([lbl, key]) => (
                    <label key={key} className="text-sm text-slate-300">
                      <span className="mb-2 block">{lbl}</span>
                      <input type="number" value={settings[key] || 0} onChange={e => updateSetting(key, Number(e.target.value))} className={inputCls} />
                    </label>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200 mb-2">Verification Requirements</p>
                  <p>✓ New Delivery Partner completes registration</p>
                  <p>✓ KYC is approved</p>
                  <p>✓ Vehicle verification completed</p>
                  <p>✓ Completes {settings.dp_required_deliveries || 20} successful deliveries</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-white/10">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Cancel</button>
              <button onClick={async () => { await saveSettings(); setShowSettingsModal(false); }} disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReferralManagement;
