import { CalendarDays, LogIn, LogOut, MapPin, Phone } from "lucide-react";

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const AttendanceSessionCard = ({ name, personId, date, phone, checkIn, checkOut, locations = [] }) => {
  const isActive = !checkOut;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/25 hover:shadow-xl hover:shadow-black/20">
      <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-linear-to-r from-white/5 to-transparent p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isActive ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700/50 text-slate-300"}`}>
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-white">{name || "-"}</h3>
            <p className="mt-1 truncate font-mono text-xs text-slate-500">User ID: {personId || "-"}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isActive ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}>
          {isActive ? "Active" : "Completed"}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2 p-4">
        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/4 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70"><LogIn size={13} /> Check in</p>
          <p className="mt-2 text-xl font-black tabular-nums text-white">{formatTime(checkIn)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/2.5 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><LogOut size={13} /> Check out</p>
          <p className="mt-2 text-xl font-black tabular-nums text-white">{formatTime(checkOut)}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-xs">
        <span className="inline-flex items-center gap-2 text-slate-300"><CalendarDays size={14} className="text-slate-500" />{date || "-"}</span>
        <span className="inline-flex items-center gap-2 text-slate-400"><Phone size={13} className="text-slate-500" />{phone || "No phone"}</span>
      </div>

      {locations.length > 0 && (
        <div className="space-y-2 border-t border-white/5 px-4 py-3">
          {locations.map((location) => (
            <div key={location.label} className="flex items-start justify-between gap-3 text-xs">
              <p className="min-w-0 leading-5 text-slate-400">
                <span className="mr-1 font-semibold text-slate-300">{location.label}:</span>
                <span className="line-clamp-2">{location.address || "Address unavailable"}</span>
              </p>
              {location.mapUrl && (
                <a href={location.mapUrl} target="_blank" rel="noreferrer" aria-label={`View ${location.label.toLowerCase()} map`} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 font-semibold text-emerald-300 transition hover:bg-white/5">
                  <MapPin size={13} /> Map
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

export default AttendanceSessionCard;