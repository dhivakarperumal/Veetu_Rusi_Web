import { useState, useEffect, useMemo } from "react";
import {
    FiArrowLeft,
    FiBox,
    FiLayers,
    FiUploadCloud,
    FiTrash2,
    FiPlus,
    FiActivity,
    FiStar,
    FiHash
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast} from "react-hot-toast";




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
        category: "Food Product",
        product_type: "Food Product", // Food | Food Product
        subcategory: "",
        mrp: "",
        offer: "",
        offer_price: "",
        product_code: "",
        total_stock: "0",
        rating: "5",
        status: "Active",
        material: "",
        nutrition_info: "",
        storage_instructions: "Keep Refrigerated",
        presentation_style: "",
        portion_format: "",
        service_type: "",
        packaging_notes: "",
        dietary_tag: "",
        heat_profile: "",
        serving_size: "",
        prep_time: "",
        ingredients: "",
        spice_level: "Medium",
        shelf_life_days: "",
        net_weight: "",
        package_count: "",
        packaging_type: "Pouch",
        manufacture_date: "",
        packaging_image: "",
        images: []
    });

    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const steps = [
        { id: 'details', label: 'Dish Details' },
        { id: 'pricing', label: 'Pricing & Stock' },
        { id: 'product', label: 'Product Details' },
        { id: 'variants', label: 'Portion & Inventory' },
        { id: 'images', label: 'Images & Review' }
    ];

    const [variants, setVariants] = useState([
        {
            tag: "",
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => ({ ...prev, offer_price: Math.round(calculatedPrice).toString() }));
        } else {
             
            setFormData(prev => ({ ...prev, offer_price: "0" }));
        }
    }, [formData.mrp, formData.offer]);

    const computedFinalPrice = useMemo(() => {
        const mrpValue = parseFloat(formData.mrp) || 0;
        const offerValue = parseFloat(formData.offer) || 0;
        if (mrpValue <= 0) return "0";
        const calculated = mrpValue - mrpValue * (offerValue / 100);
        return Math.round(calculated).toString();
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => ({ ...prev, total_stock: total.toString() }));
        }
    }, [variants, isStockManuallyEdited]);

    // Portion size logic for chef products
    const getSizesByCategory = () => {
        return ["Single", "Half", "Family", "Party", "250g", "500g", "1kg"];
    };

    const sizeOptions = getSizesByCategory();

    useEffect(() => {
        const fetchEssentialData = async () => {
            setFetching(true);
            // Resolve admin user_id (who created this chef) to filter categories
            let adminUserId = null;
            try {
                const profileRes = await api.get('/auth/profile');
                const homeChef = profileRes.data?.homeChef || null;
                adminUserId = homeChef?.created_by || homeChef?.franchise_user_id || homeChef?.created_by_user_id || null;
            } catch (e) {
                console.warn('Could not fetch chef profile for category filtering', e);
            }

            if (isEdit) {
                // Fetch categories and the product independently so one failure doesn't block the other
                const [catsResult, productResult] = await Promise.allSettled([
                    api.get("/home-chef-categories"),
                    api.get(`/chef-foods/${id}`)
                ]);

                if (catsResult.status === 'fulfilled') {
                    let allCats = Array.isArray(catsResult.value.data) ? catsResult.value.data : [];
                    allCats = allCats.filter(cat => cat.category_type?.toLowerCase().includes('product') || cat.category_type === 'Product_food');
                    if (adminUserId) {
                        allCats = allCats.filter(cat =>
                            String(cat.created_by) === String(adminUserId) ||
                            String(cat.created_by_user_id) === String(adminUserId) ||
                            String(cat.franchise_user_id) === String(adminUserId)
                        );
                    }
                    setCategories(allCats);
                } else {
                    console.warn('Failed to load categories', catsResult.reason);
                }

                if (productResult.status === 'fulfilled') {
                    const p = productResult.value.data;
                    try {
                        setFormData({
                            name: p.name || "",
                            description: p.description || "",
                            category: p.category || "Food Product",
                            subcategory: p.subcategory || "",
                            mrp: p.mrp?.toString() || "",
                            offer: p.offer?.toString() || "",
                            offer_price: (p.offer_price || p.final_price)?.toString() || "",
                            product_code: p.product_code || "",
                            total_stock: p.total_stock?.toString() || "0",
                            rating: p.rating?.toString() || "5",
                            status: p.status || "Active",
                            material: p.material || "",
                            nutrition_info: p.nutrition_info || "",
                            storage_instructions: p.storage_instructions || "Keep Refrigerated",
                            presentation_style: p.presentation_style || "",
                            portion_format: p.portion_format || "",
                            service_type: p.service_type || "",
                            packaging_notes: p.packaging_notes || "",
                            dietary_tag: p.dietary_tag || "",
                            heat_profile: p.heat_profile || "",
                            serving_size: p.serving_size || "",
                            prep_time: p.prep_time || "",
                            ingredients: p.ingredients || "",
                            spice_level: p.spice_level || "Medium",
                            shelf_life_days: p.shelf_life_days || "",
                            net_weight: p.net_weight || "",
                            package_count: p.package_count || "",
                            packaging_type: p.packaging_type || "Pouch",
                            manufacture_date: p.manufacture_date || "" });
                        if (p.variants) setVariants(Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants));
                    } catch (e) {
                        console.error('Failed to parse product variants or set form data', e);
                        toast.error("Failed to load product details.");
                    }
                } else {
                    console.warn('Failed to load product for edit', productResult.reason);
                    toast.error('Failed to load product for editing');
                }

                setFetching(false);
                return;
            }

            // Not editing: load chef categories only
            try {
                const catsResult = await api.get("/home-chef-categories");

                if (Array.isArray(catsResult.data)) {
                    let filteredCats = catsResult.data.filter(cat => cat.category_type?.toLowerCase().includes('product') || cat.category_type === 'Product_food');
                    if (adminUserId) {
                        filteredCats = filteredCats.filter(cat =>
                            String(cat.created_by) === String(adminUserId) ||
                            String(cat.created_by_user_id) === String(adminUserId) ||
                            String(cat.franchise_user_id) === String(adminUserId)
                        );
                    }
                    setCategories(filteredCats);
                    setFormData(prev => ({
                        ...prev,
                        category: filteredCats[0]?.c_name || filteredCats[0]?.name || "Food Product",
                    }));
                } else {
                    console.warn('Unexpected category response', catsResult);
                }
            } catch (error) {
                console.error('Failed to load categories', error);
                // We shouldn't show a toast on every load if categories just aren't there yet,
                // but at least we'll stop the loading spinner.
            } finally {
                setFetching(false);
            }
        };
        fetchEssentialData();
    }, [id, isEdit]);

    // Update Subcategories when Category changes
    useEffect(() => {
        const selectedCat = categories.find(c => c.name === formData.category);
        if (selectedCat && selectedCat.subcategory) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSubcategories(selectedCat.subcategory);
            // Only auto-select first subcat if it's currently empty
            if (!formData.subcategory) {
                 
                setFormData(prev => ({ ...prev, subcategory: selectedCat.subcategory[0] || "" }));
            }
        } else {
            setSubcategories([]);
            if (!isEdit) setFormData(prev => ({ ...prev, subcategory: "" }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            tag: "",
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
        updated[index] = { ...updated[index], [field]: value };
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
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Limit to 5 images per variant
        if ((variants[vIndex].images?.length || 0) + files.length > 5) {
            toast.error("Max 5 images per variant.");
            return;
        }

        const toastId = toast.loading(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`);
        try {
            const formPayload = new FormData();
            files.forEach(file => formPayload.append('images', file));

            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

            const res = await fetch(`${baseUrl}/api/upload/images`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}`, 'x-access-token': token } : {},
                body: formPayload
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed');
            }

            const data = await res.json();
            const urls = data.urls || [];

            const updated = [...variants];
            updated[vIndex] = {
                ...updated[vIndex],
                images: [...(updated[vIndex].images || []), ...urls]
            };
            setVariants(updated);
            toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded!`, { id: toastId });
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(error.message || 'Image upload failed.', { id: toastId });
        }
    };

    const handlePackagingUpload = async (e) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
            const compressed = await imageCompression(file, options);
            const imageData = await imageCompression.getDataUrlFromFile(compressed);
            setFormData(prev => ({ ...prev, packaging_image: imageData }));
            toast.success('Packaging image added');
        } catch (err) {
            console.error(err);
            toast.error('Packaging image upload failed');
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

        // Type-specific validation
        if (formData.product_type === "Food") {
            if (!formData.serving_size || !formData.prep_time || !formData.ingredients || !formData.shelf_life_days) {
                toast.error("Please fill all required Food fields (serving size, prep time, ingredients, shelf life).");
                return;
            }
        }

        if (formData.product_type === "Food Product") {
            if (!formData.net_weight || !formData.ingredients || !formData.packaging_type || !formData.shelf_life_days) {
                toast.error("Please fill all required Food Product fields (net weight, ingredients, packaging, expiry).");
                return;
            }
        }

        setLoading(true);
        try {
            // Get user and chef information from auth/profile and localStorage
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            // Try to fetch the full chef profile to obtain franchise/created-by metadata
            let homeChef = null;
            try {
                const profileRes = await api.get('/auth/profile');
                homeChef = profileRes.data?.homeChef || null;
            } catch (e) {
                // ignore - we'll fallback to user data
                console.warn('Could not fetch chef profile for metadata fallback', e?.response?.data || e);
            }

            const chefUserId = userData.user_id || userData.id || null; // the chef's user_id label
            const chefId = homeChef?.chef_id || userData.chef_id || userData.id || null; // internal chef_id
            // Franchise / created-by should come from the homeChef record user_id / franchise_user_id)
            const franchiseUserId = homeChef?.created_by || homeChef?.franchise_user_id || null;

            // Build a clean payload matching chef_food_table columns
            const mrpNum = parseFloat(formData.mrp) || 0;
            const offerNum = parseFloat(formData.offer) || 0;
            const computedFinalPrice = formData.offer_price
                ? parseFloat(formData.offer_price)
                : mrpNum - mrpNum * (offerNum / 100);

            // Collect all images from all variants into a flat array
            const allVariantImages = variants.flatMap(v => v.images || []);

            const finalData = {
                // core food fields (chef_food_table columns)
                category: formData.category || "Food Product",
                product_type: formData.product_type || "Food Product",
                name: formData.name,
                description: formData.description || null,
                cuisine: formData.cuisine || null,
                prep_time: formData.prep_time || null,
                preparation_url: formData.preparation_url || null,
                shelf_life_days: formData.shelf_life_days ? Number(formData.shelf_life_days) : null,
                mrp: mrpNum,
                offer: offerNum,
                final_price: computedFinalPrice || mrpNum,
                dietary_tag: formData.dietary_tag || null,
                net_weight: formData.net_weight || null,
                packaging_type: formData.packaging_type || null,
                packaging_image: formData.packaging_image || null,
                ingredients: formData.ingredients || null,
                instructions: formData.instructions || formData.cooking_instructions || null,
                images: allVariantImages,
                status: formData.status || "Inactive",
                // chef identifiers
                franchise_user_id: franchiseUserId,
            };

            if (isEdit) {
                await api.put(`/chef-foods/${id}`, finalData);
                toast.success("Product updated successfully!");
            } else {
                await api.post("/chef-foods", finalData);
                toast.success("Product added to your menu successfully!");
            }
            setTimeout(() => navigate("/chef/products"), 1500);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.response?.data?.message || "Operation failed.");
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Fetching menu details...</p>
        </div>
    );
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">


            {/* Premium Sticky Header Overlay */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-[#0f1216] border border-slate-800 rounded-2xl text-slate-300 hover:text-blue-400 transition-all shadow-sm active:scale-95">
                        <FiArrowLeft size={20} />
                    </button>
                    <div>

                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
                <div className="space-y-8">
                    {/* Primary Categorization & Identity */}
                    {activeStepIndex === 0 && (
                    <div className="bg-[#111319] p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-sm relative overflow-hidden group text-slate-200">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] text-blue-600">
                            <FiLayers size={200} />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FiLayers size={20} /></span>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dish Details</h2>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <FiHash className="text-blue-600" />
                                    <span className="text-sm font-black text-blue-600 tracking-widest">{formData.product_code || 'Generating...'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] sm:text-xs  font-black text-gray-400 uppercase tracking-widest ml-1">Food Category *</label>
                                    <select name="category" value={formData.category} onChange={handleFormChange} className="w-full px-6 py-4 bg-[#0b0d10] border-2 border-transparent rounded-3xl outline-none focus:bg-[#0f1216] focus:border-emerald-500/20 transition-all text-base font-black text-white shadow-inner cursor-pointer appearance-none">
                                        {categories.length > 0 ? categories.map(cat => <option key={cat.id || cat.CatId} value={cat.c_name || cat.name || cat.CatId}>{cat.c_name || cat.name || cat.CatId}</option>) : (
                                            <>
                                                <option>Food Product</option>
                                                <option>Food</option>
                                                <option>Snacks</option>
                                                <option>Beverages</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FiStar className="text-amber-500" /> Chef Rating</label>
                                    <select name="rating" value={formData.rating} onChange={handleFormChange} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-blue-500/20 transition-all text-base font-black text-slate-800 shadow-inner cursor-pointer appearance-none">
                                        <option value="1">1 Star </option>
                                        <option value="2">2 Stars</option>
                                        <option value="3">3 Stars</option>
                                        <option value="4">4 Stars</option>
                                        <option value="5">5 Stars (Excellent)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cuisine Type (Optional)</label>
                                <select
                                    name="cuisine"
                                    value={formData.cuisine || ""}
                                    onChange={e => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-emerald-500/20 transition-all text-base font-bold text-slate-800 shadow-inner cursor-pointer appearance-none"
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
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dish Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Hyderabadi Biryani" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-emerald-500/20 transition-all text-base font-bold text-slate-800 shadow-inner" required />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dish Description</label>
                                <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" placeholder="Describe the dish, flavors and serving suggestions..." className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-emerald-500/20 transition-all text-sm font-medium text-gray-600 shadow-inner resize-none" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type *</label>
                                <select name="product_type" value={formData.product_type} onChange={handleFormChange} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:bg-white focus:border-emerald-500/20 transition-all text-base font-black text-slate-800 shadow-inner cursor-pointer appearance-none">
                                    <option value="Food">Food</option>
                                    <option value="Food Product">Food Product</option>
                                </select>
                            </div>

                            {/* Type-specific fields */}
                            {formData.product_type === "Food" ? (
                                <div className="space-y-6 bg-emerald-50/30 p-6 rounded-2xl">
                                    <h3 className="text-sm font-black text-emerald-700">Food Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Serving Size *</label>
                                            <input type="text" name="serving_size" value={formData.serving_size} onChange={handleFormChange} placeholder="e.g., 250g / 1 plate" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Preparation Time *</label>
                                            <input type="text" name="prep_time" value={formData.prep_time} onChange={handleFormChange} placeholder="e.g., 20 mins" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-600">Ingredients *</label>
                                            <textarea name="ingredients" value={formData.ingredients} onChange={handleFormChange} rows="3" placeholder="List main ingredients" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Spice Level</label>
                                            <select name="spice_level" value={formData.spice_level} onChange={handleFormChange} className="w-full px-4 py-3 rounded-lg bg-white border">
                                                <option>Low</option>
                                                <option>Medium</option>
                                                <option>High</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Shelf Life (days) *</label>
                                            <input type="number" name="shelf_life_days" value={formData.shelf_life_days} onChange={handleFormChange} placeholder="e.g., 2" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 bg-yellow-50/30 p-6 rounded-2xl">
                                    <h3 className="text-sm font-black text-amber-700">Food Product Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Net Weight (g) *</label>
                                            <input type="text" name="net_weight" value={formData.net_weight} onChange={handleFormChange} placeholder="e.g., 200" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Package Count</label>
                                            <input type="number" name="package_count" value={formData.package_count} onChange={handleFormChange} placeholder="e.g., 1" className="w-full px-4 py-3 rounded-lg bg-white border" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-600">Ingredients *</label>
                                            <textarea name="ingredients" value={formData.ingredients} onChange={handleFormChange} rows="3" placeholder="List ingredients and allergens" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Packaging Type *</label>
                                            <select name="packaging_type" value={formData.packaging_type} onChange={handleFormChange} className="w-full px-4 py-3 rounded-lg bg-white border">
                                                <option>Pouch</option>
                                                <option>Jar</option>
                                                <option>Box</option>
                                                <option>Packet</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Expiry (days) *</label>
                                            <input type="number" name="shelf_life_days" value={formData.shelf_life_days} onChange={handleFormChange} placeholder="e.g., 180" className="w-full px-4 py-3 rounded-lg bg-white border" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Manufacture Date</label>
                                            <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleFormChange} className="w-full px-4 py-3 rounded-lg bg-white border" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Industrial Pricing & Stock */}
                    {activeStepIndex === 1 && (
                    <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900 group-hover:scale-110 transition-transform">
                            <FaRupeeSign size={150} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-white/5 text-gray-900 rounded-xl"><FaRupeeSign size={20} /></span>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pricing & Stock</h2>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Weight */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"></span>
                                        Weight
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="net_weight"
                                            value={formData.net_weight}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 250g, 1kg"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-[1.2rem] outline-none focus:bg-white focus:border-indigo-400/40 transition-all text-lg font-black text-slate-800 placeholder:text-gray-300 placeholder:font-medium"
                                        />
                                    </div>
                                </div>

                                {/* MRP */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block"></span>
                                        MRP (₹) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-black text-lg pointer-events-none">₹</span>
                                        <input
                                            type="number"
                                            name="mrp"
                                            value={formData.mrp}
                                            onChange={handleFormChange}
                                            placeholder="0"
                                            min="0"
                                            className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[1.2rem] outline-none focus:bg-white focus:border-slate-400/40 transition-all text-xl font-black text-slate-900 placeholder:text-gray-300"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Discount % */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                                        Discount %
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="offer"
                                            value={formData.offer}
                                            onChange={handleFormChange}
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            className="w-full pl-4 pr-9 py-4 bg-amber-50/60 border border-amber-100 rounded-[1.2rem] outline-none focus:bg-white focus:border-amber-400/40 transition-all text-xl font-black text-amber-700 placeholder:text-amber-200"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-lg pointer-events-none">%</span>
                                    </div>
                                    {parseFloat(formData.offer) > 0 && (
                                        <p className="text-[10px] text-amber-600 font-bold ml-1">
                                            Save ₹{Math.round((parseFloat(formData.mrp) || 0) * (parseFloat(formData.offer) / 100))} off MRP
                                        </p>
                                    )}
                                </div>

                                {/* Final Price — read-only, auto-calculated */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                        Final Price
                                        <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black ml-1">AUTO</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg pointer-events-none">₹</span>
                                        <input
                                            type="number"
                                            name="offer_price"
                                            value={formData.offer_price}
                                            readOnly
                                            tabIndex={-1}
                                            className="w-full pl-9 pr-4 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-[1.2rem] text-xl font-black text-emerald-700 cursor-default outline-none select-none"
                                        />
                                    </div>
                                    {parseFloat(formData.offer) > 0 && parseFloat(formData.mrp) > 0 && (
                                        <p className="text-[10px] text-emerald-600 font-bold ml-1">
                                            {Math.round(parseFloat(formData.offer))}% off applied ✓
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stock row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-gray-50">
                                <div className="space-y-3 relative">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <FiActivity className="text-blue-500" size={10} />
                                            Available Stock
                                        </span>
                                        {isStockManuallyEdited && (
                                            <button type="button" onClick={resetStockCalculation} className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full hover:bg-blue-500 hover:text-white transition-colors uppercase tracking-widest">Auto Set</button>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <FiActivity className={`absolute left-5 top-1/2 -translate-y-1/2 ${isStockManuallyEdited ? 'text-amber-500' : 'text-blue-500'}`} />
                                        <input
                                            type="number"
                                            name="total_stock"
                                            value={formData.total_stock}
                                            onChange={handleFormChange}
                                            className={`w-full pl-11 pr-4 py-4 border rounded-[1.2rem] outline-none transition-all text-xl font-black ${isStockManuallyEdited ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-blue-50/50 text-blue-600 border-blue-100'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Product Details */}
                    {activeStepIndex === 2 && (
                    <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 p-8 opacity-[0.03] text-indigo-600">
                            <FiBox size={200} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FiBox size={20} /></span>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Product Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dietary Tag</label>
                                    <select name="dietary_tag" value={formData.dietary_tag} onChange={handleFormChange} className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 cursor-pointer">
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                        <option value="Vegan">Vegan</option>
                                        <option value="Contains Egg">Contains Egg</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Packaging Type</label>
                                    <input type="text" name="packaging_type" value={formData.packaging_type} onChange={handleFormChange} placeholder="e.g. Packet, Bottle" className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Shelf Life (Days)</label>
                                    <input type="number" name="shelf_life_days" value={formData.shelf_life_days} onChange={handleFormChange} placeholder="e.g. 180" className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Manufacture Date</label>
                                    <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleFormChange} className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Subcategory</label>
                                    <select name="subcategory" value={formData.subcategory} onChange={handleFormChange} className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 cursor-pointer disabled:opacity-30" disabled={subcategories.length === 0}>
                                        <option value="">Select Subcategory</option>
                                        {subcategories.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ingredients</label>
                                <textarea name="ingredients" value={formData.ingredients} onChange={handleFormChange} placeholder="List of ingredients..." className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800 resize-none"></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Storage Instructions</label>
                                <input type="text" name="storage_instructions" value={formData.storage_instructions} onChange={handleFormChange} placeholder="e.g. Keep in a cool, dry place" className="w-full px-6 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-slate-800" />
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Inventory Manager */}
                {activeStepIndex === 3 && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between sticky top-25 z-20 bg-gray-50/90 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <FiBox className="text-orange-500" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Portion & Inventory</h3>
                        </div>
                        <button type="button" onClick={addVariant} className="bg-slate-900 text-white p-2 rounded-xl active:scale-90 transition-all shadow-lg hover:bg-black"><FiPlus /></button>
                    </div>

                    {variants.map((v, vIndex) => (
                        <div key={vIndex} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative group animate-in zoom-in-95 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Serving Tag / Label (optional)</label>
                                    <input
                                        type="text"
                                        value={v.tag || ""}
                                        onChange={(e) => handleVariantChange(vIndex, "tag", e.target.value)}
                                        placeholder="e.g. Special, Chef's Pick, Bestseller"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500/30 transition-all"
                                    />
                                </div>
                                <button type="button" onClick={() => removeVariant(vIndex)} className="ml-4 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><FiTrash2 size={16} /></button>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-gray-50">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Portion Stock Management
                                </label>

                                <div className="flex flex-wrap gap-2">
                                    {sizeOptions.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSize(vIndex, size)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold ${v.selectedSizes.includes(size)
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>

                                {v.selectedSizes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in slide-in-from-top-1">
                                        {v.selectedSizes.map(sz => (
                                            <div
                                                key={sz}
                                                className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">
                                                        {sz}
                                                    </p>
                                                    <input
                                                        type="number"
                                                        value={v.sizesStock[sz]}
                                                        onChange={(e) =>
                                                            handleStockChange(vIndex, sz, e.target.value)
                                                        }
                                                        className="w-full bg-transparent border-none outline-none p-0 text-sm font-black text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {v.images.slice(0, 5).map((img, iIndex) => (
                                    <div key={iIndex} className="relative aspect-3/4 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group/img">
                                        <img src={img} alt="V" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" />
                                        <button type="button" onClick={() => removeVariantImage(vIndex, iIndex)} className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><FiTrash2 size={16} /></button>
                                    </div>
                                ))}
                                {v.images.length < 5 && (
                                    <label className="flex flex-col items-center justify-center aspect-3/4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-white hover:border-blue-500 group/label transition-all shadow-inner">
                                        <FiUploadCloud size={24} className="text-gray-300 group-hover/label:text-blue-500 transition-colors scale-125" />
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleVariantImageUpload(vIndex, e)} />
                                    </label>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                )}

                {/* Images & Review / Navigation */}
                {activeStepIndex === 4 && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Packaging Image</label>
                                <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer">
                                    <FiUploadCloud />
                                    <span className="text-sm">Upload packaging image</span>
                                    <input type="file" accept="image/*" onChange={handlePackagingUpload} className="hidden" />
                                </label>
                                {formData.packaging_image && (
                                    <div className="mt-4 rounded-lg overflow-hidden border">
                                        <img src={formData.packaging_image} alt="pack" className="w-full object-cover h-48" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-700">Review</p>
                                <div className="mt-3 text-sm text-gray-600">
                                    <p><strong className="text-slate-800">Name:</strong> {formData.name || '-'}</p>
                                    <p><strong className="text-slate-800">Category:</strong> {formData.category || '-'}</p>
                                    <p><strong className="text-slate-800">Price:</strong> {formData.mrp || '-'}</p>
                                    <p><strong className="text-slate-800">Final Price:</strong> {computedFinalPrice}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0b111a] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1">
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Navigation</p>
                            <h5 className="mt-2 text-lg font-black text-white">Advance to the next stage</h5>
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
                                    {loading ? 'Saving...' : (isEdit ? 'Update Dish' : 'Save Dish')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProducts;