import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { CreditCard, DollarSign, Landmark, Clock, TrendingUp, ShieldCheck } from "lucide-react";

const SuperAdminWalletAndEarnings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [franchises, setFranchises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const fetchFranchises = async () => {
    try {
      const res = await api.get('/superadmin/franchises');
      setFranchises(res.data || []);
    } catch (err) { console.error('Failed to load franchises', err); }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/dashboard-stats");
      const cards = res.data?.cards || {};
      // attach date fields into cards for easy use in UI
      const merged = {
        ...cards,
        lastSubscriptionDate: res.data?.lastSubscriptionDate || cards.lastSubscriptionDate || null,
        lastPaymentDate: res.data?.lastPaymentDate || cards.lastPaymentDate || null,
        nextSubscriptionDue: res.data?.nextSubscriptionDue || cards.nextSubscriptionDue || null
      };
      setStats(merged);
    } catch (error) {
      console.error("Failed to load SuperAdmin earnings stats", error);
      toast.error("Unable to load superadmin earnings data.");
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStats();
      fetchFranchises();
    })();
  }, []);

  const openSubModal = async (franchise) => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data || []);
      setSelectedPlan(res.data && res.data[0] ? res.data[0] : null);
      setPurchaseTarget(franchise);
    } catch { toast.error('Failed to load plans'); }
  };

  const startSubCheckout = async () => {
    if (!selectedPlan || !purchaseTarget) return toast.error('Select a plan');
    try {
      const res = await api.post('/subscriptions/checkout', { franchiseId: purchaseTarget.id, planId: selectedPlan.id });
      const { order, plan, key_id } = res.data;

      if (order && key_id) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        script.onload = () => {
          const options = {
            key: key_id,
            amount: order.amount,
            currency: order.currency || plan.currency,
            name: purchaseTarget.franchise_name,
            description: plan.name,
            ...(order.id && !order.id.startsWith('TEST_') ? { order_id: order.id } : {}),
            handler: async function (response) {
              try {
                await api.post('/subscriptions/confirm', {
                  franchiseId: purchaseTarget.id,
                  planId: plan.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                toast.success('Subscription activated!');
                setPurchaseTarget(null);
                fetchStats();
                fetchFranchises();
              } catch { toast.error('Payment verification failed'); }
            },
            modal: { ondismiss: function () { toast('Payment cancelled'); } }
          };
          const rz = new window.Razorpay(options);
          rz.open();
        };
      } else {
        await api.post('/subscriptions/confirm', { franchiseId: purchaseTarget.id, planId: selectedPlan.id, razorpay_payment_id: 'TEST', razorpay_order_id: order.id });
        toast.success('Subscription activated (test)!');
        setPurchaseTarget(null);
        fetchStats();
        fetchFranchises();
      }
    } catch (err) { toast.error(err?.response?.data?.message || 'Checkout failed'); }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return String(d).slice(0,10);
      return date.toLocaleDateString();
    } catch { return String(d).slice(0,10); }
  };

  const loadingCards = [
    {
      label: "Loading",
      value: "",
      icon: DollarSign,
      accent: "from-slate-900 to-slate-950",
      description: ""
    },
    {
      label: "Loading",
      value: "",
      icon: Landmark,
      accent: "from-emerald-500 to-emerald-600",
      description: ""
    },
    {
      label: "Loading",
      value: "",
      icon: CreditCard,
      accent: "from-blue-600 to-sky-700",
      description: ""
    },
    {
      label: "Loading",
      value: "",
      icon: Clock,
      accent: "from-amber-500 to-orange-500",
      description: ""
    }
  ];
  const cards = stats || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Wallet & Earnings</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl font-medium">
              SuperAdmin earnings dashboard with subscription and franchise metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
        {(loading ? loadingCards : [
          {
            label: "Total Revenue",
            value: `₹${Number(cards.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            accent: "from-slate-900 to-slate-950",
            description: "Delivered order revenue"
          },
          {
            label: "Active Franchises",
            value: cards.activeFranchises ?? 0,
            icon: Landmark,
            accent: "from-emerald-500 to-emerald-600",
            description: "Active franchise subscriptions"
          },
          {
            label: "Total Franchises",
            value: cards.totalFranchises ?? 0,
            icon: CreditCard,
            accent: "from-blue-600 to-sky-700",
            description: "Registered franchise owners"
          },
          {
            label: "Expiring Soon",
            value: cards.expiringSoonFranchises ?? 0,
            icon: Clock,
            accent: "from-amber-500 to-orange-500",
            description: "Subscriptions expiring within 7 days"
          }
        ]).map((card, idx) => (
          <div 
            key={idx} 
            className={`group rounded-3xl border border-slate-200/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] p-6 bg-gradient-to-br ${card.accent || 'from-slate-900 to-slate-950'} text-white transition-all duration-300 hover:translate-y-[-4px]`}
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60 group-hover:text-white/80 transition-colors">{card.label}</p>
                <p className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-none">
                  {loading ? <span className="h-12 w-32 rounded-2xl bg-white/10 animate-pulse block" /> : card.value}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg group-hover:bg-white/25 transition-all duration-300 backdrop-blur-sm">
                <card.icon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent mb-4"></div>
            <p className="text-sm text-white/70 group-hover:text-white/80 transition-colors font-medium">
              {loading ? <span className="h-4 w-40 rounded-lg bg-white/10 animate-pulse block" /> : card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] animate-in fade-in duration-1000">
        {/* Subscription Details Section */}
        <section className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 backdrop-blur-sm p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-white tracking-tight">Subscription Details</h2>
              <p className="text-sm text-slate-300 mt-2 font-medium">SuperAdmin summary of franchise subscription health and upcoming renewals.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-500/20 to-emerald-500/20 px-5 py-3 text-sm font-bold text-teal-300 border border-teal-500/40 shadow-sm whitespace-nowrap backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.5} /> Live
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { label: "Active subscriptions", value: cards.activeFranchises ?? 0, desc: "Franchise owners with current active plans.", color: "from-emerald-500/10 to-green-500/5 border-emerald-500/30" },
              { label: "Expired subscriptions", value: cards.expiredFranchises ?? 0, desc: "Franchise owners whose subscription period ended.", color: "from-red-500/10 to-pink-500/5 border-red-500/30" },
              { label: "Expiring soon", value: cards.expiringSoonFranchises ?? 0, desc: "Renewal alerts for the next 7 days.", color: "from-amber-500/10 to-orange-500/5 border-amber-500/30" },
              { label: "Total franchises", value: cards.totalFranchises ?? 0, desc: "All franchise owners registered in the system.", color: "from-blue-500/10 to-sky-500/5 border-blue-500/30" }
            ].map((item, idx) => (
              <article key={idx} className={`group rounded-2xl border bg-gradient-to-br ${item.color} p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300 hover:translate-y-[-2px]`}>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-300 transition-colors">{item.label}</p>
                <p className="mt-4 text-4xl font-black text-white tracking-tight">
                  {loading ? <span className="h-10 w-20 rounded-lg bg-slate-700/50 animate-pulse block" /> : item.value}
                </p>
                <p className="mt-3 text-sm text-slate-300 font-medium group-hover:text-slate-200 transition-colors">{item.desc}</p>
              </article>
            ))}
          </div>
          {/* Dates Row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-gradient-to-br from-white/5 to-white/2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Last Subscription</p>
              <p className="mt-2 text-sm text-white font-black">{loading ? <span className="h-6 w-28 bg-slate-700/40 rounded animate-pulse inline-block" /> : formatDate(cards.lastSubscriptionDate)}</p>
              <p className="text-xs text-slate-300 mt-1">Most recent plan activation date</p>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-white/5 to-white/2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Last Payment</p>
              <p className="mt-2 text-sm text-white font-black">{loading ? <span className="h-6 w-28 bg-slate-700/40 rounded animate-pulse inline-block" /> : formatDate(cards.lastPaymentDate)}</p>
              <p className="text-xs text-slate-300 mt-1">Most recent payment received</p>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-white/5 to-white/2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Next Subscription Due</p>
              <p className="mt-2 text-sm text-white font-black">{loading ? <span className="h-6 w-28 bg-slate-700/40 rounded animate-pulse inline-block" /> : formatDate(cards.nextSubscriptionDue)}</p>
              <p className="text-xs text-slate-300 mt-1">Nearest upcoming expiry date</p>
            </div>
          </div>
          {/* Franchises Table */}
          <div className="mt-8 bg-gradient-to-br from-slate-900/60 to-slate-950 rounded-2xl border border-slate-700/40 p-4">
            <h4 className="text-white font-bold mb-4">Franchises & Subscriptions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-300 uppercase tracking-widest">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Franchise</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Start Date</th>
                    <th className="px-3 py-2">Expiry Date</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-400">
                  {franchises.map((f, idx) => (
                    <tr key={f.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                      <td className="px-3 py-3">{idx + 1}</td>
                      <td className="px-3 py-3 font-bold text-white">{f.franchise_name}</td>
                      <td className="px-3 py-3">{f.owner_name}</td>
                      <td className="px-3 py-3">{f.email}</td>
                      <td className="px-3 py-3">{f.start_date ? new Date(f.start_date).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-3">{f.expiry_date ? new Date(f.expiry_date).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => openSubModal(f)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black">Add / Renew</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Subscription Modal */}
          {purchaseTarget && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg">Buy Subscription — {purchaseTarget.franchise_name}</h3>
                    <p className="text-sm text-slate-600">Select a plan to activate for this franchise owner.</p>
                  </div>
                  <button onClick={() => setPurchaseTarget(null)} className="text-slate-500">✕</button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map(p => {
                      const isSel = selectedPlan && selectedPlan.id === p.id;
                      return (
                        <label key={p.id} className={`p-4 border rounded-xl cursor-pointer ${isSel ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'}`}>
                          <input type="radio" name="subplan" className="hidden" checked={isSel} onChange={() => setSelectedPlan(p)} />
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold">{p.name}</h4>
                              <p className="text-sm text-slate-500">₹{p.amount} • {p.durationDays} days</p>
                            </div>
                            <div className="text-sm font-black">₹{p.amount}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3">
                  <button onClick={() => setPurchaseTarget(null)} className="px-4 py-2 rounded-xl border">Cancel</button>
                  <button onClick={startSubCheckout} className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-black">Confirm & Activate</button>
                </div>
              </div>
            </div>
            , document.body)}
        </section>

        {/* Action Sidebar */}
        <aside className="rounded-3xl border border-slate-300/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-shadow duration-300 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 mb-4 border border-white/10 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300">Dashboard</span>
            </div>
            
            <h3 className="text-2xl font-black tracking-tight">Subscription Action</h3>
            <p className="mt-4 text-sm text-slate-300 font-medium leading-relaxed">Use the franchise management section to update subscription status and renewals for owners.</p>
            
            <div className="mt-8 space-y-4">
              <div className="group rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-sm p-5 hover:from-white/15 hover:to-white/10 hover:border-white/20 transition-all duration-300">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400 group-hover:text-slate-300 transition-colors">Status</p>
                <p className="mt-4 text-3xl font-black leading-none">
                  {loading ? <span className="h-8 w-32 rounded-lg bg-white/10 animate-pulse block mt-2" /> : (
                    <span className={cards.activeFranchises > 0 ? "text-emerald-300" : "text-amber-300"}>
                      {cards.activeFranchises > 0 ? "Healthy" : "Needs Attention"}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="group rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-sm p-5 hover:from-white/15 hover:to-white/10 hover:border-white/20 transition-all duration-300">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400 group-hover:text-slate-300 transition-colors">Upcoming renewals</p>
                <p className="mt-4 text-3xl font-black text-teal-300 leading-none">
                  {loading ? <span className="h-8 w-24 rounded-lg bg-white/10 animate-pulse block mt-2" /> : `${cards.expiringSoonFranchises ?? 0} due soon`}
                </p>
              </div>
              
              <div className="group rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 backdrop-blur-sm p-5 hover:from-blue-500/15 hover:to-cyan-500/10 hover:border-blue-500/30 transition-all duration-300">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300 group-hover:text-blue-200 transition-colors">Action Required</p>
                <p className="mt-3 text-sm text-slate-200 font-medium leading-relaxed">Review franchise owner records and confirm payments on the subscription page.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SuperAdminWalletAndEarnings;
