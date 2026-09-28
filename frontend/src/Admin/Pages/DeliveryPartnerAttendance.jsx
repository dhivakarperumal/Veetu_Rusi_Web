import { useCallback, useEffect, useState } from "react";
import { CalendarDays, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const formatDate = (value) => {
  const key = String(value || "").slice(0, 10);
  if (!key) return "-";
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DeliveryPartnerAttendance = () => {
  const [date, setDate] = useState(localDate);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAttendance = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/delivery-partners/attendance", { params: { date } });
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load attendance records.");
      return null;
    }
  }, [date]);

  useEffect(() => {
    let isCurrent = true;
    loadAttendance().then((data) => {
      if (!isCurrent) return;
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [loadAttendance]);

  const refreshAttendance = async () => {
    setLoading(true);
    const data = await loadAttendance();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Delivery partners</p>
            <h1 className="mt-1 text-3xl font-black">Attendance</h1>
            <p className="mt-2 text-sm text-slate-400">Partner check-ins and captured locations for your franchise.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-slate-400">Attendance date</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5">
                <CalendarDays size={17} className="text-emerald-300" />
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="scheme-dark bg-transparent text-sm text-white outline-none" />
              </span>
            </label>
            <button type="button" onClick={refreshAttendance} disabled={loading} aria-label="Refresh attendance" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4 sm:px-6">
            <h2 className="font-extrabold">Check-in records</h2>
            <span className="text-sm text-slate-400">{records.length} {records.length === 1 ? "partner" : "partners"}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" /> Loading attendance</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-200">No check-ins for {formatDate(date)}</p>
              <p className="mt-2 text-sm text-slate-400">Attendance marked by your delivery partners will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-bold">Delivery partner</th>
                    <th className="px-6 py-3 font-bold">Check-in</th>
                    <th className="px-6 py-3 font-bold">Phone</th>
                    <th className="px-6 py-3 font-bold">Location</th>
                    <th className="px-6 py-3 font-bold">GPS accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map((record) => (
                    <tr key={record.id} className="transition hover:bg-white/2.5">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{record.delivery_partner_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(record.attendance_date)}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{new Date(record.check_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-6 py-4 text-slate-300">{record.mobile || "-"}</td>
                      <td className="px-6 py-4">
                        <a href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200">
                          <MapPin size={15} /> View map
                        </a>
                        <p className="mt-1 font-mono text-xs text-slate-500">{Number(record.latitude).toFixed(5)}, {Number(record.longitude).toFixed(5)}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{record.accuracy_m == null ? "-" : `±${Math.round(Number(record.accuracy_m))} m`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeliveryPartnerAttendance;
