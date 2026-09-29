import { useState } from "react";
import { LoaderCircle, LogIn, LogOut, MapPin, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

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

const AttendanceStatusConfirmation = ({ isOpen, isOnline, endpoint, updateEvent, requiresLocation = false, onClose }) => {
  const [updating, setUpdating] = useState(false);

  const confirmStatusChange = async () => {
    const action = isOnline ? "check_out" : "check_in";
    setUpdating(true);
    try {
      let location = {};
      if (requiresLocation && action === "check_in") {
        if (!navigator.geolocation) {
          toast.error("Location services are not available in this browser.");
          return;
        }
        const position = await getCurrentLocation();
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
      window.dispatchEvent(new CustomEvent(updateEvent, { detail: nextAttendance }));
      toast.success(action === "check_in" ? "You are online." : "You are offline.");
      onClose();
    } catch (error) {
      const message = requiresLocation && error.code === 1
        ? "Allow location access to check in."
        : error.code === 3
          ? "Location is taking too long. Please try again."
          : error.response?.data?.message || "Unable to update attendance status.";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  const actionLabel = isOnline ? "Go offline" : "Go online";
  const buttonLabel = isOnline ? "Yes, check out" : "Yes, check in";

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="attendance-status-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${isOnline ? "text-rose-300" : "text-emerald-300"}`}>Attendance status</p>
            <h2 id="attendance-status-title" className="mt-2 text-xl font-black">{actionLabel}?</h2>
          </div>
          <button type="button" onClick={onClose} disabled={updating} aria-label="Close confirmation" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
            <X size={18} />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-slate-300">
            {isOnline ? "This will check you out and end your current attendance session." : "This will check you in and start a new attendance session."}
          </p>
          {requiresLocation && !isOnline && <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><MapPin size={14} /> Current location is required to check in.</p>}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={updating} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">Cancel</button>
            <button type="button" onClick={confirmStatusChange} disabled={updating} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition disabled:cursor-wait disabled:opacity-60 ${isOnline ? "bg-rose-400 text-slate-950 hover:bg-rose-300" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}>
              {updating ? <LoaderCircle size={17} className="animate-spin" /> : isOnline ? <LogOut size={17} /> : <LogIn size={17} />}
              {updating ? "Updating..." : buttonLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AttendanceStatusConfirmation;