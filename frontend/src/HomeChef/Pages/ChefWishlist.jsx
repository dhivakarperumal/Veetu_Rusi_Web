import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ChefWishlist() {
  const { wishlist, toggleWishlist, addToCart } = useContext(StoreContext);
  const navigate = useNavigate();

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
          {wishlist.map((item, idx) => {
            let image = item?.image || item?.wishlist_image || item?.product_images || item?.images || null;
                  
            console.log(`Wishlist item ${idx}:`, { name: item?.name, imageLength: image?.length, hasImage: !!image });
            
            // Parse JSON strings
            if (typeof image === 'string') {
              if (image.startsWith('[')) {
                try {
                  const parsed = JSON.parse(image);
                  image = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : image;
                } catch (e) {
                  console.error('Error parsing image JSON:', e);
                  image = null;
                }
              }
            } else if (Array.isArray(image)) {
              image = image[0] || null;
            }
            
            // Validate image format
            if (typeof image === 'string') {
              // Check if it's a valid data URI or HTTP URL
              if (image.startsWith('data:') && image.length > 50) {
                // Valid base64 data URI - use as is
              } else if (image.startsWith('http://') || image.startsWith('https://')) {
                // Valid HTTP URL - use as is
              } else {
                // Invalid format
                console.warn('Invalid image format for', item?.name, ':', image.substring(0, 50));
                image = null;
              }
            } else {
              image = null;
            }
            
            // Fallback to placeholder
            if (!image) {
              image = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.name || 'Product')}&background=random`;
            }
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
                    src={image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Product')}&background=random&size=400`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Product')}&background=random&size=400`;
                      if (e.target.src !== fallback) {
                        e.target.src = fallback;
                      }
                    }}
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
