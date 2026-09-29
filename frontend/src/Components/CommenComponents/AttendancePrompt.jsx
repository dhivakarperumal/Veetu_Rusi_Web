import { useEffect, useState } from "react";
import { CalendarCheck, LoaderCircle, LogIn, MapPin, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

const AttendancePrompt = ({ endpoint, roleLabel, requiresLocation = false, updateEvent }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    api.get(endpoint)
      .then(({ data }) => {
        if (!isCurrent) return;
        const checkedIn = Boolean(data.currentSession);
        setIsCheckedIn(checkedIn);
        setIsOpen(!checkedIn);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load attendance.");
      });
    return () => { isCurrent = false; };
  }, [endpoint]);

  const markAttendance = async () => {
    const action = "check_in";
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
        currentSession: data.currentSession || null,
      };
      const checkedIn = Boolean(nextAttendance.currentSession);
      setIsCheckedIn(checkedIn);
      setIsOpen(!checkedIn);
      if (updateEvent) {
        window.dispatchEvent(new CustomEvent(updateEvent, {
          detail: {
            today: data.today || "",
            currentSession: nextAttendance.currentSession,
            records: Array.isArray(data.records) ? data.records : [],
          },
        }));
      }
      toast.success("Checked in successfully.");
    } catch (error) {
      const message = requiresLocation && error.code === 1
        ? "Allow location access to mark attendance."
        : error.response?.data?.message || "Unable to update attendance.";
      toast.error(message);
    } finally {
      setMarking(false);
    }
  };

  if (!isOpen || isCheckedIn) return null;

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
          <p className="text-sm leading-6 text-slate-300">You are not checked in yet. Start your attendance session to go online.</p>
          {requiresLocation && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><MapPin size={14} /> Location access is required for check-in.</p>
          )}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsOpen(false)} disabled={marking} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
              Not now
            </button>
            <button type="button" onClick={markAttendance} disabled={marking} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
              {marking ? <LoaderCircle size={17} className="animate-spin" /> : <LogIn size={17} />}
              {marking ? "Checking in..." : "Check in"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AttendancePrompt;