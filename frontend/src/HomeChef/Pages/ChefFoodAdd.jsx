import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { FiArrowLeft, FiSave, FiUploadCloud, FiTrash2, FiHash, FiLayers, FiBox } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data || {});
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
    if (!profile || !id) return;
    fetchFoodById(id);
  }, [profile, id]);

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

  const fetchFoodById = async (foodId) => {
    try {
      const res = await api.get(`/chef-foods/${foodId}`);
      const item = res.data;
      if (!item) {
        toast.error("Food item not found.");
        navigate("/chef/food/all");
        return;
      }
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
    } catch (err) {
      console.error("Failed to load food item", err);
      toast.error("Could not load food item for editing.");
      navigate("/chef/food/all");
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
      chef_user_id: profile?.user?.user_id || profile?.user?.id || profile?.user_id || profile?.id || null,
      chef_id: profile?.homeChef?.chef_id || profile?.chef_id || null,
      chef_name: profile?.homeChef?.name || profile?.name || profile?.username || null,
      chef_phone: profile?.homeChef?.mobile || profile?.phone || null,
      chef_email: profile?.homeChef?.email || profile?.email || null,
      franchise_user_id: profile?.homeChef?.created_by || profile?.homeChef?.franchise_user_id || profile?.homeChef?.created_by_user_id || profile?.created_by_user_id || profile?.created_by || null,
      franchise_id: profile?.homeChef?.franchise_id || profile?.franchise_id || null,
      franchise_name: profile?.homeChef?.franchise_name || profile?.homeChef?.created_by_name || profile?.created_by_name || null,
      franchise_email: profile?.homeChef?.franchise_email || profile?.homeChef?.created_by_email || profile?.created_by_email || null,
      franchise_phone: profile?.homeChef?.franchise_phone || profile?.homeChef?.created_by_phone || profile?.created_by_phone || null,
      created_by_user_id: profile?.user?.user_id || profile?.user?.id || profile?.user_id || profile?.id || null,
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
        resetForm();
        fetchFoods();
      } else {
        await api.post("/chef-foods", payload);
        toast.success("Food item added successfully.");
        navigate("/chef/food/all");
      }
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 p-4 md:p-8 bg-gradient-to-br from-[#0c1116] to-[#171a20] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Premium Sticky Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="p-3 bg-[#0f1216] border border-slate-800 rounded-2xl text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white">{editId ? "Edit" : "Add"} Chef Food</h1>
              <p className="text-sm text-slate-300 mt-1">Create and manage your food catalog items</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Food Details Section */}
          <div className="bg-[#111319] p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-sm relative overflow-hidden group text-slate-200">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-emerald-600">
              <FiLayers size={200} />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-900/20 text-emerald-400 rounded-xl">
                  <FiLayers size={20} />
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Food Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest ml-1">
                    Food Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-black text-white shadow-inner cursor-pointer appearance-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.catId} value={cat.name || cat.catId}>
                        {cat.name || cat.catId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Hyderabadi Biryani"
                    required
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-black text-white shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest ml-1">
                  Food Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the food, flavors and serving suggestions..."
                  required
                  className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-sm font-medium text-slate-300 shadow-inner resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Cuisine Type
                  </label>
                  <select
                    value={form.cuisine || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner cursor-pointer appearance-none"
                  >
                    <option value="">Select Cuisine</option>
                    <option>North Indian</option>
                    <option>South Indian</option>
                    <option>Chinese</option>
                    <option>Continental</option>
                    <option>Indian Fusion</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Prep Time
                  </label>
                  <input
                    type="text"
                    value={form.prep_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, prep_time: e.target.value }))}
                    placeholder="e.g., 20 mins"
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Shelf Life (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.shelf_life_days}
                    onChange={(e) => setForm((prev) => ({ ...prev, shelf_life_days: e.target.value }))}
                    placeholder="e.g., 2"
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Packaging Section */}
          <div className="bg-[#111319] p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-sm relative overflow-hidden group text-slate-200">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-amber-600">
              <FaRupeeSign size={200} />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-900/20 text-amber-400 rounded-xl">
                  <FaRupeeSign size={20} />
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Pricing & Packaging</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-black text-white shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Offer (%)
                  </label>
                  <input
                    type="number"
                    value={form.offer}
                    onChange={(e) => setForm((prev) => ({ ...prev, offer: e.target.value }))}
                    placeholder="0"
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-amber-500/20 transition-all text-base font-black text-amber-300 shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Final Price (₹)
                  </label>
                  <input
                    type="number"
                    value={form.final_price}
                    readOnly
                    className="w-full px-6 py-4 bg-[#0f1216] border border-emerald-500/20 rounded-3xl text-base font-black text-emerald-300 shadow-inner cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Net Weight
                  </label>
                  <input
                    type="text"
                    value={form.net_weight}
                    onChange={(e) => setForm((prev) => ({ ...prev, net_weight: e.target.value }))}
                    placeholder="e.g., 200g"
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Packaging Type
                  </label>
                  <select
                    value={form.packaging_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, packaging_type: e.target.value }))}
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner cursor-pointer appearance-none"
                  >
                    {packagingOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Dietary Tag
                  </label>
                  <select
                    value={form.dietary_tag}
                    onChange={(e) => setForm((prev) => ({ ...prev, dietary_tag: e.target.value }))}
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-bold text-white shadow-inner cursor-pointer appearance-none"
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
          </div>

          {/* Ingredients & Instructions Section */}
          <div className="bg-[#111319] p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-sm relative overflow-hidden group text-slate-200">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-blue-600">
              <FiBox size={200} />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-900/20 text-blue-400 rounded-xl">
                  <FiBox size={20} />
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Ingredients & Instructions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Ingredients
                  </label>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                    rows={4}
                    placeholder="List main ingredients..."
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-sm font-medium text-slate-300 shadow-inner resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Cooking Instructions
                  </label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                    rows={4}
                    placeholder="Step-by-step cooking instructions..."
                    className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-sm font-medium text-slate-300 shadow-inner resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-[#111319] p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-sm relative overflow-hidden group text-slate-200">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-rose-600">
              <FiUploadCloud size={200} />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-900/20 text-rose-400 rounded-xl">
                  <FiUploadCloud size={20} />
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">Food Images</h2>
              </div>

              <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-400 transition-all bg-[#0b0d10] group/upload">
                <FiUploadCloud size={40} className="text-slate-400 group-hover/upload:text-emerald-400 transition mb-3" />
                <span className="text-sm font-black text-slate-200">Click to upload images</span>
                <span className="text-xs text-slate-400 mt-1">or drag and drop (PNG, JPG up to 5MB each)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {form.images && form.images.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-200">{form.images.length} image(s) selected</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square group/image">
                        <img src={img} alt={`Food ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute inset-0 bg-rose-600/70 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition text-white"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white py-4 px-6 rounded-3xl font-black text-lg transition active:scale-95 shadow-sm"
            >
              <FiSave size={20} />
              {loading ? "Saving..." : editId ? "Update Food Item" : "Add Food Item"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 rounded-3xl border-2 border-white/10 text-slate-200 font-bold hover:bg-slate-800 transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChefFoodAdd;
