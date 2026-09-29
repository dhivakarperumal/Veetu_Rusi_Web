import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LayoutGrid, List, LoaderCircle, LogIn, LogOut, MapPin, Navigation, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";
import AttendanceDateFilters, { filterAttendanceRecords } from "../../Components/CommenComponents/AttendanceDateFilters";
import ChefDataToolbar from "../../HomeChef/Components/ChefDataToolbar";

const dateKey = (value) => String(value || "").slice(0, 10);

const formatDate = (value) => {
  const key = dateKey(value);
  if (!key) return "-";
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  : "-";

const hasCoordinates = (latitude, longitude) =>
  latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined &&
  Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));

const formatLocation = (address, latitude, longitude) => {
  if (address) return address;
  if (!hasCoordinates(latitude, longitude)) return "-";
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
};

const mapUrl = (latitude, longitude) =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

const requestLocation = (options) => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const getCurrentLocation = async () => {
  try {
    return await requestLocation({ enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 });
  } catch (error) {
    if (error.code === 1) throw error;
    return requestLocation({ enableHighAccuracy: true, maximumAge: 0, timeout: 45000 });
  }
};

const Attendance = () => {
  const [attendance, setAttendance] = useState({ today: "", records: [] });
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date();
  const currentMonth = attendance.today
    ? attendance.today.slice(0, 7)
    : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthlySessions = attendance.records.filter((record) => dateKey(record.attendance_date).startsWith(currentMonth));
  const completedSessions = attendance.records.filter((record) => record.check_out_at).length;
  const summaryCards = [
    {
      label: "Total Sessions", value: attendance.records.length, caption: "All recorded sessions",
      Icon: CalendarDays, border: "bg-linear-to-br from-blue-500/30 via-cyan-500/20 to-transparent",
      panel: "bg-[#13161b]", glow: "bg-blue-600/15", iconBg: "bg-linear-to-br from-blue-600 to-cyan-700",
      shadow: "shadow-blue-700/40", labelColor: "text-blue-300/70",
    },
    {
      label: "Active", value: attendance.currentSession ? 1 : 0, caption: "Current delivery session",
      Icon: CheckCircle2, border: "bg-linear-to-br from-emerald-500/40 via-teal-500/20 to-transparent",
      panel: "bg-linear-to-br from-[#071a10] to-[#0a0e1a]", glow: "bg-emerald-500/20", iconBg: "bg-linear-to-br from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-600/40", labelColor: "text-emerald-300/70",
    },
    {
      label: "Completed", value: completedSessions, caption: "Checked-out sessions",
      Icon: Clock3, border: "bg-linear-to-br from-amber-500/40 via-orange-500/20 to-transparent",
      panel: "bg-linear-to-br from-[#1a1004] to-[#0a0e1a]", glow: "bg-amber-500/20", iconBg: "bg-linear-to-br from-amber-500 to-orange-600",
      shadow: "shadow-amber-600/40", labelColor: "text-amber-300/70",
    },
    {
      label: "This Month", value: monthlySessions.length, caption: "Sessions this month",
      Icon: CalendarDays, border: "bg-linear-to-br from-rose-500/40 via-red-500/20 to-transparent",
      panel: "bg-linear-to-br from-[#1a0a0a] to-[#0a0e1a]", glow: "bg-rose-500/20", iconBg: "bg-linear-to-br from-rose-500 to-red-600",
      shadow: "shadow-rose-600/40", labelColor: "text-rose-300/70",
    },
  ];
  const filteredRecords = filterAttendanceRecords(attendance.records, dateFilter, customDate).filter((record) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const status = record.check_out_at ? "completed" : "active";
    return [
      formatDate(record.attendance_date),
      formatTime(record.check_in_at),
      formatTime(record.check_out_at),
      status,
      record.check_in_address || "",
      record.check_out_address || "",
    ].some((value) => value.toLowerCase().includes(query));
  });
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const loadAttendance = useCallback(async () => {
    try {
      const { data } = await api.get("/delivery/attendance");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load attendance.");
      return null;
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    loadAttendance().then((data) => {
      if (!isCurrent) return;
      if (data) setAttendance({ today: data.today || "", currentSession: data.currentSession || null, records: Array.isArray(data.records) ? data.records : [] });
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [loadAttendance]);

  const markAttendance = () => {
    const action = attendance.currentSession ? "check_out" : "check_in";

    const saveAttendance = async (location = {}) => {
      try {
        await api.post("/delivery/attendance", { action, ...location });
        toast.success(action === "check_in" ? "Checked in with your current location." : "Checked out successfully.");
        const data = await loadAttendance();
        if (data) {
          const nextAttendance = { today: data.today || "", currentSession: data.currentSession || null, records: Array.isArray(data.records) ? data.records : [] };
          setAttendance(nextAttendance);
          window.dispatchEvent(new CustomEvent("delivery-attendance-updated", { detail: nextAttendance }));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to mark attendance.");
      } finally {
        setMarking(false);
      }
    };

    if (action === "check_out") {
      setMarking(true);
      saveAttendance();
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }

    setMarking(true);
    getCurrentLocation().then(async ({ coords }) => {
      await saveAttendance({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
    }).catch((error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Allow location access to mark attendance."
        : error.code === error.TIMEOUT
          ? "Location is taking too long. Check that device location is on and try near a window or outdoors."
          : "Unable to get your location. Please try again.";
      toast.error(message);
      setMarking(false);
    });
  };

  return (
    <div className="min-h-screen space-y-6 animate-in fade-in duration-300 bg-linear-to-br from-[#0c1116] to-[#171a20] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Attendance</h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-300">Delivery sessions, locations, and check-in history</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {attendance.currentSession && <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300">Checked in since {formatTime(attendance.currentSession.check_in_at)}</span>}
            <button type="button" onClick={markAttendance} disabled={marking || loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${attendance.currentSession ? "bg-rose-700 hover:bg-rose-800" : "bg-emerald-700 hover:bg-emerald-800"}`}>
              {marking ? <LoaderCircle size={16} className="animate-spin" /> : attendance.currentSession ? <LogOut size={16} /> : <LogIn size={16} />}
              {marking ? "Updating..." : attendance.currentSession ? "Check out" : "Check in"}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ Icon, ...card }) => (
            <div key={card.label} className={`group relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:-translate-y-1 ${card.border}`}>
              <div className={`relative flex h-full items-center gap-4 overflow-hidden rounded-2xl p-6 ${card.panel}`}>
                <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl ${card.glow}`} />
                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg ${card.iconBg} ${card.shadow}`}><Icon className="h-6 w-6 text-white" /></div>
                <div className="relative min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${card.labelColor}`}>{card.label}</p>
                  <p className="mt-1 text-4xl font-black leading-none text-white">{card.value}</p>
                  <p className="mt-1 text-[10px] font-semibold text-white/40">{card.caption}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <ChefDataToolbar
          search={search}
          onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
          placeholder="Search attendance date, time, address or status..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilterIcon={false}
          filters={(
            <AttendanceDateFilters
              filter={dateFilter}
              customDate={customDate}
              onFilterChange={(value) => { setDateFilter(value); setCurrentPage(1); }}
              onCustomDateChange={(value) => { setCustomDate(value); setDateFilter("custom"); setCurrentPage(1); }}
            />
          )}
        />

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/5" />)}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-[#101217] py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-emerald-400"><CalendarDays size={36} /></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">No Sessions Found</p>
            <p className="mt-2 px-8 text-[10px] font-bold text-slate-500">{search ? `Nothing matched "${search}".` : "Your attendance sessions will appear here."}</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1418] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-200">
                <thead><tr className="bg-[#0b0f12]">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Check in</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Check-in location</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Check out</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Check-out location</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="group transition-colors hover:bg-slate-900/40">
                      <td className="whitespace-nowrap px-8 py-5 font-black text-white">{formatDate(record.attendance_date)}</td>
                      <td className="whitespace-nowrap px-8 py-5 font-semibold text-slate-200">{formatTime(record.check_in_at)}</td>
                      <td className="max-w-64 px-8 py-5 text-slate-300">
                        <p className="line-clamp-2">{formatLocation(record.check_in_address, record.latitude, record.longitude)}</p>
                        {hasCoordinates(record.latitude, record.longitude) && <a href={mapUrl(record.latitude, record.longitude)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"><MapPin size={13} /> View map</a>}
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 font-semibold text-slate-200">{formatTime(record.check_out_at)}</td>
                      <td className="max-w-64 px-8 py-5 text-slate-300">
                        <p className="line-clamp-2">{formatLocation(record.check_out_address, record.check_out_latitude, record.check_out_longitude)}</p>
                        {hasCoordinates(record.check_out_latitude, record.check_out_longitude) && <a href={mapUrl(record.check_out_latitude, record.check_out_longitude)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"><MapPin size={13} /> View map</a>}
                      </td>
                      <td className="whitespace-nowrap px-8 py-5"><span className={`inline-block rounded-full border px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${record.check_out_at ? "border-slate-700 bg-slate-800 text-slate-300" : "border-emerald-800 bg-emerald-900/20 text-emerald-300"}`}>{record.check_out_at ? "Completed" : "Active"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedRecords.map((record) => (
              <article key={record.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1418] shadow-sm transition-all hover:shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
                  <div><p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Attendance session</p><h3 className="mt-2 text-base font-semibold text-white">{formatDate(record.attendance_date)}</h3></div>
                  <span className={`rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest ${record.check_out_at ? "border-slate-700 bg-slate-800 text-slate-300" : "border-emerald-800 bg-emerald-900/20 text-emerald-300"}`}>{record.check_out_at ? "Completed" : "Active"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5">
                  <div className="rounded-xl border border-slate-800 bg-[#0b0f12] p-4"><p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Check in</p><p className="mt-2 text-lg font-bold text-white">{formatTime(record.check_in_at)}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-[#0b0f12] p-4"><p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Check out</p><p className="mt-2 text-lg font-bold text-white">{formatTime(record.check_out_at)}</p></div>
                </div>
                <div className="mt-auto space-y-2 border-t border-slate-800 px-5 py-4 text-xs text-slate-400">
                  <p><span className="font-semibold text-slate-300">In:</span> {formatLocation(record.check_in_address, record.latitude, record.longitude)}</p>
                  {record.check_out_at && <p><span className="font-semibold text-slate-300">Out:</span> {formatLocation(record.check_out_address, record.check_out_latitude, record.check_out_longitude)}</p>}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {hasCoordinates(record.latitude, record.longitude) && <a href={mapUrl(record.latitude, record.longitude)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200"><MapPin size={13} /> Check-in map</a>}
                    {hasCoordinates(record.check_out_latitude, record.check_out_longitude) && <a href={mapUrl(record.check_out_latitude, record.check_out_longitude)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200"><MapPin size={13} /> Check-out map</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredRecords.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} sessions</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-700 bg-[#111318] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`h-9 w-9 rounded-xl text-[10px] font-black transition ${currentPage === page ? "bg-emerald-600 text-white" : "border border-slate-700 bg-[#111318] text-slate-300 hover:bg-slate-800"}`}>{page}</button>)}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-xl border border-slate-700 bg-[#111318] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
