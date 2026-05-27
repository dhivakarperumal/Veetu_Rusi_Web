import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaFileAlt,
  FaBoxOpen,
  FaLayerGroup,
  FaSearch,
  FaEdit,
  FaEye,
  FaHeartbeat,
} from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { toast } from "react-hot-toast";
import api from "../../api";
import JsBarcode from "jsbarcode";
import imageCompression from "browser-image-compression";

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editItem = location.state?.editItem;
  const [fetchedEditItem, setFetchedEditItem] = useState(null);

  const currentEditItem = editItem || fetchedEditItem;
  const [activeTab, setActiveTab] = useState(currentEditItem?.type === "combo" ? "combo" : "single");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [franchiseId, setFranchiseId] = useState(null);
  const [franchiseUserId, setFranchiseUserId] = useState(null);

  useEffect(() => {
    const fetchFranchiseInfo = async () => {
      try {
        const res = await api.get("/auth/profile");
        setFranchiseUserId(res.data?.user?.user_id || null);
        setFranchiseId(res.data?.franchise?.franchise_id || null);
      } catch (err) {
        console.error("Failed to load franchise profile:", err);
      }
    };
    fetchFranchiseInfo();
  }, []);

  const fetchData = async () => {
    setLoadingList(true);
    try {
      const [catRes, prodRes, comboRes] = await Promise.allSettled([
        api.get("/categories"),
        api.get("/franchise-products", { params: { ...(franchiseUserId ? { franchise_user_id: franchiseUserId } : {}), ...(franchiseId ? { franchise_id: franchiseId } : {}) } }),
        api.get("/combos"),
      ]);

      if (catRes.status === "fulfilled") {
        const categoriesData = Array.isArray(catRes.value.data)
          ? catRes.value.data
          : Array.isArray(catRes.value.data?.categories)
          ? catRes.value.data.categories
          : [];
        setCategories(categoriesData);
      } else {
        console.error("Category request failed:", catRes.reason);
        setCategories([]);
      }

      if (prodRes.status === "fulfilled") {
        setProducts(Array.isArray(prodRes.value.data) ? prodRes.value.data : []);
      } else {
        console.error("Products request failed:", prodRes.reason);
        setProducts([]);
      }

      if (comboRes.status === "fulfilled") {
        setCombos(Array.isArray(comboRes.value.data) ? comboRes.value.data : []);
      } else {
        console.error("Combos request failed:", comboRes.reason);
        setCombos([]);
      }
    } catch (err) {
      console.error("Category fetch failed:", err?.response?.data || err.message || err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [franchiseUserId, franchiseId]);

  useEffect(() => {
    if (!editItem && id) {
      const loadEditItem = async () => {
        try {
          const res = await api.get(`/franchise-products/${id}`);
          setFetchedEditItem(res.data);
          const item = res.data;
          const shouldBeCombo = item?.type === "combo" || item?.comboItems;
          setActiveTab(shouldBeCombo ? "combo" : "single");
        } catch (err) {
          console.error("Failed to load edit product:", err);
          toast.error("Unable to load product for editing.");
          navigate("/admin/products/all");
        }
      };
      loadEditItem();
    }
  }, [id, editItem, navigate]);

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      const endpoint = type === "single" ? "/franchise-products" : "/combos";
      await api.delete(`${endpoint}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filteredItems = (activeTab === "single" ? products : combos).filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full p-4 md:p-10 mt-0 min-h-screen bg-transparent animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8 bg-white/40 backdrop-blur-md p-8 rounded-[3rem] border border-white/60 shadow-xl shadow-gray-100">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 transition-all duration-500 ${activeTab === "single" ? "bg-gradient-to-tr from-emerald-600 to-green-400 rotate-0" : "bg-gradient-to-tr from-amber-600 to-orange-400 rotate-12"}`}>
              {activeTab === "single" ? <FaBoxOpen size={24} /> : <FaLayerGroup size={24} />}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {activeTab === "single" ? "Single Product" : "Combo Pack"} <span className="text-gray-400 font-medium tracking-normal text-md">Studio</span>
              </h1>
              <p className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                Inventory Master Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-200/50 p-2 rounded-[2rem] shadow-inner backdrop-blur-sm border border-white/50">
          <button
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] transition-all duration-500 font-black uppercase tracking-widest text-xs ${activeTab === "single" ? "bg-white text-emerald-700 shadow-xl scale-105 border border-emerald-100" : "text-gray-500 hover:text-emerald-600"}`}
          >
            <FaBoxOpen className={activeTab === "single" ? "animate-bounce" : ""} /> Single
          </button>
          <button
            onClick={() => setActiveTab("combo")}
            className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] transition-all duration-500 font-black uppercase tracking-widest text-xs ${activeTab === "combo" ? "bg-white text-amber-700 shadow-xl scale-105 border border-amber-100" : "text-gray-500 hover:text-amber-600"}`}
          >
            <FaLayerGroup className={activeTab === "combo" ? "animate-bounce" : ""} /> Combo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Forms Section */}
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          {activeTab === "single" ? (
            <SingleProductForm 
              categories={categories} 
              franchiseId={franchiseId}
              franchiseUserId={franchiseUserId}
              onSuccess={() => { 
                fetchData(); 
                navigate('/admin/products/all');
              }} 
              products={products} 
              editItem={currentEditItem} 
            />
          ) : (
            <ComboProductForm 
              categories={categories} 
              onSuccess={() => { 
                fetchData(); 
                navigate('/admin/products/all');
              }} 
              combos={combos} 
              products={products} 
              editItem={currentEditItem} 
            />
          )}
        </div>

      </div>
    </div>
  );
};

