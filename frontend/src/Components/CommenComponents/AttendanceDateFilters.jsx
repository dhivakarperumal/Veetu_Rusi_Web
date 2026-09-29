const presets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const filterAttendanceRecords = (records, filter, customDate) => {
  if (filter === "all") return records;

  const today = new Date();
  const todayKey = dateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  if (filter === "today") {
    return records.filter((record) => String(record.attendance_date || record.check_in_at || "").slice(0, 10) === todayKey);
  }
  if (filter === "yesterday") {
    return records.filter((record) => String(record.attendance_date || record.check_in_at || "").slice(0, 10) === yesterdayKey);
  }
  if (filter === "custom") {
    return customDate
      ? records.filter((record) => String(record.attendance_date || record.check_in_at || "").slice(0, 10) === customDate)
      : [];
  }
  if (filter === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekStartKey = dateKey(weekStart);
    return records.filter((record) => {
      const recordDate = String(record.attendance_date || record.check_in_at || "").slice(0, 10);
      return recordDate >= weekStartKey && recordDate <= todayKey;
    });
  }
  if (filter === "month") {
    const monthKey = todayKey.slice(0, 7);
    return records.filter((record) => String(record.attendance_date || record.check_in_at || "").slice(0, 7) === monthKey);
  }
  return records;
};

const AttendanceDateFilters = ({ filter, customDate, onFilterChange, onCustomDateChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div role="group" aria-label="Filter attendance by date" className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-950 p-1">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          aria-pressed={filter === preset.id}
          onClick={() => onFilterChange(preset.id)}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === preset.id ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
        >
          {preset.label}
        </button>
      ))}
    </div>
    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300">
      <span>Custom date</span>
      <input
        type="date"
        value={customDate}
        onChange={(event) => onCustomDateChange(event.target.value)}
        aria-label="Choose attendance date"
        className="min-w-0 bg-transparent text-white outline-none scheme-dark"
      />
    </label>
  </div>
);

export default AttendanceDateFilters;