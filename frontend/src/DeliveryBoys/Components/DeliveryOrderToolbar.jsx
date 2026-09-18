import React from "react";
import { FiFilter, FiGrid, FiList, FiRefreshCw, FiSearch } from "react-icons/fi";

const DeliveryOrderToolbar = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search orders...",
  statusFilter,
  onStatusChange,
  statuses = [],
  viewMode,
  onViewModeChange,
  onRefresh,
  loading,
  accent = "emerald",
}) => (
  <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
    <div className="relative w-full flex-1 md:max-w-xl">
      <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={`w-full rounded-xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-${accent}-500/60`}
      />
    </div>

    <div className="flex flex-wrap items-center gap-3">
      {onStatusChange && (
        <div className="relative">
          <FiFilter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-11 appearance-none rounded-xl border border-white/10 bg-slate-900/80 py-2.5 pl-4 pr-10 text-xs font-bold uppercase tracking-widest text-slate-100 outline-none transition focus:border-emerald-500/60"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status === "All" ? "All Statuses" : status}</option>
            ))}
          </select>
        </div>
      )}

      {onViewModeChange && (
        <div className="flex items-center rounded-xl border border-white/10 bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`rounded-lg p-2 transition ${viewMode === "table" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-white"}`}
            title="Table View"
          >
            <FiList className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("card")}
            className={`rounded-lg p-2 transition ${viewMode === "card" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-white"}`}
            title="Card View"
          >
            <FiGrid className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[11px] font-black uppercase tracking-widest text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        <FiRefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Refresh
      </button>
    </div>
  </div>
);

export default DeliveryOrderToolbar;
