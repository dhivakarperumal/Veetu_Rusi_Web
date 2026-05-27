import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

const ChefFoodAll = () => {
  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredFoods = foods.filter((item) => {
    const lowerSearch = search.trim().toLowerCase();
    if (!lowerSearch) return true;
    return [item.name, item.category, item.description, item.dietary_tag]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(lowerSearch));
  });

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">All Chef Foods</h1>
            <p className="text-sm text-slate-500 mt-2">Browse every food item stored in your chef food table.</p>
          </div>
          <div className="w-full max-w-sm">
            <label className="block text-sm font-bold text-slate-700">Search Foods</label>
            <div className="mt-2 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category or tag"
                className="w-full rounded-3xl border border-slate-200 bg-white px-12 py-4 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="rounded-4xl border border-slate-200 bg-white p-12 text-center text-slate-500">Loading chef food items...</div>
          ) : filteredFoods.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">No food items found. Add new food items from the add page.</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredFoods.map((item) => {
                const firstImage = Array.isArray(item.images) ? item.images[0] : item.images;
                return (
                  <div key={item.id} className="rounded-4xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-60 overflow-hidden bg-slate-100">
                      <img
                        src={firstImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random`}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Chef Food')}&background=random`; }}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{item.category || 'Uncategorized'}</span>
                        <span className="text-sm font-black text-slate-900">₹{item.final_price || item.mrp || '0.00'}</span>
                      </div>
                      <h2 className="mt-4 text-2xl font-black text-slate-900">{item.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{item.description || 'No description added.'}</p>
                      <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-500">
                        <div><span className="font-bold text-slate-700">Cuisine:</span> {item.cuisine || '-'}</div>
                        <div><span className="font-bold text-slate-700">Dietary:</span> {item.dietary_tag || '-'}</div>
                        <div><span className="font-bold text-slate-700">Prep:</span> {item.prep_time || '-'}</div>
                        <div><span className="font-bold text-slate-700">Shelf Life:</span> {item.shelf_life_days ? `${item.shelf_life_days} days` : '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChefFoodAll;
