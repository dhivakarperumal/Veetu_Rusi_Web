import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { FiArrowLeft, FiSave, FiUploadCloud, FiTrash2, FiHash } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import imageCompression from "browser-image-compression";
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
  images: []
};

const safeParseImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [value];
  }
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      toast.success("Processing images...");
      const imageData = await Promise.all(
        files.map((file) =>
          imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true })
            .then((compressed) => new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(compressed);
            }))
        )
      );
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...imageData] }));
      toast.success("Images ready");
    } catch (error) {
      console.error("Image upload failed", error);
      toast.error("Could not process images.");
    } finally {
      e.target.value = "";
    }
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
      images: form.images || [],
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
      instructions: item.instructions || "",
      images: safeParseImages(item.images)
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Add Chef Food</h1>
            <p className="text-sm text-slate-500 mt-2">Create and manage chef food items in the food catalog.</p>
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
          {/* Form Section */}
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Dish Details Section */}
              <div className="bg-white border-b border-slate-100 pb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FiHash size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">Food Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      required
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
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
                    <label className="text-sm font-bold text-slate-700">Food Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Biryani"
                      required
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-bold text-slate-700">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe your food item..."
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <h3 className="text-lg font-black text-slate-800 mb-5">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Cuisine Type</label>
                    <input
                      type="text"
                      value={form.cuisine}
                      onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                      placeholder="e.g., Indian, Chinese"
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Preparation Time</label>
                    <input
                      type="text"
                      value={form.prep_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, prep_time: e.target.value }))}
                      placeholder="e.g., 30 mins"
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Shelf Life (days)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.shelf_life_days}
                      onChange={(e) => setForm((prev) => ({ ...prev, shelf_life_days: e.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Dietary Tag</label>
                    <select
                      value={form.dietary_tag}
                      onChange={(e) => setForm((prev) => ({ ...prev, dietary_tag: e.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                      {dietaryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Packaging */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <FaRupeeSign className="text-emerald-600" />
                  Pricing & Packaging
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Price (₹) *</label>
                    <div className="mt-2 relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-900 font-black">₹</span>
                      <input
                        type="number"
                        value={form.mrp}
                        onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value }))}
                        placeholder="0.00"
                        required
                        className="w-full pl-10 pr-4 py-4 rounded-3xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Offer (%)</label>
                    <input
                      type="number"
                      value={form.offer}
                      onChange={(e) => setForm((prev) => ({ ...prev, offer: e.target.value }))}
                      placeholder="0"
                      className="mt-2 w-full px-5 py-4 rounded-3xl border border-slate-200 text-sm font-bold text-amber-600 focus:outline-none focus:border-amber-500 bg-amber-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Final Price (₹)</label>
                    <div className="mt-2 relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black">₹</span>
                      <input
                        type="number"
                        value={form.final_price}
                        readOnly
                        className="w-full pl-10 pr-4 py-4 rounded-3xl border border-emerald-200 text-sm font-bold text-emerald-600 bg-emerald-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Net Weight</label>
                    <input
                      type="text"
                      value={form.net_weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, net_weight: e.target.value }))}
                      placeholder="e.g., 500g"
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Packaging Type</label>
                    <select
                      value={form.packaging_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, packaging_type: e.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                      {packagingOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ingredients & Instructions */}
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Ingredients</label>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                    rows={3}
                    placeholder="List ingredients..."
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Instructions</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                    placeholder="Cooking/preparation instructions..."
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-white transition">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <FiUploadCloud className="text-slate-400 mb-2" size={32} />
                  <span className="text-sm font-bold text-slate-700">Click to upload images</span>
                  <span className="text-xs text-slate-500 mt-1">or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview */}
              {form.images && form.images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square">
                      <img src={img} alt={`Food ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white py-4 rounded-3xl font-bold transition active:scale-95"
                >
                  <FiSave />
                  {loading ? "Saving..." : editId ? "Update Food Item" : "Add Food Item"}
                </button>
              </div>
            </form>
          </div>

          {/* Food Items List Section */}
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-xl font-black text-slate-900 mb-6">Recent Items</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {foods.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No food items yet</p>
              ) : (
                foods.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">{item.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-emerald-600">₹{item.final_price || item.mrp}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{item.dietary_tag}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefFoodAdd;
