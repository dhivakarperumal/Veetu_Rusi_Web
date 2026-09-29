const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateKey = () => toDateKey(new Date());

export const getAttendanceDateParams = (filter, customStartDate, customEndDate) => {
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (filter === "yesterday") {
    const yesterdayKey = toDateKey(yesterday);
    return { date_from: yesterdayKey, date_to: yesterdayKey };
  }
  if (filter === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return { date_from: toDateKey(weekStart), date_to: todayKey };
  }
  if (filter === "month") {
    return { date_from: `${todayKey.slice(0, 7)}-01`, date_to: todayKey };
  }
  if (filter === "year") {
    return { date_from: `${today.getFullYear()}-01-01`, date_to: todayKey };
  }
  if (filter === "custom") {
    return {
      ...(customStartDate ? { date_from: customStartDate } : {}),
      ...(customEndDate ? { date_to: customEndDate } : {}),
    };
  }
  return { date_from: todayKey, date_to: todayKey };
};

const AttendanceDateRangeFilter = ({ filter, onFilterChange, startDate, endDate, onStartDateChange, onEndDateChange }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
    <select
      value={filter}
      onChange={(event) => onFilterChange(event.target.value)}
      aria-label="Filter attendance by date range"
      className="w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 outline-none focus:border-emerald-600/40 sm:w-auto"
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="week">This week</option>
      <option value="month">This month</option>
      <option value="year">This year</option>
      <option value="custom">Custom date range</option>
    </select>
    {filter === "custom" && (
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-400">From</span>
          <input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} aria-label="Start date" className="scheme-dark min-w-0 bg-transparent text-sm text-white outline-none" />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-400">To</span>
          <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => onEndDateChange(event.target.value)} aria-label="End date" className="scheme-dark min-w-0 bg-transparent text-sm text-white outline-none" />
        </label>
      </div>
    )}
  </div>
);

export default AttendanceDateRangeFilter;