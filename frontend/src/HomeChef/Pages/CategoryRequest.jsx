import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, ImagePlus, Plus, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import api from "../../api";

const CategoryRequest = ({ popup = false, onClose, onSubmitted }) => {
  const navigate = useNavigate();
  const [categoryType, setCategoryType] = useState("Food");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const close = () => {
    if (onClose) onClose();
    else navigate("/chef/categories");
  };

  const addSubcategory = () => {
    const value = subcategoryInput.trim();
    if (!value || subcategories.includes(value)) return;
    setSubcategories((current) => [...current, value]);
    setSubcategoryInput("");
  };

  const handleImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      const compressed = await Promise.all(files.map((file) => imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      })));
      const previews = await Promise.all(compressed.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })));
      setImages((current) => [...current, ...previews]);
    } catch (error) {
      console.error("Category request image processing failed:", error);
      toast.error("Could not process the selected images.");
    }
    event.target.value = "";
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!images.length) {
      toast.error("Add at least one category image.");
      return;
    }
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await api.post("/category-requests", {
        category_type: categoryType,
        c_name: name,
        discripti: description,
        subcategory: subcategories,
        image: images,
        chef_name: user.name || user.full_name || user.username || "",
      });
      toast.success("Category request sent for review.");
      onSubmitted?.();
      close();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit the category request.");
    } finally {
      setLoading(false);
    }
  };

  const requestForm = (
        <form onSubmit={submitRequest} className={`overflow-hidden bg-white ${popup ? "flex min-h-0 flex-1 flex-col" : "rounded-3xl border border-slate-200 shadow-xl"}`}>
          <div className={`space-y-6 p-6 sm:p-9 ${popup ? "min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y" : ""}`}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
                Category type <span className="text-rose-500">*</span>
                <select value={categoryType} onChange={(event) => setCategoryType(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold normal-case outline-none focus:border-emerald-500">
                  <option value="Food">Food</option>
                  <option value="food products">Food Products</option>
                </select>
              </label>
              <div className="space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
                Category ID
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold normal-case text-emerald-900">
                  <FileText size={17} /> Generated after approval
                </div>
              </div>
            </div>

            <label className="block space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
              Category name <span className="text-rose-500">*</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} placeholder="Enter name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold normal-case outline-none focus:border-emerald-500" />
            </label>

            <label className="block space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
              Detailed description <span className="text-rose-500">*</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} placeholder="Describe this category" className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold normal-case outline-none focus:border-emerald-500" />
            </label>

            <div className="space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
              Subcategories
              <div className="flex gap-2">
                <input value={subcategoryInput} onChange={(event) => setSubcategoryInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSubcategory(); } }} placeholder="Type subcategory and press Enter or +" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold normal-case outline-none focus:border-emerald-500" />
                <button type="button" onClick={addSubcategory} aria-label="Add subcategory" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"><Plus size={22} /></button>
              </div>
              {!!subcategories.length && <div className="flex flex-wrap gap-2 pt-1">{subcategories.map((subcategory, index) => <span key={`${subcategory}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold normal-case text-emerald-800">{subcategory}<button type="button" aria-label={`Remove ${subcategory}`} onClick={() => setSubcategories((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={13} /></button></span>)}</div>}
            </div>

            <div className="space-y-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
              Images <span className="text-rose-500">*</span>
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/70 text-emerald-700 transition hover:border-emerald-400">
                <ImagePlus size={27} />
                <span className="text-xs font-bold normal-case">Select category images</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="sr-only" />
              </label>
              {!!images.length && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={`${index}-${image.slice(0, 20)}`} className="relative overflow-hidden rounded-xl border border-slate-200"><img src={image} alt={`Category preview ${index + 1}`} className="h-24 w-full object-cover" /><button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-full bg-white p-1 text-rose-600 shadow"><X size={14} /></button></div>)}</div>}
            </div>
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:px-9">
            <button type="button" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Sending..." : "Submit Request"}</button>
          </footer>
    </form>
  );

  if (popup) {
    return createPortal(
      <div className="fixed inset-0 z-10000 flex items-center justify-center overflow-y-auto p-4 sm:p-6" role="presentation">
        <button type="button" aria-label="Close category request" onClick={close} className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" />
        <section role="dialog" aria-modal="true" aria-labelledby="category-request-title" className="relative flex max-h-[92vh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <header className="flex shrink-0 items-center justify-between bg-emerald-600 px-6 py-6 text-white sm:px-9">
            <div>
              <h1 id="category-request-title" className="text-2xl font-black uppercase">New Category Request</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-100">Submit a product classification for review</p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="rounded-xl bg-black/10 p-3 transition hover:bg-black/20"><X size={20} /></button>
          </header>
          {requestForm}
        </section>
      </div>,
      document.body
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-300">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">New Category Request</h1>
            <p className="mt-2 text-sm text-slate-300">Submit a product classification for review.</p>
          </div>
          <button type="button" onClick={close} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 sm:self-auto">
            <ArrowLeft size={17} /> Back to Categories
          </button>
        </header>
        {requestForm}
      </div>
    </div>
  );
};

export default CategoryRequest;