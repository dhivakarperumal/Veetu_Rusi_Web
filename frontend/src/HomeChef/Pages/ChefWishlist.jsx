import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiEye } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";


export default function ChefWishlist() {
  const { wishlist, toggleWishlist } = useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <>
      {/* Page Title */}
     
      <div className="  py-16">
        {/* Wishlist Grid */}
       
          <div className="">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-light/10 mb-5">
                  <FiHeart className="text-primary-light text-3xl" />
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                  Your wishlist is empty
                </h2>

                <p className="text-gray-500 mt-2 max-w-sm">
                  Looks like you haven't added any sarees yet. Browse our
                  collections and save your favorites.
                </p>

                <button
                  onClick={() => navigate("/shop")}
                  className="mt-6 px-6 py-2.5 bg-primary-dark text-white rounded-lg font-medium hover:bg-primary-light transition cursor-pointer"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {wishlist.map((item, idx) => {
                  // Get image - check variants first, then product images
                  let image = null;
                  if (item?.variants?.length > 0 && item.variants[0]?.images?.length > 0) {
                    image = item.variants[0].images[0];
                  } else if (item?.images?.length > 0) {
                    image = item.images[0];
                  } else if (item?.image) {
                    image = item.image;
                  }
                  
                  // Fallback to placeholder
                  if (!image) {
                    image = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.name || 'Product')}&background=f3f4f6&color=64748b&size=400`;
                  }

                  const price = item?.offer_price || item?.price || 0;
                  const mrp = item?.mrp || 0;
                  const discount = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100 group"
                    >
                      {/* Image */}
                      <div className="relative h-80 overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={image}
                          alt={item?.name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => {
                            const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.name || 'Product')}&background=f3f4f6&color=64748b&size=400`;
                            if (e.target.src !== fallbackImg) {
                              e.target.src = fallbackImg;
                            }
                          }}
                        />

                        {/* Discount */}
                        {discount > 0 && (
                          <span className="absolute top-3 left-3 bg-primary text-white text-xs px-3 py-1 rounded-full">
                            {discount}% OFF
                          </span>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-primary-light hover:text-white transition cursor-pointer"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 line-clamp-1">
                          {item.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-center mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-bold text-lg">
                              ₹{price}
                            </span>

                            {mrp && (
                              <span className="text-gray-400 line-through text-sm">
                                ₹{mrp}
                              </span>
                            )}
                          </div>

                          {/* View Product */}
                          <button
                            onClick={() => navigate(`/products/${item.id}`)}
                            className="ml-auto bg-primary-dark text-white p-2 rounded-lg hover:bg-primary-light flex items-center justify-center transition cursor-pointer"
                          >
                            <FiEye size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

      </div>
    </>
  );
}
