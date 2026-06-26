import { useState, useEffect } from "react";
import {
    FiArrowLeft,
    FiUploadCloud
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";




const AddProducts = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    // Main State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "Food Product",
        product_type: "Food Product", // Food | Food Product
        subcategory: "",
        cuisine: "",
        product_code: "",
        total_stock: "0",
        rating: "5",
        status: "Inactive",
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
        instructions: "",
        spice_level: "Medium",
        shelf_life_days: "",
        net_weight: "",
        package_count: "",
        packaging_type: "Pouch",
        manufacture_date: "",
        expiry_date: "",
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

    const dietaryOptions = ["veg", "non-veg"];
    const packagingOptions = ["Pouch", "Box", "Foil", "Bottle", "Packet"];
    const cuisineOptions = ["Multi Cuisine", "North Indian", "South Indian", "Continental", "Chinese", "Italian", "Thai", "Mexican"];

    const [variants, setVariants] = useState([
        {
            tag: "",
            weight: "",
            price: "",
            offer: "",
            final_price: "0",
            stock: "0",
            images: [],
            selectedSizes: [],
            sizesStock: {}
        }
    ]);

    // Track if total stock was manually edited
    const [isStockManuallyEdited, setIsStockManuallyEdited] = useState(false);

    // 2. Auto-calculate Total Stock whenever variants or sizesStock change
    useEffect(() => {
        if (!isStockManuallyEdited) {
            let total = 0;
            variants.forEach(variant => {
                const sizesValues = Object.values(variant.sizesStock || {});
                if (sizesValues.length > 0) {
                    sizesValues.forEach(qty => {
                        total += parseInt(qty) || 0;
                    });
                } else {
                    total += parseInt(variant.stock) || 0;
                }
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => ({ ...prev, total_stock: total.toString() }));
        }
    }, [variants, isStockManuallyEdited]);

    const computeVariantFinalPrice = (price, offer) => {
        const priceNum = parseFloat(price) || 0;
        const offerNum = parseFloat(offer) || 0;
        if (priceNum <= 0) return "0";
        return Math.round(priceNum - priceNum * (offerNum / 100)).toString();
    };

    useEffect(() => {
        const fetchEssentialData = async () => {
            setFetching(true);
            // Resolve admin user_id (who created this chef) to filter categories
            let adminUserId = null;
            try {
                const profileRes = await api.get('/auth/profile');
                const homeChef = profileRes.data?.homeChef || null;
                adminUserId = homeChef?.created_by || homeChef?.franchise_user_id || null;
            } catch (e) {
                console.warn('Could not fetch chef profile for category filtering', e);
            }

            if (isEdit) {
                // Fetch categories and the product independently so one failure doesn't block the other
                const [catsResult, productResult] = await Promise.allSettled([
                    api.get("/home-chef-categories"),
                    api.get(`/products/${id}`)
                ]);

                if (catsResult.status === 'fulfilled') {
                    let allCats = Array.isArray(catsResult.value.data) ? catsResult.value.data : [];
                    allCats = allCats.filter(cat => cat.category_type?.toLowerCase().includes('product') || cat.category_type === 'Product_food');
                    if (adminUserId) {
                        allCats = allCats.filter(cat =>
                            String(cat.created_by) === String(adminUserId) ||
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
                            cuisine: p.cuisine || "",
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
                            instructions: p.instructions || "",
                            spice_level: p.spice_level || "Medium",
                            shelf_life_days: p.shelf_life_days || "",
                            net_weight: p.net_weight || "",
                            package_count: p.package_count || "",
                            packaging_type: p.packaging_type || "Pouch",
                            manufacture_date: p.manufacture_date || "",
                            expiry_date: p.expiry_date || "" });
                        if (p.variants) setVariants(Array.isArray(p.variants) ? p.variants.map(v => ({
                            ...v,
                            offer: v.offer?.toString() || "",
                            final_price: v.final_price?.toString() || computeVariantFinalPrice(v.price, v.offer || p.offer)
                        })) : JSON.parse(p.variants).map(v => ({
                            ...v,
                            offer: v.offer?.toString() || "",
                            final_price: v.final_price?.toString() || computeVariantFinalPrice(v.price, v.offer || p.offer)
                        })));
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
        const initialVariant = {
            tag: "",
            weight: "",
            price: "",
            stock: "0",
            images: [],
            selectedSizes: [],
            sizesStock: {}
        };
        setVariants([...variants, initialVariant]);
    };

    const removeVariant = (index) => {
        if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        const variant = { ...updated[index], [field]: value };

        if (field === 'price' || field === 'offer') {
            const priceValue = field === 'price' ? value : variant.price;
            const offerValue = field === 'offer' ? value : variant.offer;
            variant.final_price = computeVariantFinalPrice(priceValue, offerValue);
        }

        updated[index] = variant;
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

    const removeVariantImage = (vIndex, imgIndex) => {
        const updated = [...variants];
        updated[vIndex].images = updated[vIndex].images.filter((_, i) => i !== imgIndex);
        setVariants(updated);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Note: Removed strict client-side gating for name/category/mrp
        // Allow backend to validate and respond with appropriate errors.

        // No blocking client-side validation: backend is authoritative.
        // Frontend will only sanitize the payload and allow submission so
        // server-side validation can return structured errors to the UI.

        setLoading(true);
        try {
            // Get user and chef information from auth/profile and localStorage
            // Try to fetch the full chef profile to obtain franchise/created-by metadata
            let homeChef = null;
            try {
                const profileRes = await api.get('/auth/profile');
                homeChef = profileRes.data?.homeChef || null;
            } catch (e) {
                // ignore - we'll fallback to user data
                console.warn('Could not fetch chef profile for metadata fallback', e?.response?.data || e);
            }

            const franchiseUserId = homeChef?.created_by || homeChef?.franchise_user_id || null;


            // Build a clean payload matching chef_food_table columns
            // Normalize variants/images
            const normalizedVariants = Array.isArray(variants) ? variants.map(v => ({
                weight: v.weight || null,
                price: v.price ? Number(v.price) : 0,
                offer: v.offer ? Number(v.offer) : 0,
                final_price: v.final_price ? Number(v.final_price) : 0,
                stock: v.stock ? Number(v.stock) : 0,
                images: Array.isArray(v.images) ? v.images : (v.images ? JSON.parse(v.images) : [])
            })) : [];

            const parsedImagesFromVariants = normalizedVariants.flatMap(v => v.images || []);
            const parsedStandaloneImages = Array.isArray(formData.images) ? formData.images : (formData.images ? JSON.parse(formData.images) : []);

            const finalData = {
                category: formData.category || "Food Product",
                product_type: formData.product_type || "Food Product",
                name: formData.name,
                description: formData.description || null,
                cuisine: formData.cuisine || null,
                prep_time: formData.prep_time || null,
                preparation_url: formData.preparation_url || null,
                shelf_life_days: formData.shelf_life_days ? Number(formData.shelf_life_days) : null,
                manufacture_date: formData.manufacture_date || null,
                expiry_date: formData.expiry_date || null,
                dietary_tag: formData.dietary_tag || null,
                net_weight: formData.net_weight || null,
                packaging_type: formData.packaging_type || null,
                packaging_image: formData.packaging_image || null,
                ingredients: formData.ingredients || null,
                instructions: formData.instructions || formData.cooking_instructions || null,
                images: (parsedStandaloneImages.length > 0 ? parsedStandaloneImages : (parsedImagesFromVariants.length > 0 ? parsedImagesFromVariants : null)),
                total_stock: Number(formData.total_stock) || 0,
                variants: normalizedVariants.length > 0 ? normalizedVariants : null,
                status: formData.status || "Inactive",
                franchise_user_id: franchiseUserId || null,
            };

            // Clean payload: remove empty strings, undefined, and empty arrays
            const cleanPayload = {};
            Object.entries(finalData).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                if (typeof v === 'string' && v.trim() === '') return;
                if (Array.isArray(v) && v.length === 0) return;
                cleanPayload[k] = v;
            });

            if (isEdit) {
                await api.put(`/products/${id}`, cleanPayload);
                toast.success("Product updated successfully!");
            } else {
                await api.post("/products", cleanPayload);
                toast.success("Product added to your menu successfully!");
            }

            setLoading(false);
            setTimeout(() => navigate("/chef/products"), 1500);
        } catch (error) {
            console.error("Submit error:", error);
            const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Operation failed.';
            toast.error(msg);
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Fetching product details...</p>
        </div>
    );

    const fieldClass = "w-full px-6 py-4 bg-[#0b0d10] rounded-3xl text-white border border-white/10 focus:border-white/30 outline-none";
    const textareaClass = "w-full px-6 py-4 bg-[#0b0d10] rounded-3xl text-slate-300 border border-white/10 focus:border-white/30 outline-none";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 p-4 md:p-8 bg-gradient-to-br from-[#0c1116] to-[#171a20] min-h-screen text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 sm:gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-3 bg-[#0f1216] border border-slate-800 rounded-2xl text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"><FiArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-3xl font-black text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
                        <p className="text-sm text-slate-300 mt-1">Create and manage your product catalog items with step-by-step onboarding.</p>
                    </div>
                </div>

                <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.45)] bg-[#081017]">
                    <div className="grid lg:grid-cols-[320px_1fr] min-h-[60vh]">
                        <aside className="hidden lg:flex flex-col p-6 bg-[#091219] border-r border-white/10 h-full gap-6">
                            <div className="space-y-4">
                                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Product Onboarding</p>
                                <h3 className="text-3xl font-black text-white">Advanced Form</h3>
                                <p className="text-sm leading-6 text-slate-400 max-w-[18rem]">Step through sections to add product details, pricing, inventory and images.</p>
                            </div>
                            <div className="space-y-3">
                                {steps.map((step, index) => (
                                    <button key={step.id} type="button" onClick={() => setActiveStepIndex(index)} className={`w-full text-left rounded-3xl px-4 py-4 transition ${activeStepIndex === index ? 'bg-emerald-600/10 border border-emerald-400/30 text-white' : 'border border-white/10 text-slate-300 hover:border-white/20 hover:text-white'}`}>
                                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Step {index + 1}</p>
                                        <p className="mt-1 text-sm font-black">{step.label}</p>
                                    </button>
                                ))}
                            </div>
                        </aside>
                        <form onSubmit={handleSubmit} className="flex flex-col bg-[#0d121a] p-6 md:p-8 min-h-0">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Step {activeStepIndex + 1} of {steps.length}</p>
                                    <h4 className="mt-2 text-2xl font-black text-white">{steps[activeStepIndex].label}</h4>
                                    <p className="mt-2 text-sm text-slate-400">Fill in the required details and continue to the next stage.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2">
                                {activeStepIndex === 0 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Product Category *</label>
                                                <select name="category" value={formData.category} onChange={handleFormChange} className={fieldClass}>
                                                    <option value="">Select category</option>
                                                    {categories.length > 0 ? categories.map(cat => (
                                                        <option key={cat.id || cat.CatId} value={cat.c_name || cat.name || cat.CatId}>{cat.c_name || cat.name || cat.CatId}</option>
                                                    )) : (
                                                        <><option value="Food Product">Food Product</option><option value="Food">Food</option></>
                                                    )}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Product Name *</label>
                                                <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Hyderabadi Biryani" className={fieldClass} required />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Type *</label>
                                                <select name="product_type" value={formData.product_type} onChange={handleFormChange} className={fieldClass}>
                                                    <option value="Food">Food</option>
                                                    <option value="Food Product">Food Product</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Dietary Tag</label>
                                                <select name="dietary_tag" value={formData.dietary_tag} onChange={handleFormChange} className={fieldClass}>
                                                    <option value="">Select dietary tag</option>
                                                    {dietaryOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Cuisine</label>
                                                <select name="cuisine" value={formData.cuisine} onChange={handleFormChange} className={fieldClass}>
                                                    <option value="">Select cuisine</option>
                                                    {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Preparation URL</label>
                                                <input type="url" name="preparation_url" value={formData.preparation_url || ''} onChange={handleFormChange} placeholder="https://" className={fieldClass} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-300 uppercase mb-2">Product Description *</label>
                                            <textarea name="description" value={formData.description} onChange={handleFormChange} rows={4} placeholder="Describe the product, flavors and serving suggestions..." className={textareaClass} />
                                        </div>
                                    </div>
                                )}

                                {activeStepIndex === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Packaging Type</label>
                                                <select name="packaging_type" value={formData.packaging_type} onChange={handleFormChange} className={fieldClass}>
                                                    {packagingOptions.map(pack => <option key={pack} value={pack}>{pack}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Prep Time</label>
                                                <input type="text" name="prep_time" value={formData.prep_time} onChange={handleFormChange} placeholder="e.g. 30 mins" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Shelf Life</label>
                                                <input type="number" name="shelf_life_days" value={formData.shelf_life_days} onChange={handleFormChange} placeholder="e.g. 180" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Expiry Date</label>
                                                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleFormChange} className={fieldClass} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Manufacture Date</label>
                                                <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleFormChange} className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-300 uppercase mb-2">Total Stock</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" name="total_stock" value={formData.total_stock} onChange={handleFormChange} min="0" className={`${fieldClass} flex-1`} />
                                                    <button type="button" onClick={resetStockCalculation} className="rounded-3xl bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700">Auto</button>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">Auto-calculated from variant stocks unless overridden.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeStepIndex === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-300 uppercase mb-2">Ingredients</label>
                                            <textarea name="ingredients" value={formData.ingredients} onChange={handleFormChange} rows={5} className={textareaClass} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-300 uppercase mb-2">Cooking Instructions</label>
                                            <textarea name="instructions" value={formData.instructions || ''} onChange={handleFormChange} rows={5} className={textareaClass} />
                                        </div>
                                    </div>
                                )}

                                {activeStepIndex === 3 && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-black text-white">Portion Variants</h3>
                                                <p className="text-sm text-slate-400">Add variant-specific weight, price, stock and images.</p>
                                            </div>
                                            <button type="button" onClick={addVariant} className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Add Variant</button>
                                        </div>

                                        <div className="space-y-4">
                                            {variants.map((variant, index) => (
                                                <div key={index} className="rounded-3xl border border-white/10 bg-[#0a0f14] p-4">
<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Weight / Size</label>
                                                <input
                                                    type="text"
                                                    placeholder="250g"
                                                    value={variant.weight}
                                                    onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Variant Price</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="₹ 199"
                                                    value={variant.price}
                                                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Offer (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="10"
                                                    value={variant.offer}
                                                    onChange={(e) => handleVariantChange(index, 'offer', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Stock</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={variant.stock}
                                                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold shadow-sm"
                                                />
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <button type="button" onClick={() => removeVariant(index)} className="inline-flex items-center justify-center rounded-3xl bg-red-600 px-4 py-3 text-xs font-semibold text-white hover:bg-red-500 disabled:bg-red-400" disabled={variants.length <= 1}>Remove</button>
                                                <button type="button" onClick={() => handleVariantImageUpload(index, { target: { files: [] } })} className="hidden" />
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Final Price</label>
                                                <input
                                                    value={variant.final_price || "0"}
                                                    readOnly
                                                    className="w-full bg-slate-900 border border-gray-700 rounded-xl px-4 py-3 text-xs font-bold text-emerald-300 shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Variant Images</label>
                                                <label className="flex items-center gap-2 rounded-3xl border border-dashed border-slate-700 bg-[#0b0d10] px-4 py-3 text-sm text-slate-300 cursor-pointer hover:border-white/30">
                                                    <FiUploadCloud size={18} className="text-slate-400" />
                                                    <span>Add / replace images</span>
                                                    <input type="file" multiple accept="image/*" onChange={(e) => handleVariantImageUpload(index, e)} className="hidden" />
                                                </label>
                                                        </div>
                                                    </div>

                                                    {variant.images?.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                            {variant.images.map((img, imgIndex) => (
                                                                <div key={imgIndex} className="relative group">
                                                                    <img src={img} alt={`variant-${index}-img-${imgIndex}`} className="w-full h-28 object-cover rounded-md" />
                                                                    <button type="button" onClick={() => removeVariantImage(index, imgIndex)} className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">Remove</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeStepIndex === 4 && (
                                    <div className="space-y-8">

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-black text-white">Review & Publish</h3>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="bg-[#0b0d10] p-4 rounded-md text-sm text-slate-300">
                                                    <p><strong className="text-white">Name:</strong> {formData.name || '-'}</p>
                                                    <p><strong className="text-white">Category:</strong> {formData.category || '-'}</p>
                                                    <p><strong className="text-white">Type:</strong> {formData.product_type || '-'}</p>
                                                    <p><strong className="text-white">Cuisine:</strong> {formData.cuisine || '-'}</p>
                                                    <p><strong className="text-white">Manufacture Date:</strong> {formData.manufacture_date || '-'}</p>
                                                    <p><strong className="text-white">Expiry Date:</strong> {formData.expiry_date || '-'}</p>
                                                    <p><strong className="text-white">Total Stock:</strong> {formData.total_stock || '0'}</p>
                                                </div>
                                                <div className="bg-[#0b0d10] p-4 rounded-md text-sm text-slate-300">
                                                        <p><strong className="text-white">Packaging:</strong> {formData.packaging_type || '-'}</p>
                                                    <p><strong className="text-white">Shelf Life:</strong> {formData.shelf_life_days ? `${formData.shelf_life_days} days` : '-'}</p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0b111a] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Navigation</p>
                                        <h5 className="mt-2 text-lg font-black text-white">Advance to the next stage</h5>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button type="button" onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))} disabled={activeStepIndex === 0} className="inline-flex items-center justify-center min-w-[140px] rounded-3xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500">Previous Step</button>
                                        {activeStepIndex < steps.length - 1 ? (
                                            <button type="button" onClick={() => setActiveStepIndex(Math.min(steps.length - 1, activeStepIndex + 1))} className="inline-flex items-center justify-center min-w-[140px] rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">Next Step</button>
                                        ) : (
                                            <button type="submit" disabled={loading} className="inline-flex items-center justify-center min-w-[140px] rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed">{loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Save Product')}</button>
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


export default AddProducts;
