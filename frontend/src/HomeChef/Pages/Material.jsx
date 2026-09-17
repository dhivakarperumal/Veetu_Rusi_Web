import React, { useEffect, useState, useContext } from "react";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { Link } from "react-router-dom";
import {
    FiSearch, FiHeart, FiShoppingCart, FiStar, FiFilter, FiX, FiSliders, FiBox, FiLayers, FiCheckCircle, FiList, FiGrid
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { QRCodeCanvas } from "qrcode.react";

const AGE_GROUPS = ["All", "Infant (0–1)", "Toddler (1–3)", "Kids (3–5)", "Kids (5–7)", "Kids (7–10)", "Teen (10–15)", "Teen (15–20)", "Adult (20+)"];
const SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
];

const Materials = () => {
    const { addToCart, toggleWishlist, wishlist, productsCache, setProductsCache, lastFetchTime, setLastFetchTime } = useContext(StoreContext);
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAge, setSelectedAge] = useState("All");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [categories, setCategories] = useState(["All"]);
    const [showQR, setShowQR] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState("card");

    const currentUser = user;
    const [homeChef, setHomeChef] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState(false); // Add a flag to track if profile check is done

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profileRes = await api.get('/auth/profile');
                setHomeChef(profileRes.data?.homeChef || null);
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setProfileLoaded(true); // Ensure we mark it as loaded even on error
            }
        };
        if (!homeChef && !profileLoaded) loadProfile();
    }, [homeChef, profileLoaded]);

    const fetchProducts = async () => {
        let userToMatch = null;
        let homeChefIdToMatch = null;

        const role = currentUser?.role?.toLowerCase() || '';
        if (role === 'admin' || role === 'franchise') {
            userToMatch = currentUser?.user_id || currentUser?.id;
        } else if (role === 'chef' || role === 'homechef') {
            // Wait for profile endpoint to finish before proceeding
            if (!profileLoaded) return;
            userToMatch = homeChef?.created_by || homeChef?.franchise_user_id || homeChef?.created_by_user_id;
            homeChefIdToMatch = homeChef?.id;
        }

        // Use shared cache only for non-chef material pages, otherwise fetch fresh user-specific data.
        const isCacheValid = lastFetchTime && Date.now() - lastFetchTime < 5 * 60 * 1000;
        const isChefRole = role === 'chef' || role === 'homechef';
        if (!isChefRole && isCacheValid && productsCache?.length > 0) {
            let myProducts = productsCache;
            if (userToMatch) {
                myProducts = myProducts.filter((product) => product.created_by === userToMatch);
            }
            if (homeChefIdToMatch) {
                myProducts = myProducts.filter((product) => !product.home_chef_id || product.home_chef_id == homeChefIdToMatch);
            }
            setProducts(myProducts);
            setCategories(["All", ...new Set(myProducts.map(p => p.category).filter(Boolean))]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await api.get("/franchise-products", { params: userToMatch ? { franchise_user_id: userToMatch } : {} });
            const data = Array.isArray(res.data) ? res.data : [];
            setProductsCache(data);
            setLastFetchTime(Date.now());

            let myProducts = data;
            if (userToMatch) {
                myProducts = myProducts.filter((product) => product.created_by === userToMatch);
            }
            if (homeChefIdToMatch) {
                myProducts = myProducts.filter((product) => !product.home_chef_id || product.home_chef_id == homeChefIdToMatch);
            }

            setProducts(myProducts);

            // Extract unique categories
            const cats = ["All", ...new Set(myProducts.map(p => p.category).filter(Boolean))];
            setCategories(cats);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [homeChef, currentUser, profileLoaded]);

    const getImage = (product) => {
        if (product.variants?.length > 0 && product.variants[0]?.images?.length > 0)
            return product.variants[0].images[0];
        if (product.images?.length > 0) return product.images[0];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=64748b&size=400`;
    };

    const filtered = (Array.isArray(products) ? products : [])
        .filter(p => {
            const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = selectedCategory === "All" || p.category === selectedCategory;
            const matchAge = selectedAge === "All" || p.age === selectedAge;
            return matchSearch && matchCat && matchAge;
        })
        .sort((a, b) => {
            if (sortBy === "price_asc") return parseFloat(a.offer_price || a.price || 0) - parseFloat(b.offer_price || b.price || 0);
            if (sortBy === "price_desc") return parseFloat(b.offer_price || b.price || 0) - parseFloat(a.offer_price || a.price || 0);
            return b.id - a.id; // newest
        });

    const isInWishlist = (id) => wishlist.some(p => p.product_id === id || p.id === id);

    const activeFiltersCount = [selectedCategory !== "All", selectedAge !== "All"].filter(Boolean).length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Chef Materials</h2>
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-2">
                        Cooking supplies, raw materials & packaging inventory
                    </p>
                </div>
            </div>

            {/* Top Cards matching ChefFoodAll style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Total Materials */}
                <div className="relative overflow-hidden group rounded-2xl p-px bg-gradient-to-br from-blue-500/40 via-cyan-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
                    <div className="relative bg-[#13161b] rounded-2xl p-6 flex items-center gap-4 h-full">
                        <div className="absolute -top-6 -right-6 w-28 h-28 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-blue-700/40">
                            <FiBox className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-300/70 font-black uppercase tracking-[0.2em]">Total Materials</p>
                            <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{products.length}</h4>
                            <p className="text-[10px] text-white/25 font-semibold mt-1">Available supplies</p>
                        </div>
                    </div>
                </div>

                {/* Card 2: Categories */}
                <div className="relative overflow-hidden group rounded-2xl p-px bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
                    <div className="relative bg-gradient-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
                        <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
                            <FiLayers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">Categories</p>
                            <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{categories.filter(c => c !== "All").length}</h4>
                            <p className="text-[10px] text-white/25 font-semibold mt-1">Supply types</p>
                        </div>
                    </div>
                </div>

                {/* Card 3: In Stock */}
                <div className="relative overflow-hidden group rounded-2xl p-px bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
                    <div className="relative bg-gradient-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
                        <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
                            <FiCheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">In Stock</p>
                            <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{products.filter(p => parseInt(p.total_stock ?? p.stock ?? 1) > 0).length}</h4>
                            <p className="text-[10px] text-white/25 font-semibold mt-1">Ready for order</p>
                        </div>
                    </div>
                </div>

                {/* Card 4: Wishlist */}
                <div className="relative overflow-hidden group rounded-2xl p-px bg-gradient-to-br from-rose-500/40 via-red-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
                    <div className="relative bg-gradient-to-br from-[#1a0a0a] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
                        <div className="absolute -top-6 -right-6 w-28 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/40">
                            <FiHeart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-rose-300/70 font-black uppercase tracking-[0.2em]">Wishlist</p>
                            <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{wishlist.length}</h4>
                            <p className="text-[10px] text-white/25 font-semibold mt-1">Saved items</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sarees, codes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-slate-800 font-medium placeholder-gray-300 focus:outline-none focus:border-blue-300 transition-all"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                            <FiX size={16} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl border font-black text-sm transition-all ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-100 text-slate-700 hover:border-gray-300 shadow-sm'}`}
                >
                    <FiSliders size={16} />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-slate-700 outline-none shadow-sm hover:border-gray-300 transition-all cursor-pointer"
                >
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl">
                    <button onClick={() => setViewMode("table")} className={`p-3 rounded-xl transition ${viewMode === "table" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-100"}`} title="Table View"><FiList size={16} /></button>
                    <button onClick={() => setViewMode("card")} className={`p-3 rounded-xl transition ${viewMode === "card" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-100"}`} title="Card View"><FiGrid size={16} /></button>
                </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</p>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-black transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
                                >{cat}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Age Group</p>
                        <div className="flex flex-wrap gap-2">
                            {AGE_GROUPS.map(age => (
                                <button
                                    key={age}
                                    onClick={() => setSelectedAge(age)}
                                    className={`px-4 py-2 rounded-full text-xs font-black transition-all ${selectedAge === age ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
                                >{age}</button>
                            ))}
                        </div>
                    </div>
                    {(selectedCategory !== "All" || selectedAge !== "All") && (
                        <button
                            onClick={() => { setSelectedCategory("All"); setSelectedAge("All"); }}
                            className="text-xs font-black text-red-400 hover:text-red-600 transition-colors"
                        >
                            × Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 font-medium">
                    Showing <span className="text-slate-800 font-black">{filtered.length}</span> results
                    {searchTerm && <span> for "<span className="text-blue-600">{searchTerm}</span>"</span>}
                </p>
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2">
                        {selectedCategory !== "All" && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black flex items-center gap-1">
                                {selectedCategory}
                                <button onClick={() => setSelectedCategory("All")}><FiX size={10} /></button>
                            </span>
                        )}
                        {selectedAge !== "All" && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black flex items-center gap-1">
                                {selectedAge}
                                <button onClick={() => setSelectedAge("All")}><FiX size={10} /></button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
                            <div className="w-full h-64 bg-gray-100"></div>
                            <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                                <div className="h-8 bg-gray-100 rounded-2xl w-full mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                        <FiSearch size={36} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Sarees Found</h3>
                    <p className="text-gray-400 font-medium">Try adjusting your search or filters</p>
                    <button
                        onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setSelectedAge("All"); }}
                        className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                        Clear All & Show All
                    </button>
                </div>
            ) : viewMode === "table" ? (
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/95 shadow-xl">
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-200"><thead className="bg-slate-900"><tr><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Material</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Category</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Price</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Action</th></tr></thead><tbody className="divide-y divide-slate-800">
                        {filtered.map((product) => <tr key={product.id} className="hover:bg-slate-900/70"><td className="px-6 py-4 font-bold text-white">{product.name}</td><td className="px-6 py-4 text-slate-400">{product.category || "-"}</td><td className="px-6 py-4 font-black text-emerald-400">₹{Number(product.offer_price || product.price || 0).toLocaleString("en-IN")}</td><td className="px-6 py-4"><button onClick={() => addToCart(product)} className="rounded-xl bg-emerald-500 p-2 text-slate-950 hover:bg-emerald-400" title="Add to cart"><FiShoppingCart size={16} /></button></td></tr>)}
                    </tbody></table></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filtered.map((product) => {
                        const img = getImage(product);
                        const inWishlist = isInWishlist(product.id);
                        const productUrl = `${window.location.origin}/chef/material/${product.id}`;
                        const discountPct = product.mrp && product.offer_price
                            ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.mrp)) * 100)
                            : null;

                        return (
                            <div key={product.id} className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-400 flex flex-col">
                                {/* Image */}
                                <Link to={`/chef/material/${product.id}`} className="relative block flex-shrink-0">
                                    <div className="w-full h-56 sm:h-64 overflow-hidden bg-gray-50">
                                        <img
                                            src={img}
                                            alt={product.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>

                                    {/* Discount Badge */}
                                    {discountPct != null && discountPct > 0 && (
                                        <span className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                                            {discountPct}% OFF
                                        </span>
                                    )}

                                    {/* Hot Badge */}
                                    {product.age && (
                                        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/50 shadow-sm">
                                            {product.age}
                                        </span>
                                    )}
                                </Link>

                                {/* Quick Actions */}
                                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                                    <button
                                        onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                                        className={`w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 ${inWishlist ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
                                    >
                                        <FiHeart size={15} className={inWishlist ? 'fill-current' : ''} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setShowQR(showQR === product.id ? null : product.id); }}
                                        className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-slate-800 transition-all active:scale-90"
                                    >
                                        <BsQrCode size={15} />
                                    </button>
                                </div>

                                {/* QR Popup for this card */}
                                {showQR === product.id && (
                                    <div
                                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
                                        onClick={() => setShowQR(null)}
                                    >
                                        <div
                                            className="bg-white p-8 rounded-[2.5rem] shadow-2xl text-center max-w-xs w-full mx-4"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h3 className="font-black text-slate-800 mb-1">Scan to View</h3>
                                            <p className="text-xs text-gray-400 mb-6 font-medium">{product.name}</p>
                                            <div className="flex justify-center">
                                                <QRCodeCanvas value={productUrl} size={180} level="H" />
                                            </div>
                                            <button
                                                onClick={() => setShowQR(null)}
                                                className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Card Body */}
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{product.category}</p>
                                        <h3 className="font-black text-slate-800 text-sm mt-0.5 leading-tight line-clamp-2">{product.name}</h3>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        {/* Price */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div>
                                                {product.offer_price && product.mrp ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-slate-800">
                                                                ₹{product.offer_price}
                                                            </span>

                                                            <span className="text-sm text-gray-400 line-through">
                                                                ₹{product.mrp}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-lg font-black text-slate-800">
                                                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </div>

                                           
                                            </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-10 h-10 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-slate-900/20"
                                        >
                                            <FiShoppingCart size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Materials;
