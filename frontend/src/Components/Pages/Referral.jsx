import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Copy, Share2, MessageCircle, Send, BadgeCheck, Wallet, History, Sparkles } from 'lucide-react';
import api from '../../api';

const Referral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [stats, setStats] = useState({ total_referrals: 0, successful: 0, pending: 0, total_earnings: 0, wallet_balance: 0 });
  const [history, setHistory] = useState([]);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, historyRes] = await Promise.all([
        api.get('/referrals/dashboard'),
        api.get('/referrals/history'),
      ]);
      setCode(dashboardRes.data?.my_code || '');
      setReferredBy(dashboardRes.data?.referred_by || '');
      setStats(dashboardRes.data?.stats || {});
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to load referral data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Referral code copied.');
    } catch (err) {
      toast.error('Unable to copy code.');
    }
  };

  const shareUrl = code ? `${window.location.origin}/register?ref=${code}` : '';

  const handleShare = (platform) => {
    const encoded = encodeURIComponent(shareUrl);
    const urls = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      sms: `sms:?body=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      telegram: `https://t.me/share/url?url=${encoded}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return toast.error('Enter a valid referral code.');
    try {
      setApplying(true);
      await api.post('/referrals/apply', { referral_code: inputCode.trim() });
      toast.success('Referral code applied.');
      setInputCode('');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to apply referral code.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f1] px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Referral Program</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Invite friends and earn wallet rewards</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">Share your unique code, help a friend register, and receive a reward once their first order is delivered.</p>
            </div>
            <button onClick={() => navigate('/account?tab=personal')} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back to Account</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100">
              <Sparkles size={16} /> Your referral code
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-2xl font-black tracking-[0.25em]">{loading ? '••••••' : code || 'Not generated yet'}</div>
              <button onClick={handleCopy} disabled={!code} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                <span className="flex items-center gap-2"><Copy size={16} /> Copy</span>
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => handleShare('whatsapp')} className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"><span className="flex items-center gap-2"><MessageCircle size={16} /> WhatsApp</span></button>
              <button onClick={() => handleShare('sms')} className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"><span className="flex items-center gap-2"><Send size={16} /> SMS</span></button>
              <button onClick={() => handleShare('facebook')} className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"><span className="flex items-center gap-2"><Share2 size={16} /> Facebook</span></button>
              <button onClick={() => handleShare('telegram')} className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"><span className="flex items-center gap-2"><Send size={16} /> Telegram</span></button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              <BadgeCheck size={16} /> Apply a referral code
            </div>
            <form onSubmit={handleApply} className="mt-4 space-y-3">
              <input value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Enter referral code" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-emerald-400" />
              <button type="submit" disabled={applying} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{applying ? 'Applying...' : 'Apply code'}</button>
            </form>
            {referredBy ? <p className="mt-3 text-sm text-slate-600">Applied through: <span className="font-semibold text-slate-900">{referredBy}</span></p> : <p className="mt-3 text-sm text-slate-500">You can also enter a code from someone who invited you.</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Referrals', value: stats.total_referrals || 0, icon: <History size={18} /> },
            { label: 'Successful', value: stats.successful || 0, icon: <BadgeCheck size={18} /> },
            { label: 'Pending', value: stats.pending || 0, icon: <Sparkles size={18} /> },
            { label: 'Wallet Balance', value: `₹${Number(stats.wallet_balance || 0).toFixed(2)}`, icon: <Wallet size={18} /> },
          ].map((card) => (
            <div key={card.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">{card.icon} {card.label}</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Referral history</h2>
              <p className="text-sm text-slate-500">Track who used your code and the reward status.</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{history.length} records</div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Referred User</th>
                  <th className="py-3 pr-4 font-semibold">Phone</th>
                  <th className="py-3 pr-4 font-semibold">Registered</th>
                  <th className="py-3 pr-4 font-semibold">Reward</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="5" className="py-6 text-center text-slate-500">No referral activity yet.</td></tr>
                ) : history.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-slate-800">{item.referee_name || item.referee_email || 'User'}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.referee_phone || '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.registered_at ? new Date(item.registered_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">₹{Number(item.reward_amount || 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'rewarded' ? 'bg-emerald-100 text-emerald-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
