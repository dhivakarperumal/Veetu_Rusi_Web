import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { CreditCard, DollarSign, Landmark, Clock, TrendingUp, ShieldCheck } from "lucide-react";

const SuperAdminWalletAndEarnings = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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
      <div>
        <h1 className="text-3xl font-black text-slate-900">Wallet & Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">
          SuperAdmin earnings dashboard with subscription and franchise metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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
          <div key={idx} className={`rounded-3xl border border-slate-200/5 shadow-lg p-6 bg-gradient-to-br ${card.accent || 'from-slate-900 to-slate-950'} text-white`}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">{card.label}</p>
                <p className="mt-4 text-3xl font-black tracking-tight">
                  {loading ? <span className="h-10 w-24 rounded-lg bg-slate-700/70 animate-pulse block" /> : card.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-white/70">{loading ? <span className="h-4 w-32 rounded-lg bg-slate-700/70 animate-pulse block" /> : card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-slate-200/5 bg-white/95 p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Subscription Details</h2>
              <p className="text-sm text-slate-500 mt-1">SuperAdmin summary of franchise subscription health and upcoming renewals.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4" /> Live
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active subscriptions</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{loading ? "..." : cards.activeFranchises ?? 0}</p>
              <p className="mt-2 text-sm text-slate-500">Franchise owners with current active plans.</p>
            </article>
            <article className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expired subscriptions</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{loading ? "..." : cards.expiredFranchises ?? 0}</p>
              <p className="mt-2 text-sm text-slate-500">Franchise owners whose subscription period ended.</p>
            </article>
            <article className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expiring soon</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{loading ? "..." : cards.expiringSoonFranchises ?? 0}</p>
              <p className="mt-2 text-sm text-slate-500">Renewal alerts for the next 7 days.</p>
            </article>
            <article className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total franchises</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{loading ? "..." : cards.totalFranchises ?? 0}</p>
              <p className="mt-2 text-sm text-slate-500">All franchise owners registered in the system.</p>
            </article>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200/5 bg-slate-950 p-6 text-white shadow-lg">
          <h3 className="text-xl font-black">Subscription Action</h3>
          <p className="mt-3 text-sm text-slate-300">Use the franchise management section to update subscription status and renewals for owners.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
              <p className="mt-3 text-2xl font-black">{loading ? "Loading..." : cards.activeFranchises > 0 ? "Healthy" : "Needs Attention"}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Upcoming renewals</p>
              <p className="mt-3 text-2xl font-black">{loading ? "..." : `${cards.expiringSoonFranchises ?? 0} due soon`}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Action</p>
              <p className="mt-3 text-sm text-slate-300">Review franchise owner records and to confirm payments on the subscription page.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SuperAdminWalletAndEarnings;
