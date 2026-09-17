import React, { useState, useEffect } from "react";
import api from "../../api";
import {
    FiTruck,
    FiPlus,
    FiSearch,
    FiPhone,
    FiMail,
    FiMapPin,
    FiStar,
    FiMoreVertical,
    FiPackage,
    FiCheck,
    FiUpload,
    FiDownload,
    FiGrid,
    FiList
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AdminStatCard from "../Components/AdminStatCard";

const Dealers = () => {
    const navigate = useNavigate();
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // Mock history data
    const mockHistory = [
        { id: "#INV-2024-001", date: "2024-03-01", items: "Wedding Silk Saree x 5", amount: "₹45,000", status: "Paid" },
        { id: "#INV-2024-042", date: "2024-02-15", items: "Cotton Saree x 12", amount: "₹18,000", status: "Paid" },
        { id: "#INV-2023-118", date: "2024-01-20", items: "Linen Saree x 2", amount: "₹4,200", status: "Pending" },
    ];

    useEffect(() => {
        fetchDealers();
    }, []);

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/dealers");
            setDealers(res.data);
        } catch (error) {
            console.error("Fetch Dealers Error:", error);
            toast.error("Failed to load dealers");
        } finally {
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [viewMode, setViewMode] = useState("card");

    const filteredDealers = dealers.filter((dealer) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            !term ||
            dealer.name?.toLowerCase().includes(term) ||
            dealer.contact?.toLowerCase().includes(term) ||
            dealer.location?.toLowerCase().includes(term) ||
            dealer.email?.toLowerCase().includes(term) ||
            dealer.phone?.toLowerCase().includes(term);
        const matchesStatus = statusFilter === "All" || dealer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const verifiedDealers = dealers.filter((dealer) => dealer.status === "Verified").length;
    const pendingDealers = dealers.filter((dealer) => dealer.status === "Pending").length;

    const handleContact = (dealer) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 800)),
            {
                loading: `Opening secure chat with ${dealer.name}...`,
                success: `Connected to ${dealer.contact}!`,
                error: 'Connection failed',
            }
        );
    };

    const handleViewHistory = (dealer) => {
        setSelectedDealer(dealer);
        setShowHistory(true);
    };

    const handleImportExcel = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                toast.loading(`Importing ${file.name}...`);
                setTimeout(() => {
                    toast.dismiss();
                    toast.success("All partners imported successfully!");
                }, 1500);
            }
        };
        input.click();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Premium": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Verified": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Pending": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-100 text-gray-500 border-gray-100";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dealer Partnerships</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized dealer & distributor network</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={handleImportExcel}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-slate-700 px-5 py-3.5 rounded-xl font-bold transition-all hover:bg-gray-50 active:scale-95 shadow-sm text-xs uppercase tracking-wider"
                    >
                        <FiUpload className="text-blue-500" /> Import Partners
                    </button>

                    <button
                        onClick={() => navigate("/admin/dealers/add")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95"
                    >
                        <FiPlus /> New Partnership
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <AdminStatCard label="Total Dealers" value={dealers.length} description="All registered dealer partners" icon={FiTruck} iconGradient="linear-gradient(135deg,#3B82F6 0%,#2563EB 100%)" glow="rgba(59,130,246,0.22)" gradient="linear-gradient(135deg,#08172a 0%,#0a0e1a 100%)" />
                <AdminStatCard label="Verified Dealers" value={verifiedDealers} description="Approved and active partners" icon={FiCheck} iconGradient="linear-gradient(135deg,#10B981 0%,#0D9488 100%)" glow="rgba(16,185,129,0.22)" gradient="linear-gradient(135deg,#071a10 0%,#0a0e1a 100%)" />
                <AdminStatCard label="Pending Dealers" value={pendingDealers} description="Partners awaiting verification" icon={FiPackage} iconGradient="linear-gradient(135deg,#F59E0B 0%,#EA580C 100%)" glow="rgba(245,158,11,0.22)" gradient="linear-gradient(135deg,#1a1004 0%,#0a0e1a 100%)" />
            </div>

            {/* Search & Filter Toolbar */}
            <div className="admin-reference-toolbar flex flex-col md:flex-row md:items-center justify-between gap-4 superadmin-panel p-4 rounded-xl">
                <div className="relative flex-1 max-w-md w-full">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search dealers by name, contact, location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="All" className="bg-slate-900 text-white">All Status</option>
                        <option value="Verified" className="bg-slate-900 text-white">Verified</option>
                        <option value="Pending" className="bg-slate-900 text-white">Pending</option>
                        <option value="Premium" className="bg-slate-900 text-white">Premium</option>
                    </select>

                    <div data-admin-view-toggle className="admin-view-toggle flex bg-slate-950/80 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-2 rounded-lg transition ${viewMode === "card"
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "text-slate-500 hover:text-emerald-700"
                                }`}
                            title="Card View"
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-lg transition ${viewMode === "table"
                                ? "bg-white text-emerald-700 shadow-sm"
                                : "text-slate-500 hover:text-emerald-700"
                                }`}
                            title="Table View"
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content View (Table / Cards) */}
            {viewMode === "table" ? (
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0f172a] rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Dealers...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#2a3042]">
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Partner</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Rating</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Orders</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredDealers.length > 0 ? (
                                        filteredDealers.map((dealer) => (
                                            <tr key={dealer.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                                                            {dealer.image ? (
                                                                <img src={dealer.image} alt={dealer.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-black text-[#1B4D22]">{dealer.name?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{dealer.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium">ID: #{dealer.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-700">{dealer.phone || dealer.contact || 'N/A'}</p>
                                                    <p className="text-[11px] text-slate-400">{dealer.email || 'No email'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                                        <FiMapPin className="text-blue-500 shrink-0" size={13} /> {dealer.location || 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                                                        <FiStar fill="currentColor" size={13} /> {dealer.rating || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {dealer.orders || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(dealer.status)}`}>
                                                        {dealer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleContact(dealer)}
                                                            className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                        >
                                                            Contact
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/invoices/add?dealerId=${dealer.id}`)}
                                                            className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                        >
                                                            Invoice
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewHistory(dealer)}
                                                            className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                                                        >
                                                            History
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                    <FiPackage size={28} />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-700">No Dealers Found</h3>
                                                <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search or filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                /* Dealers Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white rounded-[2rem] border border-gray-100 p-6 h-80 shadow-sm">
                                <div className="flex gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-10 bg-gray-100 rounded-2xl"></div>
                                        <div className="h-10 bg-gray-100 rounded-2xl"></div>
                                    </div>
                                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))
                    ) : filteredDealers.length > 0 ? (
                        <>
                            {filteredDealers.map((dealer) => (
                                <div key={dealer.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                                                {dealer.image ? (
                                                    <img src={dealer.image} alt={dealer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <span className="text-xl font-black text-blue-600 bg-blue-50 w-full h-full flex items-center justify-center capitalize">{dealer.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{dealer.name}</h3>
                                                <span className={`mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(dealer.status)}`}>
                                                    {dealer.status}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toast.error("Quick actions not configured yet.")}
                                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                        >
                                            <FiMoreVertical />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col items-center">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Rating</p>
                                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                    <FiStar fill="currentColor" /> {dealer.rating}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col items-center">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Orders</p>
                                                <div className="flex items-center gap-1 text-blue-600 font-bold">
                                                    <FiPackage /> {dealer.orders}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5 border-t border-gray-50 pt-4">
                                            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                                <FiMapPin className="text-blue-500" /> {dealer.location}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium overflow-hidden">
                                                <FiMail className="text-blue-500" /> <span className="truncate">{dealer.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                                <FiPhone className="text-blue-500" /> {dealer.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <button
                                            onClick={() => handleContact(dealer)}
                                            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-blue-600 transition-all border border-blue-100"
                                        >
                                            Contact
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/invoices/add?dealerId=${dealer.id}`)}
                                            className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-emerald-600 transition-all border border-emerald-100"
                                        >
                                            Invoice
                                        </button>
                                        <button
                                            onClick={() => handleViewHistory(dealer)}
                                            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-all border border-gray-100"
                                        >
                                            View History
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Invite Card */}
                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-200">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="absolute -left-10 -top-10 w-24 h-24 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                                    <FiTruck />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Expand Your Network</h3>
                                <p className="text-white/70 text-sm mb-8 px-4">Invite more dealers and manage all collections in one place.</p>
                                <button
                                    onClick={() => navigate("/admin/dealers/add")}
                                    className="w-full py-3.5 bg-white text-blue-600 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-2xl active:scale-95 transition-all"
                                >
                                    Invite Partner
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-gray-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FiPackage size={28} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">No Dealers Found</h3>
                            <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* History Modal */}
            {showHistory && selectedDealer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <FiPackage size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 italic">{selectedDealer.name}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transaction History & Invoices</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {mockHistory.map((h, i) => (
                                    <div key={i} className="group p-5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 rounded-3xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FiDownload size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{h.id}</p>
                                                <p className="text-xs text-gray-400 font-bold italic">{h.items}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-800 italic">{h.amount}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{h.date}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {h.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                            <button
                                onClick={() => {
                                    setShowHistory(false);
                                    navigate(`/admin/invoices/add?dealerId=${selectedDealer.id}`);
                                }}
                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-200"
                            >
                                Create New Invoice for Partner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dealers;