const SingleProductForm = ({ categories, franchiseId, franchiseUserId, onSuccess, products, editItem }) => {
  const [form, setForm] = useState({
    productId: "",
    name: "",
    description: "",
    healthBenefits: [""],
    category: "",
    images: [],
    variants: [{ weight: "", mrp: "", offerPercent: "", offerPrice: "" }],
    totalStock: "0",
    totalWeight: 0,
    barcode: "",
    barcodeValue: "",
    rating: 5,
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [manualWeight, setManualWeight] = useState(false);
  const barcodeRef = useRef();

  const safeParse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try { return JSON.parse(data); } catch { return []; }
  };

  useEffect(() => {
    if (editItem) {
      setForm({
        ...editItem,
        healthBenefits: safeParse(editItem.healthBenefits).length ? safeParse(editItem.healthBenefits) : [""],
        variants: safeParse(editItem.variants),
        images: safeParse(editItem.images),
        barcodeValue: editItem.barcodeValue || editItem.productId
      });
    } else {
      const maxId = products.reduce((max, p) => {
        const match = p.productId?.match(/\d+/);
        const num = match ? parseInt(match[0]) : 0;
        return Math.max(max, num);
      }, 0);
      setForm((prev) => ({
        ...prev,
        productId: `PR${String(maxId + 1).padStart(3, "0")}`,
        name: "", description: "", healthBenefits: [""], images: [], variants: [{ weight: "", mrp: "", offerPercent: "", offerPrice: "" }], totalStock: "0",
        barcodeValue: "", barcode: "", status: "Active"
      }));
    }
  }, [editItem, products]);

  useEffect(() => {
    if (manualWeight) return; // user is manually controlling weight
    const totalW = form.variants.reduce((sum, v) => {
      const wStr = String(v.weight || "").toLowerCase();
      const val = parseFloat(wStr) || 0;
      const factor = wStr.includes("kg") ? 1000 : 1;
      return sum + (val * factor);
    }, 0);

    if (String(totalW) !== form.totalStock || totalW !== form.totalWeight) {
      setForm(prev => ({ ...prev, totalStock: String(totalW), totalWeight: totalW }));
    }
  }, [form.variants, manualWeight]);

  useEffect(() => {
    if (form.productId && barcodeRef.current) {
      const code = form.barcodeValue || form.productId;
      try {
        JsBarcode(barcodeRef.current, code, { format: "CODE128", lineColor: "#10b981", width: 2, height: 40, displayValue: true });
        const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
        const base64Data = `data:image/svg+xml;base64,${btoa(svgData)}`;
        if (form.barcode !== base64Data) setForm((prev) => ({ ...prev, barcode: base64Data, barcodeValue: code }));
      } catch (e) { }
    }
  }, [form.productId, form.barcodeValue]);

  const handleImageUpload = async (e) => {
    const rawFiles = Array.from(e.target.files);
    try {
      toast.loading("Compressing...", { id: "up-p" });
      const base64 = await Promise.all(
        rawFiles.map((file) =>
          imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }).then((blob) => {
            return new Promise((res) => {
              const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob);
            });
          }),
        ),
      );
      setForm((prev) => ({ ...prev, images: [...prev.images, ...base64] }));
      toast.success("Ready!", { id: "up-p" });
    } catch { toast.error("Fail", { id: "up-p" }); }
    finally { e.target.value = ""; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure backend-required top-level fields are present
      const computedMrp = form.mrp || (Array.isArray(form.variants) && form.variants[0] && form.variants[0].mrp) || null;
      if (!computedMrp) {
        toast.error('Please enter MRP for the first variant or set product MRP');
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        mrp: computedMrp,
        variants: form.variants,
        franchise_id: franchiseId
      };

      try {
        console.debug('Submitting franchise product payload', payload);
      } catch (e) { /* ignore debug errors */ }

      if (editItem) {
        await api.put(`/franchise-products/${editItem.id}`, payload);
        toast.success("Inventory Pulse Updated");
      } else {
        await api.post("/franchise-products", payload);
        toast.success("Product Registered Successfully");
      }
      onSuccess();
    } catch { toast.error("Studio Sync Failed"); }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-100 ring-1 ring-emerald-50">
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 p-10 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div><h2 className="text-xl font-black uppercase tracking-tight">Product Studio</h2><p className="opacity-90 font-medium mt-1 text-emerald-50 uppercase tracking-[0.2em] text-xs"> Fresh Inventory Entry</p></div>
          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30"><span className="font-black tracking-widest text-sm">{form.productId}</span></div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="space-y-12">
          {/* Identity Section - Full Width */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div> Identity & Details</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Product Title *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 shadow-sm" placeholder="e.g. Premium Roasted Almonds" /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Composition / Description *</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows="3" className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none transition-all resize-none font-medium text-gray-700 leading-relaxed shadow-sm" placeholder="Describe quality, origin, benefits..." /></div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Category *</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-emerald-800 shadow-sm"><option value="">Select Category</option>{(() => {
                    const filteredCategories = categories.filter((c) => {
                      if (franchiseId) {
                        return c.franchise_id === franchiseId || c.franchise_user_id === franchiseUserId;
                      }
                      return true;
                    });
                    return filteredCategories.length ? filteredCategories.map((c) => {
                      const label = c.name || c.cname || c.catId || `Category ${c.id}`;
                      const value = c.catId || c.name || c.cname || c.id;
                      return (<option key={c.id || value} value={value}>{label}</option>);
                    }) : <option disabled>No franchise categories available</option>;
                  })()}</select></div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Status *</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-black text-emerald-800 shadow-sm"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 flex items-center gap-2">
                      Total Weight
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${manualWeight ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-600'}`}>
                        {manualWeight ? 'Manual' : 'Auto'}
                      </span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={form.totalWeight}
                        onChange={(e) => { setManualWeight(true); setForm({ ...form, totalWeight: Number(e.target.value) }); }}
                        className={`w-full rounded-2xl px-6 py-4 font-black border-2 shadow-sm outline-none transition-all ${
                          manualWeight
                            ? 'bg-orange-50 border-orange-300 text-orange-700 focus:border-orange-500'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 focus:border-emerald-400'
                        }`}
                        placeholder="Enter grams"
                      />
                      {manualWeight && (
                        <button
                          type="button"
                          title="Reset to Auto"
                          onClick={() => { setManualWeight(false); }}
                          className="flex-shrink-0 w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md transition-all"
                        >↺</button>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium ml-1 mt-1">{manualWeight ? 'Type to override · click ↺ to sync from variants' : 'Auto-summed from variant weights'}</p>
                  </div>
                {/* <div className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">Studio Status Radar</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[60%] animate-pulse"></div></div>
                    <span className="text-[10px] font-black text-emerald-700">60% COMPLETE</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Registry & Ranges - Full Width Spanning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100 shadow-xl shadow-emerald-50/20">
              <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Digital Registry</h3><div className="w-12 h-1.5 bg-emerald-500 mt-1 rounded-full"></div></div><div className="px-5 py-3 bg-white rounded-2xl border border-emerald-200 font-black text-emerald-700 shadow-sm">{form.productId}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 block">SKU Code / Barcode</label><input value={form.barcodeValue} onChange={(e) => setForm({ ...form, barcodeValue: e.target.value })} className="w-full bg-white border-2 border-emerald-100 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none font-bold shadow-sm" placeholder="System Default" /></div>
                <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 shadow-inner"><svg className="absolute -left-[9999px]" ref={barcodeRef}></svg>{form.barcode ? <img src={form.barcode} alt="bc" className="h-24 w-full object-contain" /> : <div className="animate-pulse text-[10px] text-emerald-300 font-black uppercase">Generating...</div>}</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50">
              <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-orange-400 rounded-full"></div> Sales Variants</h3><button type="button" onClick={() => setForm((p) => ({ ...p, variants: [...p.variants, { weight: "", mrp: "", offerPercent: "", offerPrice: "" }] }))} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">Expand Range</button></div>
              <div className="space-y-6">
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 items-end">
                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Weight</label><input placeholder="250g" value={v.weight} onChange={(e) => { const u = [...form.variants]; u[i].weight = e.target.value; setForm({ ...form, variants: u }); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm" /></div>
                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">MRP (₹)</label><input type="number" placeholder="500" value={v.mrp} onChange={(e) => { const u = [...form.variants]; u[i].mrp = e.target.value; u[i].offerPrice = Math.round(Number(e.target.value) - (Number(e.target.value) * Number(u[i].offerPercent)) / 100); setForm({ ...form, variants: u }); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm" /></div>
                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Discount %</label><input type="number" placeholder="10" value={v.offerPercent} onChange={(e) => { const u = [...form.variants]; u[i].offerPercent = e.target.value; u[i].offerPrice = Math.round(Number(u[i].mrp) - (Number(u[i].mrp) * Number(e.target.value)) / 100); setForm({ ...form, variants: u }); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-orange-600 shadow-sm" /></div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1.5 ml-1">Final Price</label><div className="bg-emerald-100 px-4 py-3 rounded-xl font-black text-emerald-800 text-[11px] shadow-inner text-center">₹{v.offerPrice || 0}</div></div>
                      {form.variants.length > 1 && (
                        <button type="button" onClick={() => setForm((p) => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))} className="w-9 h-9 flex-shrink-0 bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm mb-0.5"><FaTrash size={11} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual & Health Grid - Full Width Spanning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-blue-500 rounded-full"></div> Visual Assets</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative aspect-square border-4 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer group">
                  <input type="file" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><FaPlus className="text-emerald-500 group-hover:scale-125 transition-transform" /><span className="text-[9px] font-black text-gray-400 uppercase">Add Photo</span>
                </div>
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square group rounded-[1.5rem] overflow-hidden border shadow-sm ring-2 ring-white hover:ring-emerald-500 transition-all">
                    <img src={img} className="w-full h-full object-cover" alt="p" /><button type="button" onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div> Health Analysis Points</h3>
                <button type="button" onClick={() => setForm({ ...form, healthBenefits: [...form.healthBenefits, ""] })} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2"><FaPlus size={10} /> Add Point</button>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-emerald-100">
                {form.healthBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex gap-3 group">
                    <div className="flex-1 relative">
                      <FaHeartbeat className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        value={benefit}
                        onChange={(e) => {
                          const newBenefits = [...form.healthBenefits];
                          newBenefits[idx] = e.target.value;
                          setForm({ ...form, healthBenefits: newBenefits });
                        }}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl pl-12 pr-6 py-3 outline-none font-bold text-sm text-gray-800 transition-all shadow-inner"
                        placeholder="e.g. Rich in Omega-3 Fatty Acids"
                      />
                    </div>
                    {form.healthBenefits.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, healthBenefits: form.healthBenefits.filter((_, i) => i !== idx) })} className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all">
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pt-10 flex justify-end border-t border-gray-100">
          <button type="submit" disabled={loading} className="bg-gradient-to-tr from-emerald-600 to-green-400 px-20 py-5 rounded-3xl text-white font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"> {loading ? (editItem ? "Updating Master Registry..." : "Saving Master Registry...") : (editItem ? "Update Product Details" : "Save Product Details")}</button>
        </div>
      </form>
    </div>
  );
};

const ComboProductForm = ({ categories, onSuccess, combos, products, editItem }) => {
  const [form, setForm] = useState({
    productId: "",
    name: "",
    description: "",
    healthBenefits: [""],
    category: "Combo Packs",
    images: [],
    comboItems: [{ name: "", weight: "", image: "" }],
    comboDetails: { mrp: "", offerPercent: "", offerPrice: "", totalWeight: 0 },
    totalStock: "0",
    totalWeight: 0,
    barcode: "",
    barcodeValue: "",
    rating: 5,
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [manualWeight, setManualWeight] = useState(false);
  const [manualStock, setManualStock] = useState(false);
  const barcodeRef = useRef();

  const safeParse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try { return JSON.parse(data); } catch { return []; }
  };

  useEffect(() => {
    if (editItem) {
      const parsedDetails = typeof editItem.comboDetails === 'string' 
        ? JSON.parse(editItem.comboDetails || '{}') 
        : editItem.comboDetails;
      setForm({
        ...editItem,
        healthBenefits: safeParse(editItem.healthBenefits).length ? safeParse(editItem.healthBenefits) : [""],
        images: safeParse(editItem.images),
        comboItems: safeParse(editItem.comboItems),
        comboDetails: parsedDetails,
        // Restore totalWeight from comboDetails if available
        totalWeight: Number(parsedDetails?.totalWeight || editItem.totalWeight || 0),
        barcodeValue: editItem.barcodeValue || editItem.productId
      });
    } else {
      const maxId = combos.reduce((max, c) => {
        const match = c.productId?.match(/\d+/);
        const num = match ? parseInt(match[0]) : 0;
        return Math.max(max, num);
      }, 0);
      setForm((prev) => ({
        ...prev,
        productId: `KPR${String(maxId + 1).padStart(3, "0")}`,
        name: "", description: "", healthBenefits: [""], images: [], totalStock: "0", comboItems: [{ name: "", weight: "", image: "" }], comboDetails: { mrp: "", offerPercent: "", offerPrice: "" }, status: "Active"
      }));
    }
  }, [editItem, combos]);

  useEffect(() => {
    if (manualWeight) return;

    const totalW = form.comboItems.reduce((sum, item) => {
      const wStr = String(item.weight || "").toLowerCase().trim();
      const val = parseFloat(wStr) || 0;
      const factor = wStr.includes("kg") ? 1000 : 1;
      return sum + (val * factor);
    }, 0);

    // Always update via functional updater — avoids stale closure of form.totalWeight
    setForm(prev => {
      if (prev.totalWeight === totalW && (manualStock || prev.totalStock === String(totalW))) return prev; 
      return {
        ...prev,
        totalWeight: totalW,
        comboDetails: { ...prev.comboDetails, totalWeight: totalW },
        totalStock: manualStock ? prev.totalStock : String(totalW),
      };
    });
  }, [form.comboItems, manualWeight]);

  useEffect(() => {
    if (form.productId && barcodeRef.current) {
      const code = form.barcodeValue || form.productId;
      try {
        JsBarcode(barcodeRef.current, code, { format: "CODE128", lineColor: "#ea580c", width: 2, height: 40, displayValue: true });
        const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
        const base64Data = `data:image/svg+xml;base64,${btoa(svgData)}`;
        if (form.barcode !== base64Data) setForm((prev) => ({ ...prev, barcode: base64Data, barcodeValue: code }));
      } catch (e) { }
    }
  }, [form.productId, form.barcodeValue]);

  const handleImageUpload = async (e) => {
    const rawFiles = Array.from(e.target.files);
    try {
      toast.loading("Uploading...", { id: "up-c" });
      const base64 = await Promise.all(
        rawFiles.map((file) =>
          imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }).then((blob) => {
            return new Promise((res) => {
              const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob);
            });
          }),
        ),
      );
      setForm((prev) => ({ ...prev, images: [...prev.images, ...base64] }));
      toast.success("Ready!", { id: "up-c" });
    } catch { toast.error("Fail", { id: "up-c" }); }
    finally { e.target.value = ""; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Force-merge totalWeight into comboDetails at submit time.
      // This is necessary because the useEffect that writes it into comboDetails
      // is async and may not have flushed before the user clicks submit.
      const submitData = {
        ...form,
        comboDetails: {
          ...form.comboDetails,
          totalWeight: form.totalWeight,   // always include the correct value
          offerPrice: form.comboDetails.offerPrice || 0,
          mrp: form.comboDetails.mrp || 0,
        },
      };

      if (editItem) {
        await api.put(`/combos/${editItem.id}`, submitData);
        toast.success("Combo Registry Updated");
      } else {
        await api.post("/combos", submitData);
        toast.success("Pack Registered");
      }
      onSuccess();
    } catch { toast.error("Submission Failure"); }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-amber-100 ring-1 ring-amber-50">
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-400 p-10 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div><h2 className="text-3xl font-black uppercase tracking-tight">Combo Studio</h2><p className="opacity-90 font-medium mt-1 text-amber-50 uppercase tracking-[0.2em] text-xs">Premium Pack Creation</p></div>
          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30"><span className="font-black tracking-widest text-sm">{form.productId}</span></div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="space-y-12">
          {/* Pack Identity - Full Width */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-amber-500 rounded-full"></div> Pack Identity & Scope</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Combo Pack Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 font-bold text-gray-900 shadow-sm" placeholder="e.g. Healthy Morning Combo" /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Description *</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows="4" className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 outline-none resize-none font-medium text-gray-700 shadow-sm" placeholder="Describe pack contents..." /></div>
              </div>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-dashed border-amber-200 shadow-inner flex flex-col items-center justify-center relative group min-h-[160px]">
                  <div className="absolute top-4 left-6"><span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Pack Barcode</span></div>
                  <div className="mt-4"><svg ref={barcodeRef}></svg></div>
                  <p className="mt-3 text-[9px] font-bold text-gray-400 font-mono tracking-widest">{form.productId}</p>
                </div>
                <div className="bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Combo Strategy Registry</h4>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 bg-white p-3 rounded-xl border border-amber-100 text-center shadow-sm"><p className="text-[9px] font-black text-gray-400 uppercase">Items</p><p className="text-xl font-black text-amber-600">{form.comboItems.length}</p></div>
                    <div className="flex-1 bg-white p-3 rounded-xl border border-amber-100 text-center shadow-sm">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Total Weight</p>
                      <p className="text-sm font-black text-amber-600">{form.totalWeight >= 1000 ? (form.totalWeight / 1000).toFixed(2) + "kg" : form.totalWeight + "g"}</p>
                    </div>
                  </div>
                  {/* Weight breakdown per item */}
                  {form.comboItems.some(item => item.weight) && (
                    <div className="bg-white rounded-xl border border-amber-100 p-3 mb-3">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Weight Breakdown</p>
                      <div className="space-y-1">
                        {form.comboItems.map((item, idx) => {
                          if (!item.weight) return null;
                          const wStr = String(item.weight).toLowerCase();
                          const val = parseFloat(wStr) || 0;
                          const inGrams = wStr.includes("kg") ? val * 1000 : val;
                          return (
                            <div key={idx} className="flex justify-between text-[10px]">
                              <span className="text-gray-500 truncate max-w-[120px]">{item.name || `Item ${idx+1}`}</span>
                              <span className="font-black text-amber-700">{item.weight} = {inGrams}g</span>
                            </div>
                          );
                        })}
                        <div className="border-t border-dashed border-amber-200 mt-1 pt-1 flex justify-between text-[10px]">
                          <span className="font-black text-amber-900">Total</span>
                          <span className="font-black text-amber-900">{form.totalWeight}g {form.totalWeight >= 1000 ? `(${(form.totalWeight/1000).toFixed(2)}kg)` : ""}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Status *</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-4 py-2.5 outline-none font-black text-amber-800 shadow-sm text-sm"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    <div className="hidden"></div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      Total Weight
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${manualWeight ? 'bg-orange-100 text-orange-500' : 'bg-amber-100 text-amber-600'}`}>
                        {manualWeight ? 'Manual' : 'Auto'}
                      </span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={form.totalWeight}
                        onChange={(e) => { 
                          const val = Number(e.target.value);
                          setManualWeight(true); 
                          setForm({ 
                            ...form, 
                            totalWeight: val,
                            // Keep comboDetails in sync so DB receives the override
                            comboDetails: { ...form.comboDetails, totalWeight: val },
                          }); 
                        }}
                        className={`w-full rounded-xl px-4 py-2.5 font-black border-2 shadow-sm outline-none transition-all text-sm ${
                          manualWeight
                            ? 'bg-orange-50 border-orange-300 text-orange-700 focus:border-orange-400'
                            : 'bg-white border-amber-100 text-amber-700 focus:border-amber-400'
                        }`}
                        placeholder="Enter grams"
                      />
                      {manualWeight && (
                        <button
                          type="button"
                          title="Reset to Auto"
                          onClick={() => setManualWeight(false)}
                          className="flex-shrink-0 w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-md transition-all text-sm"
                        >↺</button>
                      )}
                    </div>
                    <p className="text-[8px] text-gray-400 font-medium mt-1">{manualWeight ? 'Overriding · click ↺ to sync from items' : 'Auto-summed from combo items'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-orange-500 rounded-full"></div> Pack Photography</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative aspect-square border-4 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-amber-200 hover:bg-amber-50/20 transition-all cursor-pointer group">
                  <input type="file" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0" /><FaPlus className="text-amber-500 group-hover:scale-125 transition-transform" /><span className="text-[9px] font-black text-gray-400 uppercase">Upload</span>
                </div>
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square group rounded-[1.5rem] overflow-hidden border shadow-sm ring-4 ring-white hover:ring-amber-500 transition-all">
                    <img src={img} className="w-full h-full object-cover" alt="p" /><button type="button" onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-amber-500 rounded-full"></div> Health Analysis Points</h3>
                <button type="button" onClick={() => setForm({ ...form, healthBenefits: [...form.healthBenefits, ""] })} className="bg-amber-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2">Add Point</button>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-amber-100">
                {form.healthBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex gap-3 group">
                    <input
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...form.healthBenefits];
                        newBenefits[idx] = e.target.value;
                        setForm({ ...form, healthBenefits: newBenefits });
                      }}
                      className="flex-1 bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-xl px-5 py-3 outline-none font-bold text-sm text-gray-800 transition-all shadow-inner"
                      placeholder="e.g. Immunity Support Factor"
                    />
                    {form.healthBenefits.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, healthBenefits: form.healthBenefits.filter((_, i) => i !== idx) })} className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all">
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col">
              <div className="flex justify-between items-center mb-10"><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3"><div className="w-2 h-8 bg-blue-500 rounded-full"></div> Included Range</h3><button type="button" onClick={() => setForm((p) => ({ ...p, comboItems: [...p.comboItems, { name: "", weight: "" }] }))} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><FaPlus size={10} /> Add Item</button></div>
              <div className="space-y-4">
                {form.comboItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center bg-gray-50/50 p-5 rounded-3xl border border-gray-100 hover:bg-white hover:border-blue-100 transition-all group shadow-sm">
                    <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 group/img">
                      {item.image ? (
                        <img src={item.image} alt="p" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200"><FaBoxOpen size={16} /></div>
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if(!file) return;
                            try {
                              const compressed = await imageCompression(file, { maxSizeMB: 0.05, maxWidthOrHeight: 300, useWebWorker: true });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const u = [...form.comboItems];
                                u[i].image = reader.result;
                                setForm({ ...form, comboItems: u });
                              };
                              reader.readAsDataURL(compressed);
                            } catch (err) { toast.error("Upload failed"); }
                            finally { e.target.value = ""; }
                          }}
                        />
                        <FaEdit className="text-white text-xs" />
                      </label>
                    </div>
                    <div className="flex-1 relative">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Item Identity</label>
                      <div className="relative">
                        <select 
                          value={item.name} 
                          onChange={(e) => { 
                            const val = e.target.value;
                            const u = [...form.comboItems]; 
                            const matchedProd = products.find(p => p.name === val);
                            if (matchedProd) {
                              const variants = typeof matchedProd.variants === 'string' ? JSON.parse(matchedProd.variants || '[]') : matchedProd.variants;
                              const images = typeof matchedProd.images === 'string' ? JSON.parse(matchedProd.images || '[]') : matchedProd.images;
                              u[i].name = matchedProd.name;
                              u[i].weight = variants[0]?.weight || "";
                              u[i].image = images[0] || "";
                            } else {
                              u[i].name = val;
                            }
                            setForm({ ...form, comboItems: u }); 
                          }} 
                          className="w-full outline-none font-black bg-transparent text-gray-900 border-none p-0 focus:ring-0 cursor-pointer text-xs appearance-none pr-6"
                        >
                          <option value="">Choose Existing Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name} — {p.productId}
                            </option>
                          ))}
                          <option value="custom">-- Custom Item --</option>
                        </select>
                        <MdKeyboardArrowDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div className="w-30 border-l border-gray-100 pl-5 flex flex-col">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Weight</label>
                      {(() => {
                        const matchedProd = products.find(p => p.name === item.name);
                        const variants = matchedProd ? (typeof matchedProd.variants === 'string' ? JSON.parse(matchedProd.variants || '[]') : (matchedProd.variants || [])) : [];
                        
                        if (variants.length > 0) {
                          return (
                            <div className="relative">
                              <select 
                                value={item.weight}
                                onChange={(e) => {
                                  const u = [...form.comboItems];
                                  u[i].weight = e.target.value;
                                  setForm({ ...form, comboItems: u });
                                }}
                                className="w-full outline-none text-blue-600 font-black bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-xs appearance-none pr-6"
                              >
                                {!item.weight && <option value="">Select</option>}
                                {variants.map((v, idx) => (
                                  <option key={idx} value={v.weight}>{v.weight}</option>
                                ))}
                              </select>
                              <MdKeyboardArrowDown className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={14} />
                            </div>
                          );
                        }
                        
                        return (
                          <input 
                            placeholder="Weight" 
                            value={item.weight} 
                            onChange={(e) => { 
                              const u = [...form.comboItems]; 
                              u[i].weight = e.target.value; 
                              setForm({ ...form, comboItems: u }); 
                            }} 
                            className="w-full outline-none text-blue-600 font-black bg-transparent border-none p-0 focus:ring-0 text-xs placeholder:text-gray-300"
                          />
                        );
                      })()}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setForm((p) => ({ ...p, comboItems: p.comboItems.filter((_, idx) => idx !== i) }))} 
                      className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100 shadow-xl overflow-hidden relative">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/40 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="mb-10"><h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">Financial Summary</h3><div className="w-12 h-1.5 bg-amber-500 mt-1 rounded-full"></div></div>
                <div className="space-y-8">
                  {/* Total Stock Field (Grams -> KG) */}
                  <div>
                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 block ml-1">
                      Inventory Level (Grams) *
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 1000"
                        value={form.totalStock}
                        onChange={(e) => {
                          setManualStock(true);
                          setForm({ ...form, totalStock: e.target.value });
                        }}
                        className={`w-full border-2 rounded-2xl px-6 py-4 font-black shadow-sm transition-all ${
                          manualStock ? 'bg-orange-50 border-orange-300 text-orange-900' : 'bg-white border-transparent text-amber-900 focus:border-amber-500'
                        }`}
                        required
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium ml-1 mt-1">
                      {manualStock ? "Manual weight entry" : "Auto-calculated from combo items"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div><label className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 block ml-1">Market MRP (₹)</label><input type="number" placeholder="e.g. 1500" value={form.comboDetails.mrp} onChange={(e) => { const u = { ...form.comboDetails }; u.mrp = e.target.value; u.offerPrice = Math.round(Number(u.mrp) - (Number(u.mrp) * Number(u.offerPercent)) / 100); setForm({ ...form, comboDetails: u }); }} className="w-full bg-white border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 font-black shadow-sm" /></div>
                    <div><label className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 block ml-1">Special Discount %</label><input type="number" placeholder="e.g. 15" value={form.comboDetails.offerPercent} onChange={(e) => { const u = { ...form.comboDetails }; u.offerPercent = e.target.value; u.offerPrice = Math.round(Number(u.mrp) - (Number(u.mrp) * Number(u.offerPercent)) / 100); setForm({ ...form, comboDetails: u }); }} className="w-full bg-white border-2 border-transparent focus:border-amber-500 rounded-2xl px-6 py-4 font-black shadow-sm" /></div>
                  </div>
                  <div className="bg-gradient-to-br from-white to-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-200 shadow-2xl relative group">
                    <label className="text-[11px] font-black text-amber-600 uppercase tracking-[0.25em] mb-2 block">Premium Strategy Price</label>
                    <div className="text-5xl font-black text-amber-900 flex items-baseline gap-2 transition-transform group-hover:scale-105 duration-500"><span className="text-2xl font-medium opacity-50">₹</span>{form.comboDetails.offerPrice || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-10 flex justify-end">
          <button type="submit" disabled={loading} className="bg-gradient-to-tr from-amber-600 to-orange-400 px-24 py-5 rounded-[2rem] text-white font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"> {loading ? (editItem ? "Updating Entry..." : "Executing Entry...") : (editItem ? "Update Premium Combo" : "Finalize Premium Combo")}</button>
        </div>
      </form>
    </div>
  );
};

export default Products;
