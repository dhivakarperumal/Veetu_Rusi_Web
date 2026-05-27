import React, { useState, useEffect } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const ChefFoodAll = () => {
  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
    try {
      await api.delete(`/chef-foods/${id}`);
      toast.success("Food item deleted successfully.");
      fetchFoods();
    } catch (err) {
      console.error("Failed to delete food item", err);
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  const filteredFoods = foods.filter((item) => {
    const lowerSearch = search.trim().toLowerCase();
    if (!lowerSearch) return true;
    return [item.name, item.category, item.description, item.dietary_tag]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(lowerSearch));
  });

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900">All Chef Foods</h1>
            <p className="text-sm text-slate-500 mt-2">Manage and view all your chef food catalog items.</p>
          </div>
          <button
            onClick={() => navigate("/chef/food/add")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition active:scale-95"
          >
            <FaPlus /> Add New Food
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white rounded-4xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FaSearch className="text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or dietary tag..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="rounded-4xl border border-slate-200 bg-white p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-500 font-bold">Loading chef food items...</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="rounded-4xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="text-slate-400 mb-3">
              <FiFilter size={40} className="mx-auto opacity-50" />
            </div>
            <p className="text-slate-600 font-bold mb-2">
              {search ? "No food items match your search." : "No food items yet."}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {search ? "Try adjusting your search terms." : "Create your first food item to get started."}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/chef/food/add")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
              >
                <FaPlus /> Add Food Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFoods.map((item) => {
              const firstImage = Array.isArray(item.images) ? item.images[0] : item.images;
              return (
                <div
                  key={item.id}
                  className="rounded-4xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group"
                >
                  {/* Image Section */}
                  <div className="h-56 overflow-hidden bg-slate-100 relative">
                    <img
                      src={firstImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random&size=400`}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random&size=400`;
                      }}
                    />
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-md">
                      <span className="text-lg font-black text-emerald-600">₹{item.final_price || item.mrp || '0.00'}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    {/* Category & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        {item.category || 'Uncategorized'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition active:scale-90"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-90"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-black text-slate-900 mb-3 line-clamp-2">{item.name}</h2>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 mb-4">
                      {item.description || 'No description added.'}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
                      <div className="text-xs">
                        <span className="text-slate-500">Cuisine</span>
                        <p className="text-sm font-bold text-slate-900">{item.cuisine || '-'}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Prep Time</span>
                        <p className="text-sm font-bold text-slate-900">{item.prep_time || '-'}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Dietary</span>
                        <p className="text-sm font-bold text-slate-900 capitalize">{item.dietary_tag || '-'}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Shelf Life</span>
                        <p className="text-sm font-bold text-slate-900">
                          {item.shelf_life_days ? `${item.shelf_life_days} days` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-slate-500">Active</span>
                      </div>
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                      >
                        Edit Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {filteredFoods.length > 0 && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Showing <span className="font-bold text-slate-700">{filteredFoods.length}</span> of{' '}
            <span className="font-bold text-slate-700">{foods.length}</span> food items
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefFoodAll;
