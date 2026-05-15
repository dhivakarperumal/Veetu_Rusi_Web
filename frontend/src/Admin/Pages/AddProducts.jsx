import React, { useState, useEffect } from "react";
import {
    FiArrowLeft,
    FiSave,
    FiTag,
    FiBox,
    FiLayers,
    FiImage,
    FiUploadCloud,
    FiTrash2,
    FiInfo,
    FiMaximize,
    FiScissors,
    FiPlus,
    FiDroplet,
    FiPercent,
    FiActivity,
    FiStar,
    FiHash
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import imageCompression from "browser-image-compression";

// Helper: Color to Name Utility
const boutiqueColors = [
    { name: "Pure Red", hex: "#FF0000" },
    { name: "Crimson", hex: "#DC143C" },
    { name: "Deep Maroon", hex: "#800000" },
    { name: "Rose Pink", hex: "#FFC0CB" },
    { name: "Hot Pink", hex: "#FF69B4" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Royal Purple", hex: "#800080" },
    { name: "Violet", hex: "#EE82EE" },
    { name: "Indigo", hex: "#4B0082" },
    { name: "Navy Blue", hex: "#000080" },
    { name: "Royal Blue", hex: "#4169E1" },
    { name: "Sky Blue", hex: "#87CEEB" },
    { name: "Teal", hex: "#008080" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Emerald Green", hex: "#50C878" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Olive Green", hex: "#808000" },
    { name: "Lime Green", hex: "#32CD32" },
    { name: "Golden Yellow", hex: "#FFD700" },
    { name: "Mustard", hex: "#FFDB58" },
    { name: "Bright Orange", hex: "#FFA500" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Peach", hex: "#FFDAB9" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Cream", hex: "#FFFDD0" },
    { name: "Pure White", hex: "#FFFFFF" },
    { name: "Jet Black", hex: "#000000" },
    { name: "Steel Grey", hex: "#808080" },
    { name: "Silver Tone", hex: "#C0C0C0" },
    { name: "Chocolate Brown", hex: "#8B4513" },
    { name: "Copper", hex: "#B87333" },
    { name: "Terracotta", hex: "#E2725B" },
    { name: "Turquoise", hex: "#40E0D0" }
];

const getNearestColorName = (hex) => {
    hex = hex.replace("#", "");
    const r1 = parseInt(hex.substring(0, 2), 16);
    const g1 = parseInt(hex.substring(2, 4), 16);
    const b1 = parseInt(hex.substring(4, 6), 16);

    let minDistance = Infinity;
    let nearestName = "Custom Shade";

    boutiqueColors.forEach(color => {
        const h = color.hex.replace("#", "");
        const r2 = parseInt(h.substring(0, 2), 16);
        const g2 = parseInt(h.substring(2, 4), 16);
        const b2 = parseInt(h.substring(4, 6), 16);

        const distance = Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestName = color.name;
        }
    });

    return nearestName;
};

const AddProducts = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    // Main State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "Saree",
        subcategory: "",
        mrp: "",
        offer: "",
        offer_price: "",
        product_code: "",
        total_stock: "0",
        rating: "5",
        status: "Active",
        material: "",
        wash_care: "Dry Clean Only",
        // Traditional Wear Specs
        saree_length: "5.5 Meters",
        blouse_length: "0.8 Meters",
        top_length: "",
        bottom_length: "",
        dupatta_length: "",
        gown_length: "",
        sleeve_type: "",
        neck_type: "",
        fit_type: "",
        work_type: "Embroidered",
        zari_color: "Gold Zari",
        age: "",
    });

    const [variants, setVariants] = useState([
        {
            color: "#3b82f6",
            colorName: "",
            images: [],
            selectedSizes: [],
            sizesStock: {}
        }
    ]);

    // Track if total stock was manually edited
    const [isStockManuallyEdited, setIsStockManuallyEdited] = useState(false);

    // 1. Auto-calculate Offer Price whenever MRP or Offer % changes
    useEffect(() => {
        const mrpValue = parseFloat(formData.mrp) || 0;
        const offerValue = parseFloat(formData.offer) || 0;
        if (mrpValue > 0) {
            const calculatedPrice = mrpValue - (mrpValue * (offerValue / 100));
            setFormData(prev => ({ ...prev, offer_price: Math.round(calculatedPrice).toString() }));
        } else {
            setFormData(prev => ({ ...prev, offer_price: "0" }));
        }
    }, [formData.mrp, formData.offer]);

    // 2. Auto-calculate Total Stock whenever variants or sizesStock change
    useEffect(() => {
        if (!isStockManuallyEdited) {
            let total = 0;
            variants.forEach(variant => {
                Object.values(variant.sizesStock || {}).forEach(qty => {
                    total += parseInt(qty) || 0;
                });
            });
            setFormData(prev => ({ ...prev, total_stock: total.toString() }));
        }
    }, [variants, isStockManuallyEdited]);

    // Size Logic based on Category
    const getSizesByCategory = () => {
        switch (formData.category) {
            case "Saree": return ["Free Size"];
            case "Lehenga":
            case "Salwar":
            case "Gown": return ["XS", "S", "M", "L", "XL", "XXL"];
            case "Material": return ["Free Size"];
            default: return [];
        }
    };

    const sizeOptions = getSizesByCategory();

    useEffect(() => {
        const fetchEssentialData = async () => {
            try {
                if (isEdit) {
                    const [catRes, editRes] = await Promise.all([
                        api.get("/categories"),
                        api.get(`/products/${id}`)
                    ]);

                    setCategories(Array.isArray(catRes.data) ? catRes.data : []);
                    try {
                        const p = editRes.data;
                        setFormData({
                            name: p.name || "",
                            description: p.description || "",
                            category: p.category || "Saree",
                            subcategory: p.subcategory || "",
                            mrp: p.mrp?.toString() || "",
                            offer: p.offer?.toString() || "",
                            offer_price: p.offer_price?.toString() || "",
                            product_code: p.product_code || "",
                            total_stock: p.total_stock?.toString() || "0",
                            rating: p.rating?.toString() || "5",
                            status: p.status || "Active",
                            material: p.material || "",
                            wash_care: p.wash_care || "Dry Clean Only",
                            saree_length: p.saree_length || "",
                            blouse_length: p.blouse_length || "",
                            top_length: p.top_length || "",
                            bottom_length: p.bottom_length || "",
                            dupatta_length: p.dupatta_length || "",
                            gown_length: p.gown_length || "",
                            sleeve_type: p.sleeve_type || "",
                            neck_type: p.neck_type || "",
                            fit_type: p.fit_type || "",
                            work_type: p.work_type || "",
                            zari_color: p.zari_color || "",
                            age: p.age || "",
                        });
                        if (p.variants) setVariants(Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants));
                    } catch (e) {
                        toast.error("Failed to fetch product details.");
                    } finally {
                        setFetching(false);
                    }
                } else {
                    const [catRes, codeRes] = await Promise.all([
                        api.get("/categories"),
                        api.get("/products/latest-code")
                    ]);
                    
                    setCategories(Array.isArray(catRes.data) ? catRes.data : []);
                    setFormData(prev => ({
                        ...prev,
                        category: Array.isArray(catRes.data) && catRes.data[0]?.name ? catRes.data[0].name : "Saree",
                        product_code: codeRes.data.latestCode || "SP001"
                    }));
                    setFetching(false);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setFetching(false);
            }
        };
        fetchEssentialData();
    }, [id, isEdit]);

    // Update Subcategories when Category changes
    useEffect(() => {
        const selectedCat = categories.find(c => c.name === formData.category);
        if (selectedCat && selectedCat.subcategory) {
            setSubcategories(selectedCat.subcategory);
            // Only auto-select first subcat if it's currently empty
            if (!formData.subcategory) {
                setFormData(prev => ({ ...prev, subcategory: selectedCat.subcategory[0] || "" }));
            }
        } else {
            setSubcategories([]);
            if (!isEdit) setFormData(prev => ({ ...prev, subcategory: "" }));
        }
    }, [formData.category, categories, isEdit]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === "total_stock") setIsStockManuallyEdited(true);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reset stock to auto-calculate
    const resetStockCalculation = () => {
        setIsStockManuallyEdited(false);
    };

    // Variant Operations
    const addVariant = () => {
        const sizes = getSizesByCategory();
        const initialVariant = {
            color: "#3b82f6",
            colorName: "",
            images: [],
            selectedSizes: sizes.length === 1 ? [sizes[0]] : [],
            sizesStock: sizes.length === 1 ? { [sizes[0]]: 0 } : {}
        };
        setVariants([...variants, initialVariant]);
    };

    const removeVariant = (index) => {
        if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        const newVariant = { ...updated[index], [field]: value };

        // Auto-set colorName if color is updated
        if (field === "color") {
            newVariant.colorName = getNearestColorName(value);
        }

        updated[index] = newVariant;
        setVariants(updated);
    };

    const toggleSize = (vIndex, size) => {
        const updated = [...variants];
        const selected = updated[vIndex].selectedSizes || [];
        if (selected.includes(size)) {
            updated[vIndex].selectedSizes = selected.filter(s => s !== size);
            delete updated[vIndex].sizesStock[size];
        } else {
            updated[vIndex].selectedSizes = [...selected, size];
            if (!updated[vIndex].sizesStock) updated[vIndex].sizesStock = {};
            updated[vIndex].sizesStock[size] = 0; // Default stock 0
        }
        setVariants(updated);
    };

    const handleStockChange = (vIndex, size, value) => {
        const updated = [...variants];
        if (!updated[vIndex].sizesStock) updated[vIndex].sizesStock = {};
        updated[vIndex].sizesStock[size] = parseInt(value) || 0;
        setVariants(updated);
    };

    const handleVariantImageUpload = async (vIndex, e) => {
        try {
            const files = Array.from(e.target.files);

            // Limit to 5 images per variant for performance
            if ((variants[vIndex].images?.length || 0) + files.length > 5) {
                toast.error("Boutique limit: Max 5 images per shade.");
                return;
            }

            const imagesArray = await Promise.all(
                files.map(async (file) => {
                    // Stricter compression to fit in database packet limits
                    const options = {
                        maxSizeMB: 0.5, // Aim for ~200KB per image max
                        maxWidthOrHeight: 1000,
                        useWebWorker: true
                    };
                    const compressed = await imageCompression(file, options);
                    return imageCompression.getDataUrlFromFile(compressed);
                })
            );
            const updated = [...variants];
            updated[vIndex].images = [...(updated[vIndex].images || []), ...imagesArray];
            setVariants(updated);
            toast.success(`Success! ${files.length} boutique images added.`);
        } catch (error) {
            toast.error("Upload failed.");
        }
    };

    const removeVariantImage = (vIndex, imgIndex) => {
        const updated = [...variants];
        updated[vIndex].images = updated[vIndex].images.filter((_, i) => i !== imgIndex);
        setVariants(updated);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.name || !formData.category || !formData.mrp) {
            toast.error("Please fill in the essentials.");
            return;
        }

        setLoading(true);
        try {
            const finalData = { ...formData, variants };
            if (isEdit) {
                await api.put(`/products/${id}`, finalData);
                toast.success("Artisan masterpiece updated!");
            } else {
                await api.post("/products", finalData);
                toast.success("Artisan piece listed successfully!");
            }
            setTimeout(() => navigate("/admin/products/all"), 1500);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.response?.data?.message || "Operation failed.");
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Fetching boutique details...</p>
        </div>
    );
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">


            {/* Premium Sticky Header Overlay */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm active:scale-95 shadow-blue-500/5">
                        <FiArrowLeft size={20} />
                    </button>
                    <div>

                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Categorization & Identity */}
                    <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-blue-600">
                            <FiLayers size={200} />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiLayers size={20} /></span>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Product Foundation</h2>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <FiHash className="text-blue-600" />
                                    <span className="text-sm font-black text-blue-600 tracking-widest">{formData.product_code || 'Generating...'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] sm:text-xs  font-black text-gray-400 uppercase tracking-widest ml-1">Main Collection Category *</label>
                                    <select name="category" value={formData.category} onChange={handleFormChange} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-base font-black text-slate-800 shadow-inner cursor-pointer appearance-none">
                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FiStar className="text-amber-500" /> Boutique Rating</label>
                                    <select name="rating" value={formData.rating} onChange={handleFormChange} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-base font-black text-slate-800 shadow-inner cursor-pointer appearance-none">
                                        <option value="1">1 Star </option>
                                        <option value="2">2 Stars</option>
                                        <option value="3">3 Stars</option>
                                        <option value="4">4 Stars</option>
                                        <option value="5">5 Stars (Excellent)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Age Group (Optional)</label>
                                <select
                                    name="age"
                                    value={formData.age}
                                    onChange={handleFormChange}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-base font-bold text-slate-800 shadow-inner cursor-pointer appearance-none"
                                >
                                    <option value="">Select Age Group</option>
                                    <option value="Infant (0–1)">Infant (0–1)</option>
                                    <option value="Toddler (1–3)">Toddler (1–3)</option>
                                    <option value="Kids (3–5)">Kids (3–5)</option>
                                    <option value="Kids (5–7)">Kids (5–7)</option>
                                    <option value="Kids (7–10)">Kids (7–10)</option>
                                    <option value="Teen (10–15)">Teen (10–15)</option>
                                    <option value="Teen (15–20)">Teen (15–20)</option>
                                    <option value="Adult (20+)">Adult (20+)</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Creation Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Handwoven Banarasi Silk" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-base font-bold text-slate-800 shadow-inner" required />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">The Craft Story</label>
                                <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" placeholder="Describe the heritage..." className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-sm font-medium text-gray-600 shadow-inner resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Industrial Pricing & Stock */}
                    <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900 group-hover:scale-110 transition-transform">
                            <FaRupeeSign size={150} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 bg-white/5 text-gray-900 rounded-xl"><FaRupeeSign size={20} /></span>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Premium Commercials</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Market MRP *</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-900 font-black text-lg">₹</span>
                                        <input type="number" name="mrp" value={formData.mrp} onChange={handleFormChange} className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[1.2rem] outline-none focus:bg-white focus:border-blue-500/20 transition-all text-xl font-black text-slate-900" required />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Offer (%)</label>
                                    <div className="relative">
                                        <FiPercent className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 font-black" />
                                        <input type="number" name="offer" value={formData.offer} onChange={handleFormChange} className="w-full pl-10 pr-4 py-4 bg-amber-50/50 border border-amber-100 rounded-[1.2rem] outline-none focus:bg-white focus:border-amber-500/20 transition-all text-xl font-black text-amber-600" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1">Offer Price</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">₹</span>
                                        <input type="number" value={formData.offer_price} readOnly className="w-full pl-10 pr-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-[1.2rem] text-xl font-black text-emerald-600 cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-3 relative group">
                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-1 flex items-center justify-between">
                                        Total Stock
                                        {isStockManuallyEdited && (
                                            <button onClick={resetStockCalculation} className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full hover:bg-blue-500 transition-colors uppercase tracking-widest">Auto Set</button>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <FiActivity className={`absolute left-5 top-1/2 -translate-y-1/2 ${isStockManuallyEdited ? 'text-amber-500' : 'text-blue-500'}`} />
                                        <input type="number" name="total_stock" value={formData.total_stock} onChange={handleFormChange} className={`w-full pl-10 pr-4 py-4 bg-blue-50/50 border border-blue-100 rounded-[1.2rem] outline-none transition-all text-xl font-black ${isStockManuallyEdited ? 'text-amber-500 border-amber-500/30' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vitals & Specs */}
                    <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 p-8 opacity-[0.03] text-indigo-600">
                            <FiScissors size={200} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FiMaximize size={20} /></span>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vitals & Artisanship</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Core Fabric</label>
                                    <input type="text" name="material" value={formData.material} onChange={handleFormChange} placeholder="Mulberry Silk" className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Embroidery/Work</label>
                                    <input type="text" name="work_type" value={formData.work_type} onChange={handleFormChange} placeholder="Zardozi" className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FiDroplet className="text-blue-500" /> Caring Instructions</label>
                                    <select name="wash_care" value={formData.wash_care} onChange={handleFormChange} className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 cursor-pointer">
                                        <option value="Dry Clean Only">Dry Clean Only</option>
                                        <option value="Mild Hand Wash">Mild Hand Wash</option>
                                        <option value="Cold Machine Wash">Cold Machine Wash</option>
                                        <option value="Petrol Wash Specialized">Petrol Wash Specialized</option>
                                        <option value="No Bleach, Line Dry">No Bleach, Line Dry</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gallery Tier</label>
                                    <select name="subcategory" value={formData.subcategory} onChange={handleFormChange} className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 cursor-pointer disabled:opacity-30" disabled={subcategories.length === 0}>
                                        <option value="">Default Boutique</option>
                                        {subcategories.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Size & Fit Section */}
                    <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 p-8 opacity-[0.03] text-emerald-600">
                            <FiMaximize size={200} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FiMaximize size={20} /></span>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Size & Fit</h2>
                            </div>

                            {formData.category === "Saree" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Saree Length</label>
                                        <input
                                            type="text"
                                            name="saree_length"
                                            value={formData.saree_length}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 5.5 Meters"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Blouse Length</label>
                                        <input
                                            type="text"
                                            name="blouse_length"
                                            value={formData.blouse_length}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 0.8 Meters"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            )}

                            {(formData.category === "Lehenga" ||
                                formData.category === "Salwar" ||
                                formData.category === "Material") && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Top / Lehenga Length</label>
                                            <input
                                                type="text"
                                                name="top_length"
                                                value={formData.top_length}
                                                onChange={handleFormChange}
                                                placeholder="Length"
                                                className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Bottom Length</label>
                                            <input
                                                type="text"
                                                name="bottom_length"
                                                value={formData.bottom_length}
                                                onChange={handleFormChange}
                                                placeholder="Length"
                                                className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dupatta Length</label>
                                            <input
                                                type="text"
                                                name="dupatta_length"
                                                value={formData.dupatta_length}
                                                onChange={handleFormChange}
                                                placeholder="Length"
                                                className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}

                            {formData.category === "Gown" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gown Length</label>
                                        <input
                                            type="text"
                                            name="gown_length"
                                            value={formData.gown_length}
                                            onChange={handleFormChange}
                                            placeholder="Length"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sleeve Type</label>
                                        <input
                                            type="text"
                                            name="sleeve_type"
                                            value={formData.sleeve_type}
                                            onChange={handleFormChange}
                                            placeholder="Full Sleeve / Half Sleeve"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Neck Type</label>
                                        <input
                                            type="text"
                                            name="neck_type"
                                            value={formData.neck_type}
                                            onChange={handleFormChange}
                                            placeholder="V-Neck / Round Neck"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fit Type</label>
                                        <input
                                            type="text"
                                            name="fit_type"
                                            value={formData.fit_type}
                                            onChange={handleFormChange}
                                            placeholder="Regular Fit / Slim Fit"
                                            className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inventory Manager */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between sticky top-[100px] z-20 bg-gray-50/90 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <FiBox className="text-orange-500" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Shade & Inventory</h3>
                        </div>
                        <button type="button" onClick={addVariant} className="bg-slate-900 text-white p-2 rounded-xl active:scale-90 transition-all shadow-lg hover:bg-black"><FiPlus /></button>
                    </div>

                    {variants.map((v, vIndex) => (
                        <div key={vIndex} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative group animate-in zoom-in-95 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative group/color">
                                            <input
                                                type="color"
                                                value={v.color}
                                                onChange={(e) => handleVariantChange(vIndex, "color", e.target.value)}
                                                className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform group-hover/color:scale-110"
                                            />
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                                <div className="w-2 h-2 rounded-full border border-gray-200" style={{ backgroundColor: v.color }}></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <select
                                                value={v.colorName}
                                                onChange={(e) => {
                                                    const selected = boutiqueColors.find(bc => bc.name === e.target.value);
                                                    if (selected) {
                                                        handleVariantChange(vIndex, "color", selected.hex);
                                                        handleVariantChange(vIndex, "colorName", selected.name);
                                                    } else {
                                                        handleVariantChange(vIndex, "colorName", e.target.value);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-slate-800 outline-none focus:bg-white focus:border-blue-500/30 transition-all uppercase tracking-widest shadow-inner cursor-pointer"
                                            >
                                                <option value="">Select Boutique Shade</option>
                                                {boutiqueColors.map(bc => <option key={bc.hex} value={bc.name}>{bc.name}</option>)}
                                                {v.colorName && !boutiqueColors.find(bc => bc.name === v.colorName) && <option value={v.colorName}>{v.colorName}</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight ml-1">Selected Hex: <span className="text-blue-500 font-black">{v.color}</span></p>
                                </div>
                                <button type="button" onClick={() => removeVariant(vIndex)} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><FiTrash2 size={16} /></button>
                            </div>

                            {/* Inventory per Shade */}
                            <div className="space-y-4 pt-2 border-t border-gray-50">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shade Stock Management</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {sizeOptions.map(sz => (
                                        <button key={sz} type="button" onClick={() => toggleSize(vIndex, sz)} className={`px-3 py-2 rounded-xl text-[9px] font-black tracking-tighter transition-all ${v.selectedSizes.includes(sz) ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{sz}</button>
                                    ))}
                                </div>
                                {v.selectedSizes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in slide-in-from-top-1">
                                        {v.selectedSizes.map(sz => (
                                            <div key={sz} className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">{sz}</p>
                                                    <input type="number" value={v.sizesStock[sz]} onChange={(e) => handleStockChange(vIndex, sz, e.target.value)} className="w-full bg-transparent border-none ouline-none p-0 text-sm font-black text-slate-800 focus:ring-0 leading-none" />
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {v.images.slice(0, 5).map((img, iIndex) => (
                                    <div key={iIndex} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group/img">
                                        <img src={img} alt="V" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" />
                                        <button type="button" onClick={() => removeVariantImage(vIndex, iIndex)} className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><FiTrash2 size={16} /></button>
                                    </div>
                                ))}
                                {v.images.length < 5 && (
                                    <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-white hover:border-blue-500 group/label transition-all shadow-inner">
                                        <FiUploadCloud size={24} className="text-gray-300 group-hover/label:text-blue-500 transition-colors scale-125" />
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleVariantImageUpload(vIndex, e)} />
                                    </label>
                                )}
                            </div>


                        </div>
                    ))}
                </div>

                {/* Bottom Global Action Button */}
                <div className="lg:col-span-3 pt-10 pb-20 border-t border-gray-100 mt-10">
                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-4 bg-slate-900 border-4 border-white hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-4 px-10 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold animate-pulse">Processing Masterpiece...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-2 bg-white/10 rounded-xl group-hover:bg-blue-500 transition-colors">
                                        <FiSave className="text-2xl" />
                                    </div>
                                    <span>{isEdit ? 'Update Product' : 'Add Products'}</span>
                                    <FiPlus className="text-white/40 group-hover:text-white transition-colors" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProducts;