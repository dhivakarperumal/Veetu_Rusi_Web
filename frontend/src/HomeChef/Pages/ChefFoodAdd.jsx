import { useState, useEffect, useMemo } from "react";
import { FiArrowLeft, FiUploadCloud } from "react-icons/fi";
import imageCompression from "browser-image-compression";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const initialForm = {
  category: "",
  product_type: "Food",
  name: "",
  description: "",
  cuisine: "",
  prep_time: "",
  preparation_url: "",
  shelf_life_days: "",
  mrp: "",
  offer: "",
  final_price: "",
  dietary_tag: "veg",
  net_weight: "",
  packaging_type: "Pouch",
  packaging_image: "",
  ingredients: "",
  instructions: "",
  images: []
};

const dietaryOptions = ["veg", "non-veg"];
const packagingOptions = ["Pouch", "Box", "Foil", "Bottle", "Packet"];
const cuisineOptions = ["Multi Cuisine", "North Indian", "South Indian", "Continental", "Chinese", "Italian", "Thai", "Mexican"];

const ChefFoodAdd = () => {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();

  const steps = [
    { id: "details", label: "Food Details" },
    { id: "pricing", label: "Pricing & Packaging" },
    { id: "ingredients", label: "Ingredients & Instructions" },
    { id: "images", label: "Food Images" },
    { id: "review", label: "Review & Save" }
  ];

  const fieldClass = "w-full px-6 py-4 bg-[#0b0d10] rounded-3xl text-white border border-white/10 focus:border-white/30 outline-none";
  const textareaClass = "w-full px-6 py-4 bg-[#0b0d10] rounded-3xl text-slate-300 border border-white/10 focus:border-white/30 outline-none";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data || {});
      } catch {
        setProfile(JSON.parse(localStorage.getItem("user") || "{}"));
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const loadCategories = async () => {
      try {
        // Get the admin's user_id who created this chef (homeChef.created_by)
        let adminUserId = null;
        try {
          const profileRes = await api.get('/auth/profile');
          const homeChef = profileRes.data?.homeChef || null;
          adminUserId = homeChef?.created_by || homeChef?.franchise_user_id || homeChef?.created_by_user_id || null;
        } catch {
          // fallback
        }

        const res = await api.get("/home-chef-categories");
        const allCategories = Array.isArray(res.data) ? res.data : [];

        let filtered = allCategories.filter(cat => cat.category_type?.toLowerCase() === 'food');

        // Only show categories created by the admin who manages this chef
        if (adminUserId) {
          filtered = filtered.filter(cat =>
            String(cat.created_by) === String(adminUserId) ||
            String(cat.created_by_user_id) === String(adminUserId) ||
            String(cat.franchise_user_id) === String(adminUserId)
          );
        } else {
          filtered = [];
        }

        setCategories(filtered);
      } catch {
        console.error("Failed to load categories");
      }
    };

    loadCategories();
  }, [profile]);

  useEffect(() => {
    if (!profile || !id) return;

    const loadFood = async () => {
      try {
        const res = await api.get(`/chef-foods/${id}`);
        const item = res.data;
        if (!item) return;
        setEditId(item.id);
        setForm({
          category: item.category || "",
          product_type: item.product_type || "Food",
          name: item.name || "",
          description: item.description || "",
          cuisine: item.cuisine || "",
          prep_time: item.prep_time || "",
          preparation_url: item.preparation_url || "",
          shelf_life_days: item.shelf_life_days?.toString() || "",
          mrp: item.mrp?.toString() || "",
          offer: item.offer?.toString() || "",
          final_price: item.final_price?.toString() || "",
          dietary_tag: item.dietary_tag || "veg",
          net_weight: item.net_weight || "",
          packaging_type: item.packaging_type || "Pouch",
          packaging_image: item.packaging_image || "",
          ingredients: item.ingredients || "",
          instructions: item.instructions || "",
          images: Array.isArray(item.images) ? item.images : []
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadFood();
  }, [profile, id]);

  const computedFinalPrice = useMemo(() => {
    const mrp = parseFloat(form.mrp) || 0;
    const offer = parseFloat(form.offer) || 0;
    const computed = mrp - mrp * (offer / 100);
    return computed > 0 ? computed.toFixed(2) : "0.00";
  }, [form.mrp, form.offer]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const toastId = toast.loading("Uploading images...");
    try {
      const formData = new FormData();
      for (const file of files) {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
        formData.append("images", compressed, file.name || "image.jpg");
      }
      
      const res = await api.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data && res.data.urls) {
        setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...res.data.urls] }));
        toast.success("Images uploaded successfully", { id: toastId });
      }
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Could not process images.", { id: toastId });
    }
  };

  const handlePackagingUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const toastId = toast.loading("Uploading packaging image...");
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      const formData = new FormData();
      formData.append("images", compressed, file.name || "packaging.jpg");
      
      const res = await api.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data && res.data.urls && res.data.urls.length > 0) {
        setForm((prev) => ({ ...prev, packaging_image: res.data.urls[0] }));
        toast.success("Packaging image uploaded", { id: toastId });
      }
    } catch (err) {
      console.error("Packaging image upload failed", err);
      toast.error("Could not process packaging image.", { id: toastId });
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
      product_type: form.product_type || "Food",
      offer: Number(form.offer) || 0,
      final_price: Number(form.final_price) || null,
      packaging_image: form.packaging_image || null,
      preparation_url: form.preparation_url || null
    };
    try {
      if (editId) {
        await api.put(`/chef-foods/${editId}`, payload);
        toast.success("Food item updated successfully.");
        navigate("/chef/food/all");
      } else {
        await api.post("/chef-foods", payload);
        toast.success("Food item added successfully.");
        navigate("/chef/food/all");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save food item.");
    }
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 p-4 md:p-8 bg-gradient-to-br from-[#0c1116] to-[#171a20] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <button onClick={() => window.history.back()} className="p-3 bg-[#0f1216] border border-slate-800 rounded-2xl text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"><FiArrowLeft size={20} /></button>
          <div>
            <h1 className="text-3xl font-black text-white">{editId ? "Edit" : "Add"} Chef Food</h1>
            <p className="text-sm text-slate-300 mt-1">Create and manage your food catalog items</p>
          </div>
        </div>

        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.45)] bg-[#081017]">
          <div className="grid lg:grid-cols-[320px_1fr] min-h-[60vh]">
            <aside className="hidden lg:flex flex-col p-6 md:p-8 bg-[#091219] border-r-2 border-white/10 h-full">
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70 mb-2">Food Onboarding</p>
                <h3 className="text-3xl font-black text-white">Advanced Form</h3>
                <p className="mt-4 text-sm leading-6 text-slate-400 max-w-[18rem]">Follow these steps to add food details, pricing, images and publish.</p>
              </div>
              <div className="flex-1 space-y-8">
                {steps.map((step, index) => {
                  const isActive = index === activeStepIndex;
                  const isCompleted = index < activeStepIndex;
                  return (
                    <div key={step.id} className={`flex items-start gap-4 transition-all duration-300 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-black shrink-0 transition-all duration-300 ${isActive ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : isCompleted ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-black tracking-wide ${isActive ? 'text-white' : 'text-slate-300'}`}>{step.label}</p>
                        {isActive && <p className="text-xs text-slate-400 mt-1">Current step</p>}
                        {isCompleted && <p className="text-xs text-emerald-400 mt-1">Completed</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="flex flex-col bg-[#0d121a] p-6 md:p-8 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Step {activeStepIndex + 1} of {steps.length}</p>
                  <h4 className="mt-2 text-2xl font-black text-white">{steps[activeStepIndex].label}</h4>
                  <p className="mt-2 text-sm text-slate-400">Fill in the required details to continue.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {activeStepIndex === 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Food Category *</label>
                        <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={fieldClass}>
                          <option value="">Select category</option>
                          {categories.map((cat) => <option key={cat.id || cat.CatId} value={cat.c_name || cat.name || cat.CatId}>{cat.c_name || cat.name || cat.CatId}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Food Name *</label>
                        <input placeholder="e.g., Butter Chicken" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={fieldClass} />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Type *</label>
                        <select value={form.product_type} onChange={(e) => setForm((p) => ({ ...p, product_type: e.target.value }))} className={fieldClass}>
                          <option value="Food">Food</option>
                          <option value="Food Product">Food Product</option>
                        </select>
                      </div>
                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Food Type</label>
                        <select value={form.dietary_tag} onChange={(e) => setForm((p) => ({ ...p, dietary_tag: e.target.value }))} className={fieldClass}>
                          {dietaryOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Preparation URL</label>
                        <input placeholder="https://" type="url" value={form.preparation_url} onChange={(e) => setForm((p) => ({ ...p, preparation_url: e.target.value }))} className={fieldClass} />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Food Weight</label>
                        <input placeholder="e.g., 250g, 500ml" value={form.net_weight} onChange={(e) => setForm((p) => ({ ...p, net_weight: e.target.value }))} className={fieldClass} />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Cuisine</label>
                        <select value={form.cuisine} onChange={(e) => setForm((p) => ({ ...p, cuisine: e.target.value }))} className={fieldClass}>
                          <option value="">Select cuisine</option>
                          {cuisineOptions.map((cuisine) => (
                            <option key={cuisine} value={cuisine}>{cuisine}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 uppercase mb-2">Food Description *</label>
                      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className={textareaClass} />
                    </div>
                  </div>
                )}

                {activeStepIndex === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Price (₹) *</label>
                        <input placeholder="e.g., 199" type="number" value={form.mrp} onChange={(e) => setForm((p) => ({ ...p, mrp: e.target.value }))} className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Offer (%)</label>
                        <input placeholder="e.g., 10" type="number" value={form.offer} onChange={(e) => setForm((p) => ({ ...p, offer: e.target.value }))} className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Final Price</label>
                        <input value={computedFinalPrice} readOnly className={`${fieldClass} bg-[#0f1216] text-emerald-300`} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Packaging Type</label>
                        <select value={form.packaging_type} onChange={(e) => setForm((p) => ({ ...p, packaging_type: e.target.value }))} className={fieldClass}>
                          {packagingOptions.map((pack) => <option key={pack} value={pack}>{pack}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Prep Time</label>
                        <input placeholder="e.g., 30 mins" value={form.prep_time} onChange={(e) => setForm((p) => ({ ...p, prep_time: e.target.value }))} className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-300 uppercase mb-2">Shelf Life</label>
                        <input placeholder="e.g., 2 days" value={form.shelf_life_days} onChange={(e) => setForm((p) => ({ ...p, shelf_life_days: e.target.value }))} className={fieldClass} />
                      </div>
                    </div>
                  </div>
                )}

                {activeStepIndex === 2 && (
                  <div className="space-y-6">
                    <label className="block text-xs font-black text-slate-300 uppercase mb-2">Ingredients</label>
                    <textarea value={form.ingredients} onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))} rows={5} className={textareaClass} />
                    <label className="block text-xs font-black text-slate-300 uppercase mb-2">Cooking Instructions</label>
                    <textarea value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} rows={5} className={textareaClass} />
                  </div>
                )}

                {activeStepIndex === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer bg-[#0b0d10] hover:border-emerald-500/50 transition-colors">
                        <FiUploadCloud size={28} className="text-slateald-400 mb-2" />
                        <span className="text-sm text-slate-200 font-semibold">Upload Packaging Image</span>
                        <span className="text-xs text-slate-500 mt-1">Click to browse</span>
                        <input type="file" accept="image/*" onChange={handlePackagingUpload} className="hidden" />
                      </label>

                      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer bg-[#0b0d10] hover:border-emerald-500/50 transition-colors">
                        <FiUploadCloud size={28} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-200 font-semibold">Upload Gallery Images</span>
                        <span className="text-xs text-slate-500 mt-1">Multiple images allowed</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>

                    {form.packaging_image && (
                      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0a0f14] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-white">Packaging Image</p>
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, packaging_image: "" }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <img src={form.packaging_image} alt="Packaging" className="w-full rounded-2xl object-cover h-48" />
                      </div>
                    )}

                    {form.images && form.images.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-white">Gallery Images ({form.images.length})</p>
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, images: [] }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                          >
                            ✕ Remove All
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {form.images.map((img, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10">
                              <img src={img} alt={`img-${i}`} className="w-full h-32 object-cover" />
                              <button
                                type="button"
                                onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-400"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeStepIndex === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-white">Review</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="bg-[#0b0d10] p-4 rounded-md text-sm text-slate-300">
                        <p><strong className="text-white">Name:</strong> {form.name || '-'}</p>
                        <p><strong className="text-white">Category:</strong> {form.category || '-'}</p>
                        <p><strong className="text-white">Type:</strong> {form.dietary_tag || '-'}</p>
                        <p><strong className="text-white">Cuisine:</strong> {form.cuisine || '-'}</p>
                        <p><strong className="text-white">Weight:</strong> {form.net_weight || '-'}</p>
                      </div>
                      <div className="bg-[#0b0d10] p-4 rounded-md text-sm text-slate-300">
                        <p><strong className="text-white">Price:</strong> {form.mrp || '-'}</p>
                        <p><strong className="text-white">Offer:</strong> {form.offer || '0'}%</p>
                        <p><strong className="text-white">Final Price:</strong> {computedFinalPrice}</p>
                        <p><strong className="text-white">Packaging:</strong> {form.packaging_type || '-'}</p>
                        <p><strong className="text-white">Prep URL:</strong> {form.preparation_url || '-'}</p>
                      </div>
                    </div>
                    {form.packaging_image && (
                      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0a0f14] p-4">
                        <p className="text-sm font-semibold text-white mb-3">Packaging Image</p>
                        <img src={form.packaging_image} alt="Packaging" className="w-full rounded-3xl object-cover h-48" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0b111a] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Navigation</p>
                    <h5 className="mt-2 text-lg font-black text-white">Advance to the next stage</h5>
                    <p className="mt-1 text-sm text-slate-400">Use the buttons below to move through the food onboarding steps.</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                      disabled={activeStepIndex === 0}
                      className="inline-flex items-center justify-center min-w-[140px] rounded-3xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                    >
                      Previous Step
                    </button>

                    {activeStepIndex < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex(Math.min(steps.length - 1, activeStepIndex + 1))}
                        className="inline-flex items-center justify-center min-w-[140px] rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center min-w-[140px] rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : (editId ? 'Update Food' : 'Save Food')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefFoodAdd;
