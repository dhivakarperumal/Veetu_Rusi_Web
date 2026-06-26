import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  Gift, TrendingUp, Target, Award, Clock, CheckCircle, Lock
} from "lucide-react";

const Incentives = () => {
  const [loading, setLoading] = useState(true);
  const [incentives, setIncentives] = useState([]);

  useEffect(() => {
    fetchIncentives();
  }, []);

  const fetchIncentives = async () => {
    try {
      setLoading(false);
      // Mock incentive data - replace with real API when available
      const mockIncentives = [
        {
          id: 1,
          title: "Delivery Streak Bonus",
          description: "Complete 5 consecutive deliveries without cancellation",
          reward: "₹500",
          progress: { current: 4, target: 5 },
          status: "in-progress",
          icon: "TrendingUp"
        },
        {
          id: 2,
          title: "5-Star Rating Milestone",
          description: "Maintain 4.8+ rating for 20 deliveries",
          reward: "₹1000",
          progress: { current: 18, target: 20 },
          status: "in-progress",
          icon: "Star"
        },
        {
          id: 3,
          title: "Speed Delivery Challenge",
          description: "Deliver 10 orders within 20 minutes average",
          reward: "₹750",
          progress: { current: 7, target: 10 },
          status: "in-progress",
          icon: "Target"
        },
        {
          id: 4,
          title: "Weekend Warrior",
          description: "Complete 15+ deliveries on weekends",
          reward: "₹1200",
          progress: { current: 12, target: 15 },
          status: "in-progress",
          icon: "Award"
        },
        {
          id: 5,
          title: "Perfect Attendance",
          description: "Work 25 days without missing shifts",
          reward: "₹1500",
          progress: { current: 22, target: 25 },
          status: "in-progress",
          icon: "CheckCircle"
        },
        {
          id: 6,
          title: "Referral Bonus",
          description: "Refer 3 delivery partners and they complete 10 deliveries each",
          reward: "₹2000",
          progress: { current: 2, target: 3 },
          status: "locked",
          icon: "Gift"
        }
      ];
      setIncentives(mockIncentives);
    } catch (error) {
      console.error("Incentives fetch error:", error);
      toast.error("Failed to load incentives");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Incentives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#2e0516 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #EC4899 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.25em] mb-1">
            Earn More
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tight leading-none">
            Incentive Programs
          </h1>
          <p className="text-xs text-white/30 font-semibold mt-2 uppercase tracking-widest">
            Complete challenges and earn bonus rewards
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Available", value: "₹7,450", icon: Gift, color: "text-pink-500", iconBg: "#EC4899" },
          { label: "In Progress", value: "5", icon: TrendingUp, color: "text-blue-500", iconBg: "#3B82F6" },
          { label: "Completed", value: "12", icon: Award, color: "text-emerald-500", iconBg: "#10B981" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="relative overflow-hidden rounded-3xl p-6 border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              style={{ background: "linear-gradient(135deg,#1f052e 0%,#0B1120 100%)" }}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: stat.iconBg }} />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: stat.iconBg }}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.18em] mb-2 relative z-10">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tight relative z-10">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Incentives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incentives.map((incentive) => {
          const progressPercent = (incentive.progress.current / incentive.progress.target) * 100;
          const isCompleted = incentive.progress.current >= incentive.progress.target;
          const isLocked = incentive.status === "locked";

          return (
            <div key={incentive.id} className={`rounded-[2rem] p-6 overflow-hidden transition-all border ${
              isLocked
                ? "bg-slate-950/90 border-white/10 opacity-90"
                : isCompleted
                ? "bg-slate-950/95 border-white/10"
                : "bg-slate-950/90 border-white/10 hover:shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-400" />
                      {incentive.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">{incentive.description}</p>
                  </div>
                  {isLocked && <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                  {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {/* Reward Badge */}
              <div className="mb-4 inline-block px-3 py-1.5 rounded-xl bg-pink-900/80 border border-pink-500/30">
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest">{incentive.reward}</p>
              </div>

              {/* Progress Bar */}
              {!isLocked && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-black text-slate-200">{incentive.progress.current}/{incentive.progress.target}</span>
                  </div>
                  <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-emerald-400" : "bg-pink-400"
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  {isCompleted && (
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Challenge Completed!
                    </p>
                  )}
                </div>
              )}

              {isLocked && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <Lock className="w-4 h-4" />
                  Complete other challenges to unlock
                </div>
              )}

              {/* CTA */}
              {isCompleted && !isLocked && (
                <button className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                  Claim Reward
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-slate-950/90 border border-white/10 rounded-[2rem] p-6">
        <h4 className="text-sm font-black text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          How it works
        </h4>
        <ul className="space-y-2 text-[11px] font-bold text-slate-300">
          <li>• Complete incentive challenges to earn bonus rewards</li>
          <li>• Track your progress in real-time and claim rewards when completed</li>
          <li>• Earn more by participating in multiple incentive programs</li>
          <li>• Rewards are credited to your wallet within 24 hours</li>
        </ul>
      </div>
    </div>
  );
};

export default Incentives;
