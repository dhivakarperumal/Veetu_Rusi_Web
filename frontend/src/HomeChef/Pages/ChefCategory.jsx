import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaImage } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

const ChefCategory = () => {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState({
    catId: "",
    name: "",
    description: "",
    images: [],
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data?.user || {});
      } catch (err) {
        console.warn('Failed to load profile', err);
        setProfile(JSON.parse(localStorage.getItem('user') || '{}'));
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) fetchCategories();
  }, [profile]);

  const safeParse = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const generateCatId = (items) => {
    const ownCategories = (items || []).filter(
      (item) => item.chef_user_id === profile?.user_id || item.chef_user_id === profile?.id
    );
    if (!ownCategories.length) return 'CAT001';
    const ids = ownCategories
      .map((item) => {
        const match = item.catId?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((num) => !isNaN(num));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `CAT${String(max + 1).padStart(3, '0')}`;
  };

  const fetchCategories = async () => {
    try {
      const params = {};
      if (profile?.user_id || profile?.id) {
        params.chef_user_id = profile.user_id || profile.id;
      }
      const res = await api.get('/chef-categories', { params });
      const normalized = (res.data || []).map((cat) => ({
        ...cat,
        images: safeParse(cat.images),
      }));
      setCategories(normalized);
    } catch (err) {
      console.error('Failed loading chef categories', err);
      toast.error('Could not load your category list.');
    }
  };

  const resetForm = () => {
    setCategory({ catId: '', name: '', description: '', images: [] });
    setPreviewImages([]);
    setEditId(null);
  };

  const openAddModal = () => {
    const nextCatId = generateCatId(categories);
    setCategory({ catId: nextCatId, name: '', description: '', images: [] });
    setPreviewImages([]);
    setEditId(null);
    setShowModal(true);
  };

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
        compressed.map((file) =>
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
      toast.error('Failed to process images');
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
      toast.error('Name, description and at least one image are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...category,
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
      };

      if (editId) {
        await api.put(`/chef-categories/${editId}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/chef-categories', payload);
        toast.success('Category added');
      }
      setShowModal(false);
      resetForm();
      await fetchCategories();
    } catch (err) {
      console.error('Category save failed', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setCategory({
      catId: cat.catId || '',
      name: cat.name || '',
      description: cat.description || '',
      images: cat.images || [],
    });
    setPreviewImages(cat.images || []);
    setEditId(cat.id);
    setShowModal(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/chef-categories/${cat.catId || cat.id}`);
      toast.success('Deleted');
      await fetchCategories();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Chef Categories</h1>
            <p className="text-sm text-slate-500 mt-2">Manage categories that belong to your chef profile.</p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
          >
            <FaPlus /> Add Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            No categories yet. Use the button above to create your first chef category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-4xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase text-slate-400 tracking-[0.2em]">{cat.catId}</p>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{cat.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(cat)} className="text-slate-500 hover:text-slate-900">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="text-rose-500 hover:text-rose-700">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">{cat.description}</p>
                {cat.images?.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {cat.images.map((img, idx) => (
                      <img key={idx} src={img} alt={cat.name} className="w-full h-28 object-cover rounded-2xl" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-y-auto rounded-4xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black">{editId ? 'Edit' : 'Add'} Chef Category</h2>
                  <p className="text-sm text-slate-500">Create a category that is visible only for your chef account.</p>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-900">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Category ID</label>
                    <input
                      type="text"
                      name="catId"
                      value={category.catId}
                      disabled
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-sm text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Category Name</label>
                    <input
                      type="text"
                      name="name"
                      value={category.name}
                      onChange={(e) => setCategory((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-2 w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    value={category.description}
                    onChange={(e) => setCategory((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
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
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 w-full">
                        {previewImages.map((img, idx) => (
                          <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200">
                            <img src={img} alt={`preview-${idx}`} className="h-24 w-full object-cover" />
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
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="rounded-3xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editId ? 'Save changes' : 'Create category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefCategory;
