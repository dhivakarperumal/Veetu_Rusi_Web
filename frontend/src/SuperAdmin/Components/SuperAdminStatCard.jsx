import { ArrowUpRight, TrendingDown } from "lucide-react";

const SuperAdminStatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  positive = true,
  gradient = "linear-gradient(135deg,#052e16 0%,#0B1120 100%)",
  iconBg = "#10B981",
  loading = false,
  description
}) => (
  <div
    className="relative overflow-hidden rounded-3xl p-6 border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300 group"
    style={{ background: gradient }}
  >
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: iconBg }} />

    <div className="flex items-start justify-between mb-5 relative z-10">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: iconBg }}>
        <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${positive
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
      )}
    </div>

    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.18em] leading-none mb-2 relative z-10">{label}</p>
    <h3 className="text-3xl font-black text-white tracking-tight relative z-10">
      {loading ? <span className="h-9 w-24 rounded-lg bg-white/10 animate-pulse block" /> : value}
    </h3>
    {description && <p className="mt-3 text-xs text-white/50 font-semibold relative z-10">{description}</p>}
  </div>
);

export default SuperAdminStatCard;