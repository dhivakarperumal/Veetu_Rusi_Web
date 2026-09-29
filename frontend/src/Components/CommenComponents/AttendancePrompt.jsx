import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, LoaderCircle, LogIn, LogOut, MapPin, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  : "";

const AttendancePrompt = ({ endpoint, roleLabel, requiresLocation = false, updateEvent }) => {
  const [attendance, setAttendance] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    api.get(endpoint)
      .then(({ data }) => {
        if (!isCurrent) return;
        setAttendance({
          today: data.today || "",
          currentSession: data.currentSession || null,
          records: Array.isArray(data.records) ? data.records : [],
        });
        setIsOpen(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load attendance.");
      });
    return () => { isCurrent = false; };
  }, [endpoint]);

  const markAttendance = async () => {
    const action = attendance?.currentSession ? "check_out" : "check_in";
    setMarking(true);
    try {
      let location = {};
      if (requiresLocation && action === "check_in") {
        if (!navigator.geolocation) {
          toast.error("Location services are not available in this browser.");
          return;
        }
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 45000,
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      }

      await api.post(endpoint, { action, ...location });
      const { data } = await api.get(endpoint);
      const nextAttendance = {
        today: data.today || "",
        currentSession: data.currentSession || null,
        records: Array.isArray(data.records) ? data.records : [],
      };
      setAttendance(nextAttendance);
      if (updateEvent) {
        window.dispatchEvent(new CustomEvent(updateEvent, { detail: nextAttendance }));
      }
      toast.success(action === "check_in" ? "Checked in successfully." : "Checked out successfully.");
    } catch (error) {
      const message = requiresLocation && error.code === 1
        ? "Allow location access to mark attendance."
        : error.response?.data?.message || "Unable to update attendance.";
      toast.error(message);
    } finally {
      setMarking(false);
    }
  };

  if (!isOpen || !attendance) return null;

  const isCheckedIn = Boolean(attendance.currentSession);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="attendance-prompt-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><CalendarCheck size={17} /> {roleLabel}</p>
            <h2 id="attendance-prompt-title" className="mt-2 text-xl font-black">Mark your attendance</h2>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close attendance prompt" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5">
          {isCheckedIn ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-bold text-emerald-200">You are checked in</p>
                {attendance.currentSession.check_in_at && <p className="mt-1 text-sm text-slate-300">Session started at {formatTime(attendance.currentSession.check_in_at)}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-300">You are not checked in yet. Start your attendance session to go online.</p>
          )}
          {requiresLocation && !isCheckedIn && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><MapPin size={14} /> Location access is required for check-in.</p>
          )}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsOpen(false)} disabled={marking} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
              Not now
            </button>
            <button type="button" onClick={markAttendance} disabled={marking} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition disabled:cursor-wait disabled:opacity-60 ${isCheckedIn ? "bg-rose-400 text-slate-950 hover:bg-rose-300" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}>
              {marking ? <LoaderCircle size={17} className="animate-spin" /> : isCheckedIn ? <LogOut size={17} /> : <LogIn size={17} />}
              {marking ? "Updating..." : isCheckedIn ? "Check out" : "Check in"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AttendancePrompt;