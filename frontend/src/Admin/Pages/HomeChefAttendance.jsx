import { useCallback, useEffect, useState } from "react";
import { CalendarDays, LoaderCircle, RefreshCw } from "lucide-react";
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

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  : "-";

const HomeChefAttendance = () => {
  const [date, setDate] = useState(localDate);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAttendance = useCallback(async (selectedDate = date) => {
    try {
      const { data } = await api.get("/admin/home-chefs/attendance", { params: { date: selectedDate } });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load home chef attendance.");
      return null;
    }
  }, [date]);

  useEffect(() => {
    let isCurrent = true;
    loadAttendance(date).then((data) => {
      if (!isCurrent) return;
      if (data) setRecords(data);
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [date, loadAttendance]);

  const refreshAttendance = async () => {
    setLoading(true);
    const data = await loadAttendance(date);
    if (data) setRecords(data);
    setLoading(false);
  };

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Home chefs</p>
            <h1 className="mt-1 text-3xl font-black">Attendance</h1>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-slate-400">Attendance date</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5">
                <CalendarDays size={17} className="text-emerald-300" />
                <input type="date" value={date} onChange={(event) => { setLoading(true); setDate(event.target.value); }} className="scheme-dark bg-transparent text-sm text-white outline-none" />
              </span>
            </label>
            <button type="button" onClick={refreshAttendance} disabled={loading} aria-label="Refresh attendance" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <h2 className="font-extrabold">Attendance sessions</h2>
            <span className="text-sm text-slate-400">{records.length} {records.length === 1 ? "session" : "sessions"}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" /> Loading attendance</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-200">No home chef check-ins for {formatDate(date)}</p>
              <p className="mt-2 text-sm text-slate-400">Marked sessions from your home chefs will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-bold">Home chef</th>
                    <th className="px-6 py-3 font-bold">Date</th>
                    <th className="px-6 py-3 font-bold">Checked in</th>
                    <th className="px-6 py-3 font-bold">Checked out</th>
                    <th className="px-6 py-3 font-bold">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map((record) => (
                    <tr key={record.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4 font-bold text-white">{record.home_chef_name || "Home Chef"}</td>
                      <td className="px-6 py-4 text-slate-300">{formatDate(record.attendance_date)}</td>
                      <td className="px-6 py-4 text-slate-300">{formatTime(record.check_in_at)}</td>
                      <td className="px-6 py-4">{record.check_out_at ? <span className="text-slate-300">{formatTime(record.check_out_at)}</span> : <span className="font-semibold text-emerald-300">Active</span>}</td>
                      <td className="px-6 py-4 text-slate-300">{record.mobile || "-"}</td>
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

export default HomeChefAttendance;