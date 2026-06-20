import React, { useState, useEffect } from "react";
import { FaPlus, FaImage, FaTimes } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

const ChefFoodCategoryAdd = () => {
  const [profile, setProfile] = useState(null);
  const [category, setCategory] = useState({ catId: "", name: "", description: "", images: [] });
  const [previewImages, setPreviewImages] = useState([]);
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
    const fetchNextId = async () => {
      try {
        const params = { chef_user_id: profile.user_id || profile.id };
        const res = await api.get("/chef-food-categories", { params });
        const items = Array.isArray(res.data) ? res.data : [];
        const ids = items
          .map((item) => {
            const match = item.catId?.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          })
          .filter((num) => !Number.isNaN(num));
        const nextId = `CAT${String(ids.length > 0 ? Math.max(...ids) + 1 : 1).padStart(3, "0")}`;
        setCategory((prev) => ({ ...prev, catId: nextId }));
      } catch (err) {
        console.warn("Could not generate category ID", err);
        setCategory((prev) => ({ ...prev, catId: "CAT001" }));
      }
    };

    fetchNextId();
  }, [profile]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const compressed = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );

      const dataUrls = await Promise.all(
        compressed.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setPreviewImages((prev) => [...prev, ...dataUrls]);
      setCategory((prev) => ({ ...prev, images: [...(prev.images || []), ...dataUrls] }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to process images.");
    }
  };

  const removeImage = (index) => {
    const updated = [...(category.images || [])];
    updated.splice(index, 1);
    setCategory((prev) => ({ ...prev, images: updated }));
    setPreviewImages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category.name || !category.description || !category.images?.length) {
      toast.error("Name, description and at least one image are required.");
      return;
    }
    setLoading(true);

    const payload = {
      ...category,
      chef_user_id: profile?.user_id || profile?.id || null,
      chef_id: profile?.chef_id || null,
      chef_name: profile?.name || profile?.username || null,
      chef_phone: profile?.phone || null,
      chef_email: profile?.email || null,
      franchise_user_id: profile?.homeChef?.created_by || profile?.homeChef?.franchise_user_id || profile?.homeChef?.created_by_user_id || profile?.created_by_user_id || profile?.created_by || null,
      franchise_id: profile?.homeChef?.franchise_id || profile?.franchise_id || null,
      franchise_name: profile?.homeChef?.franchise_name || profile?.homeChef?.created_by_name || profile?.created_by_name || null,
      franchise_email: profile?.homeChef?.franchise_email || profile?.homeChef?.created_by_email || profile?.created_by_email || null,
      franchise_phone: profile?.homeChef?.franchise_phone || profile?.homeChef?.created_by_phone || profile?.created_by_phone || null,
      created_by_user_id: profile?.user_id || profile?.id || null,
    };

    try {
      await api.post("/chef-food-categories", payload);
      toast.success("Food category added successfully.");
      setCategory({ catId: category.catId, name: "", description: "", images: [] });
      setPreviewImages([]);
    } catch (err) {
      console.error("Food category save failed", err);
      toast.error(err.response?.data?.message || "Failed to add food category.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Add Food Category</h1>
            <p className="text-sm text-slate-300 mt-2">Create a new food category for your chef profile.</p>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-800 bg-[#111319] p-8 shadow-sm text-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Category ID</label>
                <input
                  type="text"
                  value={category.catId}
                  disabled
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-[#0b0d10] px-5 py-4 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Category Name</label>
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => setCategory((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  className="mt-2 w-full rounded-3xl border border-slate-800 px-5 py-4 text-sm text-slate-200 bg-[#0b0d10]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea
                value={category.description}
                onChange={(e) => setCategory((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
                placeholder="Describe this food category"
                className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Images</label>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:border-slate-400">
                  <FaImage /> Add Images
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-3xl border border-slate-200">
                      <img src={img} alt={`preview-${idx}`} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-rose-600 hover:text-rose-800"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChefFoodCategoryAdd;
