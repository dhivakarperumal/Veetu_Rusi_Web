import { useState, useEffect, useMemo } from "react";
import { FiArrowLeft, FiUploadCloud } from "react-icons/fi";
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
        const params = {};
        if (profile?.user_id || profile?.id) params.chef_user_id = profile.user_id || profile.id;
        const res = await api.get("/home-chef-categories", { params });
        const allCategories = Array.isArray(res.data) ? res.data : [];
        setCategories(allCategories.filter(cat => cat.category_type?.toLowerCase() === 'food'));
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
    try {
      const imageData = await Promise.all(
        files.map((file) =>
          imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true })
            .then((compressed) => new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(compressed);
            }))
        )
      );
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...imageData] }));
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Could not process images.");
    }
  };

  const handlePackagingUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressed);
      });
      setForm((prev) => ({ ...prev, packaging_image: imageData }));
    } catch (err) {
      console.error("Packaging image upload failed", err);
      toast.error("Could not process packaging image.");
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
            <aside className="hidden lg:flex flex-col p-6 bg-[#091219] border-r-2 border-white/30 h-full pr-6">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Food Onboarding</p>
                <h3 className="text-3xl font-black text-white">Advanced Form</h3>
                <p className="text-sm leading-6 text-slate-400 max-w-[18rem]">Step through sections to add food details, pricing, images and publish.</p>
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
                      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer bg-[#0b0d10]">
                        <FiUploadCloud size={28} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-200">Upload food packaging image</span>
                        <input type="file" accept="image/*" onChange={handlePackagingUpload} className="hidden" />
                      </label>

                      <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer bg-[#0b0d10]">
                        <FiUploadCloud size={28} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-200">Upload food gallery images</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>

                    {form.packaging_image && (
                      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0a0f14] p-4">
                        <p className="text-sm font-semibold text-white mb-3">Packaging Image</p>
                        <img src={form.packaging_image} alt="Packaging" className="w-full rounded-3xl object-cover h-48" />
                      </div>
                    )}

                    {form.images && form.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {form.images.map((img, i) => (
                          <img key={i} src={img} alt={`img-${i}`} className="w-full h-32 object-cover rounded-md" />
                        ))}
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
