import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ChefWishlist() {
  const { wishlist, toggleWishlist, addToCart } = useContext(StoreContext);
  const navigate = useNavigate();

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let cleanUrl = url;
    try {
      const parsed = JSON.parse(url);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleanUrl = parsed[0];
      }
    } catch(e) {}
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = cleanUrl.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  return (
    <div className="p-4 sm:p-6 text-slate-200">
      <h1 className="text-2xl font-bold mb-6 text-white">Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-[#0f1216] border border-slate-800 rounded-2xl shadow max-w-2xl mx-auto">
          <FiHeart className="mx-auto text-emerald-400 text-5xl mb-4" />
          <h2 className="text-xl font-semibold text-white">Your wishlist is empty</h2>
          <p className="text-slate-400 mt-2">Save items you like and check them out later.</p>
          <button
            onClick={() => navigate("/chef/material")}
            className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition"
          >
            Explore Materials
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const image = resolveImageUrl(item?.variants?.[0]?.images?.[0] || item?.image);
            const price = item?.variants?.[0]?.price || item?.price;
            const mrp = item?.variants?.[0]?.mrp || item?.mrp;
            const discount = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;

            return (
              <div
                key={item._id || item.id}
                className="bg-[#0f1216] rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-slate-800 group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-slate-900 border-b border-slate-800">
                  <img
                    src={image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {discount}% OFF
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="absolute top-3 right-3 bg-[#0b0d10] p-2 rounded-full shadow hover:bg-red-500 hover:text-white transition text-slate-300"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-white line-clamp-2">{item.name}</h3>
                  <div className="flex items-center mt-2 flex-1">
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-bold text-lg">₹{price}</span>
                      {mrp && <span className="text-slate-500 line-through text-xs">₹{mrp}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                       addToCart(item);
                       toggleWishlist(item);
                    }}
                    className="mt-4 w-full bg-slate-800 hover:bg-emerald-600 text-white py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                  >
                    <FiShoppingCart size={16} /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
