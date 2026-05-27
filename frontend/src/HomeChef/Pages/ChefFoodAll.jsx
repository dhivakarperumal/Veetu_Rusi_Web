import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiBox,
  FiPackage,
  FiGrid,
  FiList,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const ChefFoodAll = () => {
  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "low stock":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "out of stock":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getFoodImage = (item) => {
    try {
      if (item.images) {
        const imgs = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
      }
    } catch (e) {
      console.error("Error parsing images", e);
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "Chef Food")}&background=random&size=400`;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data?.user || {});
      } catch (err) {
        console.warn("Failed to load profile", err);
        setProfile(JSON.parse(localStorage.getItem("user") || "{}"));
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchFoods();
  }, [profile]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const params = {};
      if (profile?.user_id || profile?.id) params.chef_user_id = profile.user_id || profile.id;
      const res = await api.get("/chef-foods", { params });
      setFoods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load chef foods", err);
      toast.error("Could not load chef food items.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/chef/food/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this food item?")) return;
    setDeleting(true);
    try {
      await api.delete(`/chef-foods/${id}`);
      toast.success("Food item deleted successfully.");
      fetchFoods();
    } catch (err) {
      console.error("Failed to delete food item", err);
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredFoods = foods.filter((item) => {
    const lowerSearch = search.trim().toLowerCase();
    if (!lowerSearch) return true;
    return [item.name, item.category, item.description, item.dietary_tag]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(lowerSearch));
  });

  const activeCount = foods.filter((item) => (item.status || "").toLowerCase() === "active").length;
  const lowStockCount = foods.filter((item) => (item.status || "").toLowerCase() === "low stock").length;
  const outOfStockCount = foods.filter((item) => (item.status || "").toLowerCase() === "out of stock").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">My Foods</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
              Manage your listed food items and inventory
            </p>
          </div>
          <button
            onClick={() => navigate("/chef/food/add")}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
          >
            <FiPlus className="w-4 h-4" /> Add Food
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="relative overflow-hidden group rounded-2xl p-px bg-linear-to-br from-blue-500/30 via-cyan-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
            <div className="relative bg-linear-to-br from-[#0f1628] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-blue-700/40">
                <FiBox className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-blue-300/70 font-black uppercase tracking-[0.2em]">Total Foods</p>
                <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{foods.length}</h4>
                <p className="text-[10px] text-white/25 font-semibold mt-1">Your listings</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden group rounded-2xl p-px bg-linear-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
            <div className="relative bg-linear-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">Active</p>
                <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{activeCount}</h4>
                <p className="text-[10px] text-white/25 font-semibold mt-1">Available to sell</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden group rounded-2xl p-px bg-linear-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
            <div className="relative bg-linear-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
                <FiAlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">Low Stock</p>
                <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{lowStockCount}</h4>
                <p className="text-[10px] text-white/25 font-semibold mt-1">Need refill soon</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden group rounded-2xl p-px bg-linear-to-br from-rose-500/40 via-red-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
            <div className="relative bg-linear-to-br from-[#1a0a0a] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/40">
                <FiXCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-rose-300/70 font-black uppercase tracking-[0.2em]">Out of Stock</p>
                <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{outOfStockCount}</h4>
                <p className="text-[10px] text-white/25 font-semibold mt-1">Unavailable</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, category or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Table View"
              >
                <FiList size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Grid View"
              >
                <FiGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          filteredFoods.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Food Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredFoods.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                              <img
                                src={getFoodImage(item)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-1">
                                {item.product_code || `FOD-${item.id}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${getStatusStyle(item.status)}`}>
                            {item.status || "Active"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-700">
                            <FiPackage className="text-gray-300" size={14} />
                            <span className="text-sm font-black">{item.total_stock ?? item.stock ?? 0}</span>
                            <span className="text-[10px] text-gray-400 font-bold">Units</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-800">₹{parseFloat(item.final_price ?? item.mrp ?? 0).toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 line-through font-bold">₹{parseFloat(item.mrp ?? item.final_price ?? 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deleting}
                              className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deleting ? <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin" /> : <FiTrash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-2xl border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                <FiBox size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Foods Found</p>
              <p className="text-slate-300 font-bold text-[10px] mt-2 italic px-8">
                {search ? `"${search}" did not match any foods.` : 'You have not added any food items yet.'}
              </p>
            </div>
          )
        ) : (
          filteredFoods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all flex flex-col">
                  <div className="relative aspect-4/5 overflow-hidden bg-gray-100">
                    <img
                      src={getFoodImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md pointer-events-auto shadow-sm ${getStatusStyle(item.status)}`}>
                        {item.status || "Active"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">{item.category || 'Uncategorized'}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                      <span className="text-base font-black text-slate-800">₹{parseFloat(item.final_price ?? item.mrp ?? 0).toLocaleString()}</span>
                      <span className="text-[10px] font-black text-gray-400">Stock: {item.total_stock ?? item.stock ?? 0}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="flex-1 p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting}
                        className="flex-1 p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-2xl border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                <FiBox size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Foods Found</p>
              <p className="text-slate-300 font-bold text-[10px] mt-2 italic px-8">
                {search ? `"${search}" did not match any foods.` : 'You have not added any food items yet.'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChefFoodAll;
