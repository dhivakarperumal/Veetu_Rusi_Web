import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, LoaderCircle, MapPin, RefreshCw, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";
import AdminAttendanceSummaryCards from "../Components/AdminAttendanceSummaryCards";
import AttendanceSessionCard from "../Components/AttendanceSessionCard";
import AttendanceDateRangeFilter, { getAttendanceDateParams, getTodayDateKey } from "../Components/AttendanceDateRangeFilter";

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

const truncateFilterLabel = (value, maxLength) => {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const DeliveryPartnerAttendance = () => {
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState(getTodayDateKey);
  const [customEndDate, setCustomEndDate] = useState(getTodayDateKey);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadAttendance = useCallback(async () => {
    try {
      const params = getAttendanceDateParams(dateFilter, customStartDate, customEndDate);
      const { data } = await api.get("/admin/delivery-partners/attendance", { params });
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load attendance records.");
      return null;
    }
  }, [dateFilter, customStartDate, customEndDate]);

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

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
    setLoading(true);
  };

  const handleCustomStartDateChange = (value) => {
    setCustomStartDate(value);
    if (customEndDate && value > customEndDate) setCustomEndDate(value);
    setCurrentPage(1);
    setLoading(true);
  };

  const handleCustomEndDateChange = (value) => {
    setCustomEndDate(value);
    setCurrentPage(1);
    setLoading(true);
  };

  const partnerOptions = [...new Map(records.map((record) => {
    const id = String(record.delivery_partner_user_id || "");
    const name = record.delivery_partner_name || "Delivery Partner";
    const value = id || `name:${name}`;
    const label = id
      ? `${truncateFilterLabel(name, 20)} (${truncateFilterLabel(id, 14)})`
      : truncateFilterLabel(name, 32);
    return [value, { value, label }];
  })).values()];
  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();
    const id = String(record.delivery_partner_user_id || "");
    const partnerKey = id || `name:${record.delivery_partner_name || "Delivery Partner"}`;
    return (partnerFilter === "all" || partnerKey === partnerFilter) &&
      (!query || `${record.delivery_partner_name || ""} ${id}`.toLowerCase().includes(query));
  });
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeSessions = records.filter((record) => !record.check_out_at).length;
  const completedSessions = records.length - activeSessions;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Delivery partners</p>
            <h1 className="mt-1 text-3xl font-black">Attendance</h1>
            <p className="mt-2 text-sm text-slate-400">Partner work sessions, locations, and check-in/check-out history for your franchise.</p>
          </div>
          <button type="button" onClick={refreshAttendance} disabled={loading} aria-label="Refresh attendance" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        <AdminAttendanceSummaryCards total={records.length} active={activeSessions} completed={completedSessions} />

        <div className="admin-reference-toolbar flex flex-col gap-4 rounded-xl p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
              placeholder="Search by delivery partner name or user ID..."
              aria-label="Search delivery partner attendance by name or user ID"
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-600/40 focus:bg-slate-900"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <AttendanceDateRangeFilter
              filter={dateFilter}
              onFilterChange={handleDateFilterChange}
              startDate={customStartDate}
              endDate={customEndDate}
              onStartDateChange={handleCustomStartDateChange}
              onEndDateChange={handleCustomEndDateChange}
            />
            <select
              value={partnerFilter}
              onChange={(event) => { setPartnerFilter(event.target.value); setCurrentPage(1); }}
              aria-label="Filter by delivery partner"
              className="w-full max-w-full truncate cursor-pointer rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 outline-none focus:border-emerald-600/40 sm:w-56"
            >
              <option value="all">All delivery partners</option>
              {partnerOptions.map((partner) => <option key={partner.value} value={partner.value}>{partner.label}</option>)}
            </select>
            <div data-admin-view-toggle role="group" aria-label="Attendance layout" className="admin-view-toggle flex rounded-xl border border-white/10 bg-slate-950/80 p-1">
              <button type="button" onClick={() => setViewMode("table")} aria-label="Table view" aria-pressed={viewMode === "table"} title="Table View" className={`rounded-lg p-2 transition ${viewMode === "table" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`}><List className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("cards")} aria-label="Card view" aria-pressed={viewMode === "cards"} title="Card View" className={`rounded-lg p-2 transition ${viewMode === "cards" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`}><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4 sm:px-6">
            <h2 className="font-extrabold">Attendance sessions</h2>
            <span className="text-sm text-slate-400">{filteredRecords.length} {filteredRecords.length === 1 ? "session" : "sessions"}</span>
          </div>
          <p className="border-b border-white/5 px-5 py-2 text-xs text-slate-500 sm:px-6">Address lookup: © OpenStreetMap contributors</p>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" /> Loading attendance</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-200">{records.length ? "No sessions match these filters." : "No check-ins for this date range."}</p>
              <p className="mt-2 text-sm text-slate-400">Sessions started by your delivery partners will appear here.</p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedRecords.map((record) => (
                <AttendanceSessionCard
                  key={record.id}
                  name={record.delivery_partner_name || "Delivery Partner"}
                  personId={record.delivery_partner_user_id}
                  date={formatDate(record.attendance_date)}
                  phone={record.mobile}
                  checkIn={record.check_in_at}
                  checkOut={record.check_out_at}
                  locations={[
                    {
                      label: "Check-in",
                      address: record.check_in_address,
                      mapUrl: record.latitude != null && record.longitude != null
                        ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}`
                        : null,
                    },
                  ]}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-260 text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-bold">Delivery partner</th>
                    <th className="px-6 py-3 font-bold">User ID</th>
                    <th className="px-6 py-3 font-bold">Checked in</th>
                    <th className="px-6 py-3 font-bold">Checked out</th>
                    <th className="px-6 py-3 font-bold">Phone</th>
                    <th className="px-6 py-3 font-bold">Locations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="transition hover:bg-white/2.5">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{record.delivery_partner_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(record.attendance_date)}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{record.delivery_partner_user_id || "-"}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <p>{new Date(record.check_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="mt-1 max-w-xs whitespace-normal text-xs leading-5 text-slate-400">{record.check_in_address || "Address unavailable for older session"}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {record.check_out_at ? (
                          <p>{new Date(record.check_out_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        ) : <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">Active</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{record.mobile || "-"}</td>
                      <td className="px-6 py-4">
                        <a href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200">
                          <MapPin size={15} /> Check-in map
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
              <p className="text-sm text-slate-400">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous page" className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button>
                <span className="min-w-24 text-center text-sm text-slate-300">Page {currentPage} of {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Next page" className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeliveryPartnerAttendance;
