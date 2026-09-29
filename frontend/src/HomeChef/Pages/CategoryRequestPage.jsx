import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiEdit2, FiFileText, FiImage, FiPlus, FiTrash2, FiXCircle } from "react-icons/fi";
import api from "../../api";
import toast from "react-hot-toast";
import ChefDataToolbar from "../Components/ChefDataToolbar";
import CategoryRequest from "./CategoryRequest";

const StatCard = ({ label, value, helper, icon: Icon, tone }) => (
  <div className={`rounded-2xl border p-px ${tone.border}`}>
    <div className={`flex h-full items-center gap-4 rounded-2xl p-5 ${tone.background}`}>
      <div className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${tone.icon}`}>
        <Icon size={23} />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${tone.label}`}>{label}</p>
        <p className="mt-1 text-4xl font-black leading-none text-white">{value}</p>
        <p className="mt-1 text-[10px] font-semibold text-white/35">{helper}</p>
      </div>
    </div>
  </div>
);

const statusStyles = {
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const CategoryRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [deletingRequest, setDeletingRequest] = useState(null);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/category-requests/mine");
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load category requests:", error);
      toast.error("Could not load your category requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeleteRequest = async (request) => {
    if (!window.confirm(`Delete the pending request for "${request.c_name}"?`)) return;
    setDeletingRequest(request.id);
    try {
      await api.delete(`/category-requests/${request.id}`);
      toast.success("Category request deleted.");
      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete category request.");
    } finally {
      setDeletingRequest(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "All" && request.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [request.c_name, request.category_type, request.status, request.review_note]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const pendingCount = requests.filter((request) => request.status === "Pending").length;
  const approvedCount = requests.filter((request) => request.status === "Approved").length;
  const rejectedCount = requests.filter((request) => request.status === "Rejected").length;
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-br from-[#0c1116] to-[#171a20] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Category Requests</h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-300">Track your submitted category requests and review status</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingRequest(null); setShowRequestPopup(true); }}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-emerald-700 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition hover:bg-emerald-800 sm:self-auto"
          >
            <FiPlus className="size-4" /> Add Request
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Requests" value={requests.length} helper="All submissions" icon={FiFileText} tone={{ border: "border-slate-800", background: "bg-[#13161b]", icon: "bg-gradient-to-br from-blue-600 to-cyan-700", label: "text-blue-300/80" }} />
          <StatCard label="Pending" value={pendingCount} helper="Waiting for review" icon={FiClock} tone={{ border: "border-amber-500/30", background: "bg-gradient-to-br from-[#1a1004] to-[#0a0e1a]", icon: "bg-gradient-to-br from-amber-500 to-orange-600", label: "text-amber-300/80" }} />
          <StatCard label="Approved" value={approvedCount} helper="Ready to use" icon={FiCheckCircle} tone={{ border: "border-emerald-500/30", background: "bg-gradient-to-br from-[#071a10] to-[#0a0e1a]", icon: "bg-gradient-to-br from-emerald-500 to-teal-600", label: "text-emerald-300/80" }} />
          <StatCard label="Rejected" value={rejectedCount} helper="Needs changes" icon={FiXCircle} tone={{ border: "border-rose-500/30", background: "bg-gradient-to-br from-[#1a0a0a] to-[#0a0e1a]", icon: "bg-gradient-to-br from-rose-500 to-red-600", label: "text-rose-300/80" }} />
        </div>

        <ChefDataToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search by category name, type or status..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 outline-none focus:border-emerald-500/70"><option value="All">All Statuses</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option></select>}
        />

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#101217] py-20 text-center text-sm font-bold text-slate-400">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-[#101217] py-24 text-center">
            <FiFileText className="mb-5 size-10 text-slate-600" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Requests Found</p>
            <p className="mt-2 text-xs text-slate-500">{search || statusFilter !== "All" ? "Try changing your search or status filter." : "Use Add Request to submit a category for review."}</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1418] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-220 border-collapse text-left text-sm text-slate-200">
                <thead>
                  <tr className="bg-[#0b0f12]">
                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">S No</th>
                    <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Image</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Requested</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Review Note</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRequests.map((request, index) => (
                    <tr key={request.id} className="transition-colors hover:bg-slate-900/40">
                      <td className="px-5 py-5 text-slate-400">{index + 1}</td>
                      <td className="px-5 py-4">
                        {request.image?.[0] ? (
                          <img src={request.image[0]} alt={`${request.c_name} category`} className="size-14 rounded-xl border border-slate-700 object-cover" />
                        ) : (
                          <div className="grid size-14 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-500"><FiImage size={18} /></div>
                        )}
                      </td>
                      <td className="px-6 py-5 font-black text-white">{request.c_name}</td>
                      <td className="px-6 py-5 text-slate-300">{request.category_type}</td>
                      <td className="px-6 py-5 text-slate-400">{formatDate(request.created_at)}</td>
                      <td className="px-6 py-5"><span className={`inline-block rounded-full border px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${statusStyles[request.status] || "border-slate-700 bg-slate-800 text-slate-300"}`}>{request.status}</span></td>
                      <td className="max-w-sm px-6 py-5 text-slate-400">{request.review_note || "-"}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" title={request.status === "Pending" ? "Edit request" : "Only pending requests can be edited"} disabled={request.status !== "Pending"} onClick={() => { setEditingRequest(request); setShowRequestPopup(true); }} className="rounded-lg border border-slate-700 p-2.5 text-slate-300 transition hover:border-emerald-500 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-700 disabled:hover:bg-transparent disabled:hover:text-slate-300"><FiEdit2 size={15} /></button>
                          <button type="button" title={request.status === "Pending" ? "Delete request" : "Only pending requests can be deleted"} disabled={request.status !== "Pending" || deletingRequest === request.id} onClick={() => handleDeleteRequest(request)} className="rounded-lg border border-slate-700 p-2.5 text-slate-300 transition hover:border-rose-500 hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-700 disabled:hover:bg-transparent disabled:hover:text-slate-300"><FiTrash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-800 bg-[#0f1418] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black text-white">{request.c_name}</h2>
                    <p className="mt-1 text-xs text-slate-400">{request.category_type} · {formatDate(request.created_at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusStyles[request.status] || "border-slate-700 bg-slate-800 text-slate-300"}`}>{request.status}</span>
                </div>
                {request.review_note && <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400">{request.review_note}</p>}
                <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    title={request.status === "Pending" ? "Edit request" : "Only pending requests can be edited"}
                    disabled={request.status !== "Pending"}
                    onClick={() => { setEditingRequest(request); setShowRequestPopup(true); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-700 disabled:hover:text-slate-300"
                  ><FiEdit2 /> Edit</button>
                  <button
                    type="button"
                    title={request.status === "Pending" ? "Delete request" : "Only pending requests can be deleted"}
                    disabled={request.status !== "Pending" || deletingRequest === request.id}
                    onClick={() => handleDeleteRequest(request)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-700 disabled:hover:text-slate-300"
                  ><FiTrash2 /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showRequestPopup && <CategoryRequest key={editingRequest?.id || "new"} popup request={editingRequest} onClose={() => { setShowRequestPopup(false); setEditingRequest(null); }} onSubmitted={fetchRequests} />}
    </div>
  );
};

export default CategoryRequestPage;