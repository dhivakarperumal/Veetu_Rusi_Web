import React, { useContext } from "react";
import { FiHeart, FiTrash2, FiEye } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

export default function WishList() {
  const { wishlist, removeFromWishlist } = useContext(StoreContext);
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
                {wishlist.map((item) => {
                  const image = item?.variants?.[0]?.images?.[0] || item?.image;

                  const price = item?.variants?.[0]?.price || item?.price;

                  const mrp = item?.variants?.[0]?.mrp || item?.mrp;

                  const discount = Math.round(((mrp - price) / mrp) * 100);

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100 group"
                    >
                      {/* Image */}
                      <div className="relative h-80 overflow-hidden">
                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />

                        {/* Discount */}
                        {discount > 0 && (
                          <span className="absolute top-3 left-3 bg-primary text-white text-xs px-3 py-1 rounded-full">
                            {discount}% OFF
                          </span>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => removeFromWishlist(item._id)}
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
        </PageContainer>
      </div>
    </>
  );
}
