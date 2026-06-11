import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { CreditCard, DollarSign, Landmark, Clock, TrendingUp, ShieldCheck } from "lucide-react";

const SuperAdminWalletAndEarnings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/dashboard-stats");
      setStats(res.data.cards || {});
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
    })();
  }, []);

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
