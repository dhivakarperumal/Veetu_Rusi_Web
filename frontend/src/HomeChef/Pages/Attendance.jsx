import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, LoaderCircle, LogIn, LogOut, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

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

const Attendance = () => {
  const [attendance, setAttendance] = useState({ today: "", currentSession: null, records: [] });
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const loadAttendance = useCallback(async () => {
    try {
      const { data } = await api.get("/home-chef-attendance");
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
      if (data) {
        setAttendance({
          today: data.today || "",
          currentSession: data.currentSession || null,
          records: Array.isArray(data.records) ? data.records : [],
        });
      }
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [loadAttendance]);

  const refreshAttendance = async () => {
    setLoading(true);
    const data = await loadAttendance();
    if (data) {
      setAttendance({
        today: data.today || "",
        currentSession: data.currentSession || null,
        records: Array.isArray(data.records) ? data.records : [],
      });
    }
    setLoading(false);
  };

  const markAttendance = async () => {
    const action = attendance.currentSession ? "check_out" : "check_in";
    setMarking(true);
    try {
      const { data } = await api.post("/home-chef-attendance", { action });
      if (data.attendance) {
        setAttendance({
          today: data.attendance.today || "",
          currentSession: data.attendance.currentSession || null,
          records: Array.isArray(data.attendance.records) ? data.attendance.records : [],
        });
      } else {
        const latestAttendance = await loadAttendance();
        if (latestAttendance) {
          setAttendance({
            today: latestAttendance.today || "",
            currentSession: latestAttendance.currentSession || null,
            records: Array.isArray(latestAttendance.records) ? latestAttendance.records : [],
          });
        }
      }
      toast.success(data.message || "Attendance updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to mark attendance.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-full px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Home chef</p>
            <h1 className="mt-1 text-3xl font-black">Attendance</h1>
          </div>
          <button type="button" onClick={refreshAttendance} disabled={loading} aria-label="Refresh attendance" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.3fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-emerald-300">
              <CalendarDays size={20} />
              <span className="text-sm font-bold uppercase">Today</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold">{formatDate(attendance.today)}</p>
            {attendance.currentSession ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} />
                <div>
                  <p className="font-bold text-emerald-200">You are checked in</p>
                  <p className="mt-1 text-sm text-slate-300">Session started at {formatTime(attendance.currentSession.check_in_at)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm leading-6 text-slate-400">Mark your attendance when you start and finish your work session.</p>
            )}
            <button type="button" onClick={markAttendance} disabled={marking || loading} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${attendance.currentSession ? "bg-rose-400 text-slate-950 hover:bg-rose-300" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}>
              {marking ? <LoaderCircle size={19} className="animate-spin" /> : attendance.currentSession ? <LogOut size={18} /> : <LogIn size={18} />}
              {marking ? "Updating attendance..." : attendance.currentSession ? "Check out now" : "Check in now"}
            </button>
          </div>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 className="font-extrabold">Recent sessions</h2>
              <span className="text-sm text-slate-400">{attendance.records.length}</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" /> Loading attendance</div>
            ) : attendance.records.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">Your marked sessions will appear here.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {attendance.records.map((record) => (
                  <article key={record.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div>
                      <p className="font-semibold text-white">{formatDate(record.attendance_date)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={14} /> Check in {formatTime(record.check_in_at)}</p>
                    </div>
                    <div className="text-sm text-slate-300">
                      {record.check_out_at ? `Check out ${formatTime(record.check_out_at)}` : <span className="font-semibold text-emerald-300">Session active</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
};

export default Attendance;