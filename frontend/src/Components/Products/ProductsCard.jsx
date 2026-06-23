import React, { useState, useContext } from "react";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { FiPlus, FiHeart, FiShare2 } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import QuickViewModal from "./QuickModel";
import { FaStar } from "react-icons/fa";
import ReactDOM from "react-dom";

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const isInWishlist = wishlist.some(
    (p) => p.product_id === product.id || p.id === product.id,
  );

  if (!product) return null;

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const productUrl = `${window.location.origin}/products/${product.id}`;

  const handleShare = async (e) => {
    e.stopPropagation();

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: "Check out this product!",
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        alert("Product link copied!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to resolve image URLs
  const resolveImage = (img) => {
    if (!img || typeof img !== 'string') return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = img.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const rawImages =
    product?.variants &&
      product.variants.length > 0 &&
      product.variants[0]?.images &&
      product.variants[0].images.length > 0
      ? (typeof product.variants[0].images === 'string' ? JSON.parse(product.variants[0].images) : product.variants[0].images)
      : product?.images && product.images.length > 0
        ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images)
        : [
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            product?.name || "Product",
          )}&background=random`,
        ];

  const images = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .map(img => resolveImage(img))
    .filter(Boolean);

  if (images.length === 0) {
    images.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || "Product")}&background=random`);
  }

  const image = hovered && images[1] ? images[1] : images[0];

  return (
    <>
      <div
        onClick={handleClick}
        className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
      >
        {/* Image Section */}
        <div
          className="relative h-[300px] overflow-hidden"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Action Icons */}
          <div
            className="absolute top-4 right-4 flex flex-col gap-3 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => toggleWishlist(product)}
              className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isInWishlist
                  ? "text-red-500 scale-110"
                  : "text-gray-700 hover:text-primary"
                }`}
            >
              <FiHeart className={`${isInWishlist ? "fill-current" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary transition-all"
            >
              <FiShare2 />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQR(true);
              }}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-primary transition-all"
            >
              <BsQrCode />
            </button>
          </div>

          {/* Main Image */}
          <img
            src={images[0]}
            alt={product?.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${hovered && images[1] ? "opacity-0" : "opacity-100"
              }`}
          />

          {/* Hover Image */}
          {images[1] && (
            <img
              src={images[1]}
              alt={product?.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${hovered ? "opacity-100" : "opacity-0"
                }`}
            />
          )}

          {/* Discount Badge */}
          {/* {product?.offer && (
            <div className="absolute bottom-4 left-4">
              <span className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
                {Math.floor(product.offer)}% OFF
              </span>
            </div>
          )} */}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Product Name */}
          <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
            {product?.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`text-sm ${i < Math.round(product?.rating || 0)
                    ? "text-yellow-400"
                    : "text-gray-300"
                  }`}
              />
            ))}

            <span className="text-sm text-gray-500 ml-1">
              ({product?.rating || "0.0"})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-bold text-primary">
              ₹{product?.final_price || product?.offer_price || product?.price || product?.mrp || 0}
            </span>

            {product?.mrp && product?.mrp !== (product?.final_price || product?.offer_price || product?.price) && (
              <span className="text-gray-400 line-through">
                ₹{product?.mrp}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 gap-3 mt-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="w-full py-3 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition-all duration-300"
            >
              Quick View
            </button>
          </div>
        </div>
      </div>

      {/* QR Popup */}
      {showQR &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-lg mb-4">Scan to view product</h3>

              <div className="flex justify-center">
                <QRCodeCanvas value={productUrl} size={200} />
              </div>

              <p className="text-sm text-gray-500 mt-3">{product?.name}</p>

              <button
                onClick={() => setShowQR(false)}
                className="mt-5 cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
      {quickView && (
        <QuickViewModal product={product} onClose={() => setQuickView(false)} />
      )}
    </>
  );
};

export default ProductCard;
