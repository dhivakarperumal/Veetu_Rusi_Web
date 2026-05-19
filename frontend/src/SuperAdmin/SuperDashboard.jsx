import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../PrivateRouter/AuthContext";
import { useAdmin } from "../PrivateRouter/AdminContext";
import api from "../api";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
    FiTrendingUp,
    FiActivity,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiShoppingBag,
    FiUsers,
    FiBox,
    FiMoreVertical,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiMapPin
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { dashboardData, setDashboardCached } = useAdmin();
    const [loading, setLoading] = useState(!dashboardData);

    // Quick Add Modals State
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [catName, setCatName] = useState("");
    const [catSaving, setCatSaving] = useState(false);
    const [catImage, setCatImage] = useState(null);

    // Rapid Product Modal
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [prodSaving, setProdSaving] = useState(false);
    const [rapidProd, setRapidProd] = useState({ name: "", mrp: "", status: "Active" });

    const handleRapidProductAdd = async (e, shouldContinue = false) => {
        if (e) e.preventDefault();
        if (!rapidProd.name || !rapidProd.mrp) return toast.error("Name and MRP are required");

        setProdSaving(true);
        try {
            await api.post("/products", { 
                ...rapidProd, 
                category: "Saree", // Default for rapid add
                total_stock: "0",
                variants: []
            });
            toast.success("Product listed instantly!");
            if (shouldContinue) {
                setRapidProd({ name: "", mrp: "", status: "Active" });
            } else {
                setIsProdModalOpen(false);
                setRapidProd({ name: "", mrp: "", status: "Active" });
            }
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add product");
        } finally {
            setProdSaving(false);
        }
    };

    const handleQuickCategoryAdd = async (e, shouldContinue = false) => {
        if (e) e.preventDefault();
        if (!catName) return toast.error("Category name is required");

        setCatSaving(true);
        try {
            // For a rapid add, we just send name and empty array for images if none provided
            await api.post("/categories", { name: catName, images: catImage ? [catImage] : [], subcategory: [] });
            toast.success("Category added instantly!");

            if (shouldContinue) {
                setCatName("");
                setCatImage(null);
            } else {
                setIsCatModalOpen(false);
                setCatName("");
                setCatImage(null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add category");
        } finally {
            setCatSaving(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        if (!dashboardData) setLoading(true);
        try {
            const response = await api.get('/dashboard');
            setDashboardCached(response.data);
        } catch (error) {
            console.error("Fetch Dashboard Error:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Delivered": return "bg-emerald-100 text-emerald-700";
            case "Out for Delivery": return "bg-cyan-100 text-cyan-700";
            case "Shipping": return "bg-amber-100 text-amber-700";
            case "Packing": return "bg-indigo-100 text-indigo-700";
            case "Order Placed": return "bg-blue-100 text-blue-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatIcon = (label) => {
        switch (label) {
            case "Total Revenue": return <FaRupeeSign />;
            case "Active Orders": return <FiShoppingBag />;
            case "Low Stock": return <FiAlertTriangle />;
            case "Total Products": return <FiBox />;
            default: return <FiActivity />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 h-[60vh]">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-[10px]">Loading Dashboard...</p>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No data available</p>
            </div>
        )
    }

    const { stats, recentOrders, topProducts, lowStockAlerts, categoryAnalytics } = dashboardData;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <Toaster position="top-right" />

            {/* Quick Productivity Actions */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase italic">Boutique Rapid Studio</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <button
                            onClick={() => setIsProdModalOpen(true)}
                            className="bg-white hover:bg-blue-50 text-slate-900 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 group/btn"
                        >
                            <FiBox className="group-hover:rotate-12 transition-transform" /> Add Product
                        </button>
                        <button
                            onClick={() => setIsCatModalOpen(true)}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
                        >
                            <FiActivity /> New Category
                        </button>
                        <button
                            onClick={() => navigate("/admin/users/all")}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
                        >
                            <FiUsers /> Add User
                        </button>
                    </div>
                </div>
            </div>

            <Toaster position="top-right" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                                {getStatIcon(stat.label)}
                            </div>
                            <span className={`text-[10px] font-black ${stat.trend.startsWith('+') ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 bg-gray-50'} px-2.5 py-1 rounded-lg border border-transparent group-hover:border-current transition-all uppercase tracking-widest`}>
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stat.value?.toString().replace('$', '₹')}</h3>
                    </div>
                ))}
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Analytics */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Revenue Trends</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Last 6 Months Performance</p>
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                            {['Month', 'Year'].map((t) => (
                                <button key={t} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${t === 'Month' ? 'bg-white text-blue-600 shadow-sm shadow-blue-100' : 'text-gray-400 hover:text-slate-800'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between px-2 sm:px-4 gap-2 sm:gap-3 relative before:absolute before:left-4 before:right-4 before:bottom-0 before:h-[1px] before:bg-gray-100">
                        {(dashboardData.revenueTrends && dashboardData.revenueTrends.length > 0) ? (
                             dashboardData.revenueTrends.map((point, i) => {
                                 // Calculate relative height based on max value in trending data
                                 const revenues = dashboardData.revenueTrends.map(p => p.revenue);
                                 const maxRev = Math.max(...revenues, 1); // Avoid division by zero
                                 const h = (point.revenue / maxRev) * 100;
                                 
                                 return (
                                     <div key={i} className={`flex-1 h-full flex items-end group relative`}>
                                         <div
                                             className={`w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-lg sm:rounded-t-xl transition-all duration-1000 group-hover:brightness-110 group-hover:shadow-lg group-hover:shadow-blue-100 cursor-pointer`}
                                             style={{ height: `${Math.max(5, h)}%` }} // Minimum height for 0 values
                                         >
                                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                 ₹{(point.revenue / 1000).toFixed(1)}k
                                             </div>
                                         </div>
                                         <span className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-tighter text-gray-400`}>
                                             {point.month}
                                         </span>
                                     </div>
                                 )
                             })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Awaiting sales trends data...</p>
                            </div>
                        )}
                    </div>
                    <div className="pt-2"></div>
                </div>

                {/* Performance Doughnut */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col items-center">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 w-full">Sales Distribution</h3>
                    <div className="relative flex-1 flex flex-col items-center justify-center w-full">
                        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                            {(() => {
                                const cats = dashboardData.categoryAnalytics || [];
                                const firstPct = cats[0]?.pct || 0;
                                const secondPct = cats[1]?.pct || 0;
                                const totalPct = Math.min(100, cats.reduce((acc, c) => acc + (c.pct || 0), 0));
                                
                                // SVG circumference is ~220 for r=35
                                const firstOffset = 220 * (1 - firstPct / 100);
                                const secondOffset = 220 * (1 - (firstPct + secondPct) / 100);
                                
                                return (
                                    <>
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="50%" cy="50%" r="35%" stroke="#f8fafc" strokeWidth="15%" fill="transparent" />
                                            {/* Top segment */}
                                            <circle cx="50%" cy="50%" r="35%" stroke="#3b82f6" strokeWidth="15%" fill="transparent" strokeDasharray="220" strokeDashoffset={firstOffset} strokeLinecap="round" className="transition-all duration-1000" />
                                            {/* Second segment (starts where first ends) */}
                                            {secondPct > 0 && (
                                                <circle cx="50%" cy="50%" r="35%" stroke="#818cf8" strokeWidth="15%" fill="transparent" strokeDasharray="220" strokeDashoffset={secondOffset} strokeLinecap="round" className="transition-all duration-1000" />
                                            )}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efficiency</p>
                                            <p className="text-xl sm:text-2xl font-black text-slate-800">{totalPct}%</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full mt-12 pb-2">
                            {dashboardData.categoryAnalytics?.slice(0, 2).map((cat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 ${i === 0 ? 'bg-blue-500' : 'bg-indigo-400'} rounded-full`}></span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[80px]">{cat.name}</p>
                                    </div>
                                    <p className="text-lg font-black text-slate-700">{cat.pct}%</p>
                                </div>
                            ))}
                            {(!dashboardData.categoryAnalytics || dashboardData.categoryAnalytics.length === 0) && (
                                <p className="col-span-2 text-center text-[10px] font-black text-gray-300 uppercase italic">Awaiting distribution...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products & Categories Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Top Selling Products</h3>
                            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-1">Highest converting items</p>
                        </div>
                        <FiTrendingUp className="text-emerald-500 text-2xl" />
                    </div>
                    <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
                        {topProducts.length > 0 ? topProducts.map((item, i) => (
                            <div key={i} className="p-6 flex items-center gap-6 group hover:bg-gray-50/50 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">{item.cat}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-slate-800">{item.rev?.toString().replace('$', '₹')}</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                                        {item.sales} sold
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-6 text-center text-sm text-gray-500">No top products found yet.</div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-50 text-center">
                        <button className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Generate Inventory Report</button>
                    </div>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Category Analytics</h3>
                            <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Revenue by Saree Type</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <FiActivity />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {categoryAnalytics.length > 0 ? categoryAnalytics.map((cat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800">{cat.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.items}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-800">{cat.rev?.toString().replace('$', '₹')}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{cat.pct}% Efficiency</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                    <div
                                        className={`h-full ${cat.color} rounded-full transition-all duration-1000 shadow-sm`}
                                        style={{ width: `${cat.pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-center text-gray-500">No category sales data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inventory Alerts & Geographic Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Low Stock Alerts */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Low Stock Alerts</h3>
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mt-1">Priority Restock Needed</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center animate-pulse">
                            <FiAlertTriangle />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 flex-1">
                        {lowStockAlerts.length > 0 ? lowStockAlerts.map((item, i) => (
                            <div key={i} className="p-6 flex items-center gap-6 group hover:bg-red-50/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.cat}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-black ${item.color}`}>{item.stock} Left</p>
                                    <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 hover:underline">Purchase Order</button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-6 text-center text-sm text-gray-500">No low stock alerts.</div>
                        )}
                    </div>
                </div>

                {/* Regional Geographic Sales */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Regional Sales Map</h3>
                            <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Geographic Distribution</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            <FiMapPin /> Global Reach
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            {(dashboardData.regionalSales && dashboardData.regionalSales.length > 0) ? dashboardData.regionalSales.map((loc, i) => (
                                <div key={i} className="space-y-2 group">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{loc.state}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{loc.orders} Orders</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-800">{loc.rev}</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                        <div
                                            className={`h-full ${loc.color} rounded-full transition-all duration-1000 shadow-sm`}
                                            style={{ width: `${loc.pct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Awaiting regional data...</p>
                                </div>
                            )}
                        </div>
                        {/* Map Visualization Placeholder */}
                        <div className="bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-center p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f610_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="text-center relative z-10">
                                <div className="w-20 h-20 bg-white shadow-xl shadow-blue-100/50 rounded-full flex items-center justify-center text-3xl text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform cursor-pointer">
                                    🌍
                                </div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Interactive Map</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-[150px] leading-relaxed">Zoom to view city-level sales data</p>
                            </div>
                            {/* Animated dots for "live" locations */}
                            <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-700"></div>
                            <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-1000"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recent Orders</h3>
                        <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Real-time Activity</p>
                    </div>
                    <button className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-[10px] font-black text-gray-500 rounded-xl uppercase tracking-widest transition-all">View All Orders</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                                <tr key={i} className="group hover:bg-blue-50/10 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-slate-400 border border-gray-100 group-hover:border-blue-100 group-hover:text-blue-500 transition-all uppercase">
                                                {order.customer.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{order.customer}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{order.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-500 truncate max-w-[150px]">{order.product}</td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-800">{order.amount?.toString().replace('$', '₹')}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="flex items-center justify-end gap-1.5 text-[10px] font-black text-gray-300 group-hover:text-blue-400 transition-all uppercase">
                                            <FiClock /> {order.date}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-6 text-center text-sm text-gray-500">
                                        No recent orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* QUICK PRODUCT MODAL */}
            {isProdModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProdModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-blue-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><FiBox size={80} /></div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Rapid Product</h2>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">AJAX Listing Console</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                                        placeholder="e.g. Silk Saree"
                                        value={rapidProd.name}
                                        onChange={(e) => setRapidProd({ ...rapidProd, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Market MRP</label>
                                    <div className="relative">
                                        <FaRupeeSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                                            placeholder="2999"
                                            value={rapidProd.mrp}
                                            onChange={(e) => setRapidProd({ ...rapidProd, mrp: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={(e) => handleRapidProductAdd(e, true)}
                                    disabled={prodSaving}
                                    className="w-full py-5 bg-white border-2 border-blue-100 hover:bg-blue-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    List & Add Another
                                </button>
                                <button
                                    onClick={(e) => handleRapidProductAdd(e, false)}
                                    disabled={prodSaving}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                >
                                    {prodSaving ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div> : "Finalize & Close"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsProdModalOpen(false)}
                                className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-slate-800 uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUICK CATEGORY MODAL */}
            {isCatModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCatModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><FiActivity size={80} /></div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Rapid Category</h2>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Instant AJAX Creation</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/20 rounded-2xl outline-none font-bold text-slate-800 transition-all"
                                    placeholder="e.g. Traditional Silk"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={(e) => handleQuickCategoryAdd(e, true)}
                                    disabled={catSaving}
                                    className="w-full py-5 bg-white border-2 border-blue-100 hover:bg-blue-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Create & Add Another
                                </button>
                                <button
                                    onClick={(e) => handleQuickCategoryAdd(e, false)}
                                    disabled={catSaving}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                >
                                    {catSaving ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div> : "Save & Close"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCatModalOpen(false)}
                                className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-slate-800 uppercase tracking-widest transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

