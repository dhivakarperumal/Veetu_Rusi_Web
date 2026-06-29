import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiEye } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

export default function WishList() {
  const { wishlist, toggleWishlist } = useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <>
      {/* Page Title */}
      <PageHeader title="My Wishlist" />

      <div className=" bg-gray-50 py-16">
        {/* Wishlist Grid */}
        <PageContainer>
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
                  // Get image from multiple sources
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
                      try {
                        // Test if it's valid by creating an image object
                        const testImg = new Image();
                        testImg.onerror = () => {
                          console.warn('Invalid data URI for', item?.name);
                        };
                        testImg.src = image;
                      } catch (e) {
                        console.warn('Invalid image data for', item?.name, e);
                        image = null;
                      }
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

                  const mrp = parseFloat(item?.mrp || 0);
                  // Support chef_food_table (final_price, offer) and franchise_products (price, offer_price)
                  const getSellingPrice = () => {
                    if (item?.final_price && parseFloat(item.final_price) > 0) return parseFloat(item.final_price);
                    if (item?.offer_price && parseFloat(item.offer_price) > 0) return parseFloat(item.offer_price);
                    if (item?.price && parseFloat(item.price) > 0) return parseFloat(item.price);
                    if (item?.offer && parseFloat(item.offer) > 0 && mrp > 0) {
                      return mrp - (mrp * parseFloat(item.offer)) / 100;
                    }
                    return mrp;
                  };
                  const price = getSellingPrice();
                  const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

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
                            console.error(`Image failed to load for product ${item?.name}:`, image);
                            // Fallback to avatar on error
                            const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.name || 'Product')}&background=random&size=400`;
                            if (e.target.src !== fallbackImg) {
                              e.target.src = fallbackImg;
                            }
                          }}
                          onLoad={() => {
                            console.log(`Image successfully loaded for product ${item?.name}`);
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-primary font-bold text-lg">
                              ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>

                            {discount > 0 && (
                              <span className="text-gray-400 line-through text-sm">
                                ₹{mrp.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            )}

                            {discount > 0 && (
                              <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* View Product */}
                          <button
                            onClick={() => {
                              navigate(`/products/${item.product_id}`);
                            }}
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
        </PageContainer>
      </div>
    </>
  );
}
