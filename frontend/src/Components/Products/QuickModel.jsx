import React, { useState, useContext, useEffect } from "react";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import {
  FiHeart,
  FiShoppingCart,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";

const QuickViewModal = ({ product, onClose }) => {
  const { addToCart, addToFoodCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();

  const initialVariant = product?.variants && product.variants.length > 0 ? product.variants[0] : null;
  const initialImage = (initialVariant?.images && initialVariant.images.length > 0
    ? initialVariant.images[0]
    : (product?.images && product.images.length > 0 ? product.images[0] : `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || '')}`)
  );
  const initialSize = initialVariant?.selectedSizes?.[0] || null;

  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [imgIndex, setImgIndex] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const isInWishlist = wishlist.some(
    (w) => w.product_id === product?.id || w.id === product?.id,
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!product) return null;

  const allImages = selectedVariant?.images || product?.images || [];
  const unitPrice = parseFloat(product.offer_price ?? product.final_price ?? product.mrp ?? product.price ?? 0);
  const totalPrice = (unitPrice * quantity).toFixed(2);

  const stock = selectedVariant?.sizesStock?.[selectedSize];

  const handleBuyNow = () => {
    navigate("/food-checkout", {
      state: {
        product: product,
        variant: selectedVariant,
        size: selectedSize,
        quantity: quantity,
      },
    });
  };

  const prevImage = () => {
    const newIdx = imgIndex === 0 ? allImages.length - 1 : imgIndex - 1;
    setImgIndex(newIdx);
    setSelectedImage(allImages[newIdx]);
  };

  const nextImage = () => {
    const newIdx = imgIndex === allImages.length - 1 ? 0 : imgIndex + 1;
    setImgIndex(newIdx);
    setSelectedImage(allImages[newIdx]);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={onClose}
    >
      <style>
        {`
        .quickview-scroll::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>

      <div
        className="relative bg-white w-full max-w-5xl rounded-3xl shadow-xl 
  overflow-y-auto md:overflow-hidden 
  max-h-[90vh] flex flex-col p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white rounded-full p-3 shadow hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
        >
          <FiX size={22} />
        </button>

        <div className="flex flex-col md:flex-row md:h-[87vh]">
          {/* LEFT IMAGE SECTION */}
          <div className="md:w-1/2 w-full bg-white flex flex-col border-r border-gray-200">

            {/* Main Image */}
            <div className="relative h-[500px] lg:h-[600px] mr-3 overflow-hidden bg-gray-50">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full rounded-2xl object-cover"
              />

              {/* Previous */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition"
                  >
                    <FiChevronLeft size={20} />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Offer Badge */}
              {product.offer && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                  {Math.floor(product.offer)}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`thumb-${i}`}
                      onClick={() => {
                        setSelectedImage(img);
                        setImgIndex(i);
                      }}
                      className={`w-24 h-24 rounded-xl object-cover cursor-pointer shrink-0 border-2 transition-all ${selectedImage === img
                        ? "border-green-600 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="md:w-1/2 w-full h-full flex flex-col bg-white">

            {/* Fixed Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                {product.name}
              </h2>

              <div className="flex flex-wrap gap-2 mt-3">
                {product.category && (
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    Category : {product.category}
                  </span>
                )}

                {product.subcategory && (
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    Sub Category : {product.subcategory}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto p-5 quickview-scroll"
              style={{ scrollbarWidth: "none" }}
            >
              {/* Price */}
              <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">
                    ₹{unitPrice}
                  </span>

                  {product.mrp && (
                    <span className="line-through text-gray-400">
                      ₹{product.mrp}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Total : ₹{totalPrice}
                </p>
              </div>

              {/* Colors */}
              {product.variants?.length > 1 && (
                <div className="mt-6">
                  <p className="font-semibold mb-3">Colors</p>

                  <div className="flex gap-3 flex-wrap">
                    {product.variants.map((variant, i) => (
                      <img
                        key={i}
                        src={variant.images?.[0]}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setSelectedImage(variant.images?.[0]);
                          setImgIndex(0);
                          setSelectedSize(
                            variant.selectedSizes?.[0]
                          );
                        }}
                        className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-2 ${selectedVariant?.color === variant.color
                          ? "border-primary"
                          : "border-gray-200"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="font-bold mb-2">
                    Description
                  </h3>

                  <p className="text-gray-600 text-sm leading-7">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Sizes */}
              {selectedVariant?.selectedSizes?.length > 0 && (
                <div className="mt-6">
                  {!(
                    selectedVariant.selectedSizes.length === 1 &&
                    selectedVariant.selectedSizes[0].toLowerCase() ===
                    "free size"
                  ) && (
                      <>
                        <p className="font-bold mb-3">
                          Select Size
                        </p>

                        <div className="flex gap-2 flex-wrap">
                          {selectedVariant.selectedSizes.map(
                            (size, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  setSelectedSize(size)
                                }
                                className={`px-4 py-2 rounded-xl ${selectedSize === size
                                  ? "bg-primary text-white"
                                  : "bg-gray-100"
                                  }`}
                              >
                                {size}
                              </button>
                            )
                          )}
                        </div>
                      </>
                    )}

                  {selectedSize && (
                    <p className="text-sm text-gray-600 mt-4">
                      Stock Available :
                      <span className="font-semibold ml-1">
                        {selectedVariant?.sizesStock?.[
                          selectedSize
                        ] || 0}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6">
                <p className="font-bold mb-3">
                  Quantity
                </p>

                <div className="flex items-center gap-3 bg-gray-100 w-fit rounded-xl px-3 py-2">
                  <button
                    onClick={() =>
                      quantity > 1 &&
                      setQuantity(quantity - 1)
                    }
                    className="text-lg font-bold px-2"
                  >
                    -
                  </button>

                  <span className="w-8 text-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={() => {
                      const maxStock = (stock !== undefined && stock !== null) ? stock : 999;
                      if (quantity < maxStock) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="text-lg font-bold px-2 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom spacing */}
              <div className="h-20" />
            </div>

            {/* Fixed Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 z-20">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (
                      product.chef_id ||
                      product.chef_user_id ||
                      product.final_price
                    ) {
                      addToFoodCart(
                        product,
                        selectedVariant,
                        selectedSize,
                        quantity
                      );
                    } else {
                      addToFoodCart(
                        product,
                        selectedVariant,
                        selectedSize,
                        quantity
                      );
                    }

                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl"
                >
                  <FiShoppingCart size={18} />
                  Add To Cart 
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-black text-white py-3 rounded-xl"
                >
                  Buy Now
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border ${isInWishlist
                    ? "text-red-500 border-red-300"
                    : "border-gray-200"
                    }`}
                >
                  <FiHeart
                    size={20}
                    className={
                      isInWishlist ? "fill-current" : ""
                    }
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default QuickViewModal;
