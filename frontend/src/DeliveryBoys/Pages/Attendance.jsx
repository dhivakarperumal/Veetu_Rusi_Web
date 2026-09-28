import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, LoaderCircle, MapPin, Navigation, RefreshCw } from "lucide-react";
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
  const [attendance, setAttendance] = useState({ today: "", records: [] });
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

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

  const refreshAttendance = async () => {
    setLoading(true);
    const data = await loadAttendance();
    if (data) setAttendance({ today: data.today || "", currentSession: data.currentSession || null, records: Array.isArray(data.records) ? data.records : [] });
    setLoading(false);
  };

  const markAttendance = () => {
    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }

    const action = attendance.currentSession ? "check_out" : "check_in";
    setMarking(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        await api.post("/delivery/attendance", {
          action,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        toast.success(action === "check_in" ? "Checked in with your current location." : "Checked out with your current location.");
        const data = await loadAttendance();
        if (data) setAttendance({ today: data.today || "", currentSession: data.currentSession || null, records: Array.isArray(data.records) ? data.records : [] });
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to mark attendance.");
      } finally {
        setMarking(false);
      }
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Allow location access to mark attendance."
        : error.code === error.TIMEOUT
          ? "Could not get your location in time. Please try again."
          : "Unable to get your location. Please try again.";
      toast.error(message);
      setMarking(false);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  };

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Delivery partner</p>
            <h1 className="mt-1 text-3xl font-black">Attendance</h1>
          </div>
          <button type="button" onClick={refreshAttendance} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-emerald-300">
              <CalendarDays size={20} />
              <span className="text-sm font-bold uppercase">Today</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold">{formatDate(attendance.today)}</p>
            {attendance.currentSession && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} />
                <div>
                  <p className="font-bold text-emerald-200">You are checked in</p>
                  <p className="mt-1 text-sm text-slate-300">Session started at {formatTime(attendance.currentSession.check_in_at)}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={markAttendance} disabled={marking || loading} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${attendance.currentSession ? "bg-rose-400 text-slate-950 hover:bg-rose-300" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}>
              {marking ? <LoaderCircle size={19} className="animate-spin" /> : <Navigation size={18} />}
              {marking ? "Getting location..." : attendance.currentSession ? "Check out now" : "Check in now"}
            </button>
            <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-slate-400">
              <MapPin size={14} className="shrink-0" /> Your address and GPS location are saved at every check-in and check-out.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Clock3 size={20} />
              <span className="text-sm font-bold uppercase">Check-in policy</span>
            </div>
            <p className="mt-3 text-lg font-bold">Check in and out as needed</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">End your current session before starting another. Each event records the time, address, and GPS coordinates for your franchise admin.</p>
            <p className="mt-3 text-xs text-slate-500">Address lookup: © OpenStreetMap contributors</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-extrabold">Recent attendance</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" /> Loading attendance</div>
          ) : attendance.records.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {attendance.records.map((record) => (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div>
                    <p className="font-bold">{formatDate(record.attendance_date)}</p>
                    <p className="mt-1 text-sm text-slate-400">In {formatTime(record.check_in_at)} · Out {formatTime(record.check_out_at)}</p>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">In: {record.check_in_address || `Near ${Number(record.latitude).toFixed(5)}, ${Number(record.longitude).toFixed(5)}`}</p>
                    {record.check_out_at && <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">Out: {record.check_out_address || `Near ${Number(record.check_out_latitude).toFixed(5)}, ${Number(record.check_out_longitude).toFixed(5)}`}</p>}
                  </div>
                  <a href={`https://www.google.com/maps?q=${record.check_out_at ? record.check_out_latitude : record.latitude},${record.check_out_at ? record.check_out_longitude : record.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-white/5">
                    <MapPin size={14} /> View {record.check_out_at ? "check-out" : "check-in"} location
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Attendance;
