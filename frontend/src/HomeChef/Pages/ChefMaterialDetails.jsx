import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  FiHeart,
  FiShoppingCart,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import toast from "react-hot-toast";

const ChefMaterialDetails = () => {
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(true);

  const [zoomed, setZoomed] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState("50% 50%");
  const zoomLevel = 2.5;

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = url.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data;
      if (!data) throw new Error("Product data not found");

      setProduct(data);

      if (data.variants?.length > 0) {
        const firstVariant = data.variants[0];
        if (typeof firstVariant.images === 'string') {
          try { firstVariant.images = JSON.parse(firstVariant.images); } catch { firstVariant.images = []; }
        }
        if (!firstVariant.images?.length && data.images?.length > 0) {
          firstVariant.images = data.images;
        }

        setSelectedVariant(firstVariant);
        setSelectedImage(resolveImageUrl(firstVariant.images?.[0]));
        setSelectedSize(firstVariant.selectedSizes?.[0] || null);
      } else if (data.images?.length > 0) {
        setSelectedImage(resolveImageUrl(data.images[0]));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleBuyNow = () => {
    if (!selectedVariant && product?.variants?.length > 0) {
      toast.error("Please select a variant");
      return;
    }
    navigate("/chef/checkout", {
      state: {
        product: product,
        variant: selectedVariant,
        size: selectedSize,
        quantity: quantity
      }
    });
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  const increaseQty = () => {
    const stock = selectedVariant?.sizesStock?.[selectedSize] || product?.total_stock || 100;
    setQuantity((prev) => (prev < stock ? prev + 1 : prev));
  };

  const decreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  if (!product) {
    return (
      <div className="p-4 sm:p-6 text-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-white animate-pulse">Loading Details...</h1>
      </div>
    );
  }

  const inWishlist = wishlist.some((w) => w.product_id === product.id || w.id === product.id);

  return (
    <div className="p-4 sm:p-6 text-slate-200">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Material Details</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition"
        >
          &larr; Back
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 bg-[#0f1216] border border-slate-800 p-6 rounded-3xl shadow-lg">
        {/* LEFT SIDE IMAGES */}
        <div className="lg:h-fit lg:sticky lg:top-24">
          {/* Main Image */}
          <div
            className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-[#0b0d10] border border-slate-800 rounded-2xl overflow-hidden cursor-crosshair"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={selectedImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1e293b&color=94a3b8`}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {zoomed && selectedImage && (
              <div
                className="absolute top-0 left-full ml-4 w-[400px] h-[480px] border border-slate-800 rounded-2xl overflow-hidden z-50 hidden lg:block bg-[#0b0d10] shadow-2xl"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${zoomLevel * 100}%`,
                  backgroundPosition: backgroundPosition,
                }}
              ></div>
            )}
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {(() => {
              let thumbs = [];
              if (product?.variants?.length > 0) {
                product.variants.forEach((v) => {
                  let imgs = v.images;
                  if (typeof imgs === 'string') {
                    try { imgs = JSON.parse(imgs); } catch { imgs = []; }
                  }
                  if (Array.isArray(imgs)) thumbs.push(...imgs);
                });
              }
              if (thumbs.length === 0) thumbs = selectedVariant?.images || product?.images || [];
              const seen = new Set();
              const uniqueThumbs = thumbs.filter((t) => {
                const key = typeof t === 'string' ? t : JSON.stringify(t);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              return uniqueThumbs.map((img, index) => {
                const resolvedImg = resolveImageUrl(img);
                return (
                  <img
                    key={index}
                    src={resolvedImg}
                    onClick={() => setSelectedImage(resolvedImg)}
                    className={`w-16 h-16 object-cover object-center rounded-xl cursor-pointer border-2 transition-all ${
                      selectedImage === resolvedImg ? "border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20" : "border-slate-800 hover:border-slate-600"
                    }`}
                  />
                );
              });
            })()}
          </div>
        </div>

        {/* RIGHT SIDE DETAILS */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
            <p className="text-slate-400 leading-relaxed">{product.description || "No description provided."}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {product.category && (
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                {product.category}
              </span>
            )}
            {product.subcategory && (
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                {product.subcategory}
              </span>
            )}
          </div>

<div className="flex items-center gap-3">
  <span className="text-2xl font-bold text-green-600">
    ₹{product.offer_price}
  </span>

  <span className="text-lg text-gray-500 line-through">
    ₹{product.mrp}
  </span>
</div>

          {/* Color Variants */}
          {product?.variants?.some(v => v.colorName) && (
            <div>
              <p className="font-semibold text-white mb-3">Select Variant</p>
              <div className="flex gap-3 flex-wrap">
                {product?.variants?.map((variant, index) => {
                  const parsed = typeof variant.images === 'string'
                    ? (() => { try { return JSON.parse(variant.images); } catch { return []; } })()
                    : (variant.images || []);
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        const variantWithParsed = { ...variant, images: parsed };
                        setSelectedVariant(variantWithParsed);
                        setSelectedImage(resolveImageUrl(parsed?.[0]));
                        setSelectedSize(variant.selectedSizes?.[0] || null);
                        setQuantity(1);
                      }}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <img
                        src={resolveImageUrl(parsed?.[0]) || `https://ui-avatars.com/api/?name=${variant.colorName}&background=random`}
                        alt={variant.colorName}
                        className={`w-14 h-14 object-cover object-center rounded-xl border-2 transition-all ${
                          selectedVariant?.color === variant.color
                            ? "border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20"
                            : "border-slate-700 group-hover:border-slate-500"
                        }`}
                      />
                      <span className={`text-xs mt-2 font-medium ${selectedVariant?.color === variant.color ? "text-emerald-400" : "text-slate-400"}`}>
                        {variant.colorName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weight Variants */}
          {product?.variants?.some(v => v.weight) && (
            <div>
              <p className="font-semibold text-white mb-3">Weight</p>
              <div className="flex gap-3 flex-wrap">
                {product?.variants?.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedSize(variant.weight);
                      setQuantity(1);
                    }}
                    className={`px-5 py-2 rounded-xl border font-semibold transition ${
                      (selectedSize === variant.weight || selectedVariant?.weight === variant.weight)
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
                        : "bg-[#0b0d10] text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {variant.weight}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {!(selectedVariant?.selectedSizes?.length === 1 && selectedVariant?.selectedSizes[0].toLowerCase() === "free size") && selectedVariant?.selectedSizes?.length > 0 && (
            <div>
              <p className="font-semibold text-white mb-3">Size</p>
              <div className="flex gap-3 flex-wrap">
                {selectedVariant?.selectedSizes?.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => { setSelectedSize(size); setQuantity(1); }}
                    className={`px-5 py-2 rounded-xl border font-semibold transition ${
                      selectedSize === size
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
                        : "bg-[#0b0d10] text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="font-semibold text-white mb-3">Quantity</p>
            <div className="flex items-center bg-[#0b0d10] border border-slate-700 rounded-xl w-fit">
              <button onClick={decreaseQty} className="px-5 py-3 text-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-l-xl transition">-</button>
              <span className="px-6 py-3 font-bold text-white border-x border-slate-700">{quantity}</span>
              <button onClick={increaseQty} className="px-5 py-3 text-lg font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-r-xl transition">+</button>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-800">
            <button
              onClick={() => addToCart(product, selectedVariant, selectedSize, quantity)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold transition active:scale-95"
            >
              <FiShoppingCart size={20} /> Add to Cart
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold transition active:scale-95 shadow-lg shadow-emerald-600/20"
            >
              Buy Now
            </button>

            <button
              onClick={() => toggleWishlist(product, selectedVariant)}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 font-bold transition active:scale-95 ${
                inWishlist
                  ? "bg-rose-500/10 border-rose-500/50 text-rose-500"
                  : "bg-[#0b0d10] border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
              }`}
            >
              <FiHeart size={20} className={inWishlist ? "fill-current" : ""} />
            </button>
          </div>

          {/* EXTRA DETAILS ACCORDION */}
          <div className="mt-8 bg-[#0b0d10] border border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-5 text-white font-semibold hover:bg-slate-800/50 transition"
            >
              More Information
              {showDetails ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
            {showDetails && (
              <div className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/50 text-sm">
                {product.material && <div><p className="text-slate-500">Material</p><p className="text-slate-200 font-medium">{product.material}</p></div>}
                {product.product_code && <div><p className="text-slate-500">Product Code</p><p className="text-slate-200 font-medium">{product.product_code}</p></div>}
                {product.age && <div><p className="text-slate-500">Age</p><p className="text-slate-200 font-medium">{product.age}</p></div>}
                {product.heat_profile && <div><p className="text-slate-500">Heat Profile</p><p className="text-slate-200 font-medium">{product.heat_profile}</p></div>}
                {product.storage_instructions && <div><p className="text-slate-500">Storage</p><p className="text-slate-200 font-medium">{product.storage_instructions}</p></div>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChefMaterialDetails;
