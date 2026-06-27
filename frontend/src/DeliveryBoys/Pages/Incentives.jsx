import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  Gift,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  Lock,
  Star,
} from "lucide-react";

const iconMap = {
  Gift,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  Lock,
  Star,
};

const mockIncentives = [
  {
    id: 1,
    title: "Delivery Streak Bonus",
    description: "Complete 5 consecutive deliveries without cancellation.",
    reward: "?500",
    progress: { current: 4, target: 5 },
    status: "in-progress",
    icon: "TrendingUp",
    accent: "#10B981",
  },
  {
    id: 2,
    title: "5-Star Rating Milestone",
    description: "Maintain 4.8+ rating across 20 deliveries.",
    reward: "?1000",
    progress: { current: 18, target: 20 },
    status: "in-progress",
    icon: "Star",
    accent: "#38bdf8",
  },
  {
    id: 3,
    title: "Speed Delivery Challenge",
    description: "Deliver 10 orders with an average time below 20 minutes.",
    reward: "?750",
    progress: { current: 7, target: 10 },
    status: "in-progress",
    icon: "Target",
    accent: "#f97316",
  },
  {
    id: 4,
    title: "Weekend Warrior",
    description: "Complete 15+ weekend deliveries.",
    reward: "?1200",
    progress: { current: 12, target: 15 },
    status: "in-progress",
    icon: "Award",
    accent: "#a855f7",
  },
  {
    id: 5,
    title: "Perfect Attendance",
    description: "Work 25 days without missing a shift.",
    reward: "?1500",
    progress: { current: 22, target: 25 },
    status: "in-progress",
    icon: "CheckCircle",
    accent: "#34d399",
  },
  {
    id: 6,
    title: "Referral Bonus",
    description: "Refer 3 delivery partners and they complete 10 deliveries each.",
    reward: "?2000",
    progress: { current: 2, target: 3 },
    status: "locked",
    icon: "Gift",
    accent: "#fb7185",
  },
];

const stats = [
  { label: "Total Available", value: "?7,450", icon: Gift, accent: "#10B981" },
  { label: "In Progress", value: "5", icon: TrendingUp, accent: "#38bdf8" },
  { label: "Completed", value: "12", icon: Award, accent: "#f59e0b" },
];

const Incentives = () => {
  const [loading, setLoading] = useState(true);
  const [incentives, setIncentives] = useState([]);

  useEffect(() => {
    const loadIncentives = async () => {
      setLoading(true);
      setIncentives(mockIncentives);
      setLoading(false);
    };
    loadIncentives();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading incentives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Delivery Partner</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">Incentive Hub</h1>
            <p className="text-sm leading-6 text-slate-400">Track challenges, monitor reward progress, and unlock higher payouts with every completed delivery.</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Wallet Balance</p>
            <p className="mt-3 text-4xl font-black text-white">?7,450</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">5 active challenges · 12 rewards earned</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article key={index} className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-xl transition hover:-translate-y-1 duration-300">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-3xl" style={{ background: stat.accent }} />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: stat.accent }}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black text-white mt-2">{stat.value}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {incentives.map((incentive) => {
          const progressPercent = Math.min((incentive.progress.current / incentive.progress.target) * 100, 100);
          const isCompleted = incentive.progress.current >= incentive.progress.target;
          const isLocked = incentive.status === "locked";
          const Icon = iconMap[incentive.icon] || Gift;

          return (
            <article key={incentive.id} className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl transition duration-300 ${isLocked ? "opacity-90" : "hover:-translate-y-1"}`}>
              <div className="absolute inset-x-6 top-0 h-28 rounded-b-[2rem] bg-emerald-500/8 blur-3xl opacity-60" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center justify-center rounded-3xl p-3 shadow-lg" style={{ background: incentive.accent }}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${isLocked ? "text-slate-500" : "text-emerald-300"}`}>{incentive.reward}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1">Reward</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white">{incentive.title}</h2>
                  <p className="text-sm leading-6 text-slate-400">{incentive.description}</p>
                </div>

                {!isLocked ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      <span>Progress</span>
                      <span>{incentive.progress.current}/{incentive.progress.target}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-900/70">
                      <div className={`h-full rounded-full ${isCompleted ? "bg-emerald-400" : "bg-emerald-500"} transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isCompleted ? "text-emerald-300" : "text-slate-500"}`}>
                      {isCompleted ? "Completed" : `${incentive.progress.target - incentive.progress.current} more to unlock`}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/80 p-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Locked challenge — complete active rewards first</span>
                    </div>
                  </div>
                )}

                {!isLocked && isCompleted && (
                  <button className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-400 active:scale-95 shadow-xl shadow-emerald-500/20">
                    Claim reward
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">What you need to know</p>
            <h2 className="mt-3 text-2xl font-black text-white">Advance your earnings with every delivery</h2>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">Keep the streak alive, finish on time, and watch your payout grow.</div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <p className="font-black text-white">Fast Rewards</p>
            <p className="mt-2 text-slate-400">Unlock bonus payout immediately after challenge completion.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <p className="font-black text-white">Higher Status</p>
            <p className="mt-2 text-slate-400">Complete more incentives to qualify for premium delivery tasks.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Incentives;
