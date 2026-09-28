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
      if (data) setAttendance({ today: data.today || "", records: Array.isArray(data.records) ? data.records : [] });
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [loadAttendance]);

  const refreshAttendance = async () => {
    setLoading(true);
    const data = await loadAttendance();
    if (data) setAttendance({ today: data.today || "", records: Array.isArray(data.records) ? data.records : [] });
    setLoading(false);
  };

  const hasMarkedToday = attendance.records.some((record) => dateKey(record.attendance_date) === attendance.today);

  const markAttendance = () => {
    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }

    setMarking(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        await api.post("/delivery/attendance", {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        toast.success("Attendance marked with your current location.");
        const data = await loadAttendance();
        if (data) setAttendance({ today: data.today || "", records: Array.isArray(data.records) ? data.records : [] });
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
            {hasMarkedToday ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} />
                <div>
                  <p className="font-bold text-emerald-200">Attendance marked</p>
                  <p className="mt-1 text-sm text-slate-300">Check-in at {formatTime(attendance.records.find((record) => dateKey(record.attendance_date) === attendance.today)?.check_in_at)}</p>
                </div>
              </div>
            ) : (
              <button type="button" onClick={markAttendance} disabled={marking || loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                {marking ? <LoaderCircle size={19} className="animate-spin" /> : <Navigation size={18} />}
                {marking ? "Getting location..." : "Mark attendance"}
              </button>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-slate-400">
              <MapPin size={14} className="shrink-0" /> Your current GPS location is saved with each check-in.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Clock3 size={20} />
              <span className="text-sm font-bold uppercase">Check-in policy</span>
            </div>
            <p className="mt-3 text-lg font-bold">One attendance check-in per day</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Location permission is required. Check-ins are recorded with the time and coordinates so your franchise admin can verify your attendance.</p>
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
                    <p className="mt-1 text-sm text-slate-400">Checked in at {formatTime(record.check_in_at)}</p>
                  </div>
                  <a href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-white/5">
                    <MapPin size={14} /> View check-in location
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
