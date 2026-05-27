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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute -top-12 -right-12 opacity-[0.03] text-emerald-600">
            <FiFilter size={180} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900">All Chef Foods</h1>
              <p className="mt-2 text-sm text-slate-500">Browse and manage every chef food item in your catalog.</p>
            </div>
            <button
              onClick={() => navigate("/chef/food/add")}
              className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-6 py-3 text-white font-bold shadow-sm hover:bg-emerald-700 transition active:scale-95"
            >
              <FaPlus /> Add New Food
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="p-3 rounded-3xl bg-slate-50 text-slate-600">
                  <FaSearch size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Search foods</p>
                  <div className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <FaSearch className="text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by food name, category, or tag"
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="flex justify-center mb-5">
                  <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-bold">Loading your chef foods...</p>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="rounded-[2.5rem] border-dashed border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 rounded-full bg-slate-100 w-16 h-16 flex items-center justify-center text-slate-400">
                  <FiFilter size={28} />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">No food items found</h2>
                <p className="text-sm text-slate-500 mb-6">
                  {search ? "Try adjusting your filters or search terms." : "Create your first chef food item to get started."}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/chef/food/add")}
                    className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-6 py-3 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    <FaPlus /> Add Food Item
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredFoods.map((item) => {
                  const firstImage = Array.isArray(item.images) ? item.images[0] : item.images;
                  return (
                    <div
                      key={item.id}
                      className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="relative h-56 overflow-hidden bg-slate-100">
                        <img
                          src={firstImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random&size=400`}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random&size=400`;
                          }}
                        />
                        <div className="absolute top-4 left-4 rounded-3xl bg-white/95 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
                          ₹{item.final_price || item.mrp || '0.00'}
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                            {item.category || 'Uncategorized'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="inline-flex items-center justify-center rounded-2xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center justify-center rounded-2xl bg-slate-100 p-2 text-rose-600 hover:bg-rose-100 transition"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 line-clamp-2">{item.name}</h2>
                          <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-3">{item.description || 'No description available.'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                          <div>
                            <p className="font-black text-slate-900">Cuisine</p>
                            <p>{item.cuisine || '-'}</p>
                          </div>
                          <div>
                            <p className="font-black text-slate-900">Prep Time</p>
                            <p>{item.prep_time || '-'}</p>
                          </div>
                          <div>
                            <p className="font-black text-slate-900">Dietary</p>
                            <p className="capitalize">{item.dietary_tag || '-'}</p>
                          </div>
                          <div>
                            <p className="font-black text-slate-900">Shelf Life</p>
                            <p>{item.shelf_life_days ? `${item.shelf_life_days} days` : '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-500">Active</span>
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="text-xs font-black text-emerald-600 hover:text-emerald-700"
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

            {filteredFoods.length > 0 && (
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm text-center text-sm text-slate-500">
                Showing <span className="font-bold text-slate-700">{filteredFoods.length}</span> of <span className="font-bold text-slate-700">{foods.length}</span> food items
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-3xl bg-emerald-50 text-emerald-700">
                  <FiFilter size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Catalog Summary</p>
                  <h2 className="text-xl font-black text-slate-900">Quick Overview</h2>
                </div>
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <span>Total foods</span>
                  <span className="font-black text-slate-900">{foods.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <span>Filtered items</span>
                  <span className="font-black text-slate-900">{filteredFoods.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <span>Search active</span>
                  <span className="font-black text-slate-900">{search ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Tips</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="rounded-3xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-900">Search smartly:</span> use category or dietary tags for faster results.
                </li>
                <li className="rounded-3xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-900">Add new food:</span> keep images and details updated for better listing quality.
                </li>
                <li className="rounded-3xl bg-slate-50 p-4">
                  <span className="font-bold text-slate-900">Edit quickly:</span> use the edit button on each card.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ChefFoodAll;
