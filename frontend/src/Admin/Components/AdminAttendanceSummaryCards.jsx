import { CheckCircle, Clock, List } from "lucide-react";

const cardStyles = [
  {
    label: "Total Sessions",
    caption: "All sessions for the selected date",
    outer: "bg-linear-to-br from-violet-500/30 via-indigo-500/20 to-transparent",
    panel: "bg-linear-to-br from-[#0f1628] to-[#0a0e1a]",
    glow: "bg-violet-600/15",
    iconPanel: "bg-linear-to-br from-violet-600 to-indigo-700",
    iconShadow: "shadow-violet-700/40",
    labelColor: "text-violet-300/70",
    Icon: List,
  },
  {
    label: "Active Sessions",
    caption: "Currently checked in",
    outer: "bg-linear-to-br from-emerald-500/40 via-teal-500/20 to-transparent",
    panel: "bg-linear-to-br from-[#071a10] to-[#0a0e1a]",
    glow: "bg-emerald-500/20",
    iconPanel: "bg-linear-to-br from-emerald-500 to-teal-600",
    iconShadow: "shadow-emerald-600/40",
    labelColor: "text-emerald-300/70",
    Icon: CheckCircle,
  },
  {
    label: "Completed Sessions",
    caption: "Checked-out sessions",
    outer: "bg-linear-to-br from-amber-500/40 via-orange-500/20 to-transparent",
    panel: "bg-linear-to-br from-[#1a1004] to-[#0a0e1a]",
    glow: "bg-amber-500/20",
    iconPanel: "bg-linear-to-br from-amber-500 to-orange-600",
    iconShadow: "shadow-amber-600/40",
    labelColor: "text-amber-300/70",
    Icon: Clock,
  },
];

const AdminAttendanceSummaryCards = ({ total, active, completed }) => {
  const values = [total, active, completed];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cardStyles.map(({ Icon, ...style }, index) => (
        <div key={style.label} className={`group relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:-translate-y-1 ${style.outer}`}>
          <div className={`relative flex h-full items-center gap-5 overflow-hidden rounded-2xl p-6 ${style.panel}`}>
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl ${style.glow}`} />
            <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg ${style.iconPanel} ${style.iconShadow}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="relative min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${style.labelColor}`}>{style.label}</p>
              <p className="mt-1 text-4xl font-black leading-none text-white">{values[index]}</p>
              <p className="mt-1 text-[10px] font-semibold text-white/40">{style.caption}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default AdminAttendanceSummaryCards;