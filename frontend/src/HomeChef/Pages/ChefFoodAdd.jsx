import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

const initialForm = {
  category: "",
  name: "",
  description: "",
  cuisine: "",
  prep_time: "",
  shelf_life_days: "",
  mrp: "",
  offer: "",
  final_price: "",
  dietary_tag: "veg",
  net_weight: "",
  packaging_type: "Pouch",
  ingredients: "",
  instructions: "",
};

const dietaryOptions = ["veg", "non-veg", "vegan", "contains egg"];
const packagingOptions = ["Pouch", "Box", "Foil"];

const ChefFoodAdd = () => {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

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
    fetchCategories();
    fetchFoods();
  }, [profile]);

  useEffect(() => {
    const mrp = parseFloat(form.mrp) || 0;
    const offer = parseFloat(form.offer) || 0;
    const computed = mrp - mrp * (offer / 100);
    setForm((prev) => ({ ...prev, final_price: computed > 0 ? computed.toFixed(2) : "0.00" }));
  }, [form.mrp, form.offer]);

  const fetchCategories = async () => {
    try {
      const params = {};
      if (profile?.user_id || profile?.id) params.chef_user_id = profile.user_id || profile.id;
      const res = await api.get("/chef-food-categories", { params });
      setCategories(Array.isArray(res.data) ? res.data : []);
      if (!form.category && Array.isArray(res.data) && res.data.length > 0) {
        setForm((prev) => ({ ...prev, category: res.data[0].name || "" }));
      }
    } catch (err) {
      console.error("Failed to load food categories", err);
      toast.error("Could not load your categories.");
    }
  };

  const fetchFoods = async () => {
    try {
      const params = {};
      if (profile?.user_id || profile?.id) params.chef_user_id = profile.user_id || profile.id;
      const res = await api.get("/chef-foods", { params });
      setFoods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load chef food items", err);
      toast.error("Could not load food items.");
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.name || !form.description || !form.mrp) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      shelf_life_days: form.shelf_life_days ? Number(form.shelf_life_days) : null,
      mrp: Number(form.mrp),
      offer: Number(form.offer) || 0,
      final_price: Number(form.final_price) || null,
      chef_user_id: profile?.user_id || profile?.id || null,
      chef_id: profile?.chef_id || null,
      chef_name: profile?.name || profile?.username || null,
      chef_phone: profile?.phone || null,
      chef_email: profile?.email || null,
      franchise_user_id: profile?.created_by_user_id || null,
      franchise_id: profile?.franchise_id || null,
      franchise_name: profile?.created_by_name || null,
      franchise_email: profile?.created_by_email || null,
      franchise_phone: profile?.created_by_phone || null,
      created_by_user_id: profile?.user_id || profile?.id || null,
      created_by_name: profile?.name || profile?.username || null,
      created_by_email: profile?.email || null,
      created_by_phone: profile?.phone || null,
      status: "Active"
    };

    try {
      if (editId) {
        await api.put(`/chef-foods/${editId}`, payload);
        toast.success("Food item updated successfully.");
      } else {
        await api.post("/chef-foods", payload);
        toast.success("Food item added successfully.");
      }
      resetForm();
      fetchFoods();
    } catch (err) {
      console.error("Chef food save failed", err);
      toast.error(err.response?.data?.message || "Failed to save food item.");
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setForm({
      category: item.category || "",
      name: item.name || "",
      description: item.description || "",
      cuisine: item.cuisine || "",
      prep_time: item.prep_time || "",
      shelf_life_days: item.shelf_life_days?.toString() || "",
      mrp: item.mrp?.toString() || "",
      offer: item.offer?.toString() || "",
      final_price: item.final_price?.toString() || "",
      dietary_tag: item.dietary_tag || "veg",
      net_weight: item.net_weight || "",
      packaging_type: item.packaging_type || "Pouch",
      ingredients: item.ingredients || "",
      instructions: item.instructions || ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this food item?")) return;
    try {
      await api.delete(`/chef-foods/${id}`);
      toast.success("Food item deleted.");
      fetchFoods();
    } catch (err) {
      console.error("Failed to delete food item", err);
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Add Chef Food</h1>
            <p className="text-sm text-slate-500 mt-2">Create and manage chef food items in the new food catalog.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
          >
            <FaPlus /> New Food Item
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.catId} value={cat.name || cat.catId}>
                        {cat.name || cat.catId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Food Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Food Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Cuisine</label>
                  <input
                    type="text"
                    value={form.cuisine}
                    onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Preparation Time</label>
                  <input
                    type="text"
                    value={form.prep_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, prep_time: e.target.value }))}
                    placeholder="e.g. 30 mins"
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Shelf Life (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.shelf_life_days}
                    onChange={(e) => setForm((prev) => ({ ...prev, shelf_life_days: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">MRP</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.mrp}
                    onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Offer (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.offer}
                    onChange={(e) => setForm((prev) => ({ ...prev, offer: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Final Price</label>
                  <input
                    type="number"
                    value={form.final_price}
                    onChange={(e) => setForm((prev) => ({ ...prev, final_price: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Dietary Tag</label>
                  <select
                    value={form.dietary_tag}
                    onChange={(e) => setForm((prev) => ({ ...prev, dietary_tag: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  >
                    {dietaryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Net Weight</label>
                  <input
                    type="text"
                    value={form.net_weight}
                    onChange={(e) => setForm((prev) => ({ ...prev, net_weight: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Packaging Type</label>
                  <select
                    value={form.packaging_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, packaging_type: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                  >
                    {packagingOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Ingredients</label>
                <textarea
                  value={form.ingredients}
                  onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-3xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editId ? 'Update Food' : 'Create Food'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Your Food Items</h2>
                <p className="text-sm text-slate-500 mt-2">Manage your chef food records with edit and delete.</p>
              </div>
            </div>
            {foods.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
                No food items yet. Add one with the form on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {foods.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.category}</p>
                        <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-2xl border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                      <div><span className="font-bold text-slate-700">Cuisine:</span> {item.cuisine || '-'}</div>
                      <div><span className="font-bold text-slate-700">Prep Time:</span> {item.prep_time || '-'}</div>
                      <div><span className="font-bold text-slate-700">Shelf Life:</span> {item.shelf_life_days || '-'} days</div>
                      <div><span className="font-bold text-slate-700">Price:</span> ₹{item.final_price || item.mrp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefFoodAdd;
