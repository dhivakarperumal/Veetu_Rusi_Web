import React, { useContext } from "react";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";

export default function ChefCart() {
  const { cart, removeFromCart, updateCartQuantity } = useContext(StoreContext);
  const navigate = useNavigate();

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let cleanUrl = url;
    try {
      const parsed = JSON.parse(url);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleanUrl = parsed[0];
      }
    } catch (e) { }
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = cleanUrl.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const subtotal = cart.reduce(
    (total, item) => total + parseFloat(item.price || 0) * item.quantity,
    0
  );

  return (
    <div className="p-4 sm:p-6 text-slate-200">
      <h1 className="text-2xl font-bold mb-6 text-white">Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* CART ITEMS */}
        <div className="lg:col-span-2 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-20 bg-[#0f1216] border border-slate-800 rounded-2xl shadow">
              <FiShoppingCart className="mx-auto text-emerald-400 text-5xl mb-4" />
              <h2 className="text-xl font-semibold text-white">Your cart is empty</h2>
              <p className="text-slate-400 mt-2">Browse materials and add items to your cart.</p>
              <button
                onClick={() => navigate("/chef/material")}
                className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition"
              >
                Go to Materials
              </button>
            </div>
          ) : (
            cart.map((item, index) => {
              let image = null;

              if (item?.variants?.length > 0 && item.variants[0]?.images?.length > 0) {
                image = item.variants[0].images[0];
              } else if (item?.images?.length > 0) {
                image = item.images[0];
              } else if (item?.image) {
                image = item.image;
              }

              image = resolveImageUrl(image);
              const price =
                parseFloat(item.offer_price ?? item.price ?? 0);

              const mrp =
                parseFloat(item.mrp ?? item.price ?? 0);
              return (
                <div key={index} className="bg-[#0f1216] border border-slate-800 rounded-2xl shadow-md p-5 flex flex-col sm:flex-row gap-6 items-center">
                  {/* IMAGE */}
                  <div className="w-24 h-32 sm:w-32 sm:h-40 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={
                        image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.name || "Product"
                        )}&background=f3f4f6&color=64748b&size=400`
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.name || "Product"
                        )}&background=f3f4f6&color=64748b&size=400`;
                      }}
                    />
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 w-full">
                    <h3 className="font-semibold text-lg text-white">
                      {item.name ||
                        item.product_name ||
                        item.productName ||
                        item.title ||
                        "Product"}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.category && (
                        <span className="inline-block bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
                          {item.category}
                        </span>
                      )}
                      {item.variant_size && item.variant_size !== "Free Size" && (
                        <span className="inline-block bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
                          Size: {item.variant_size}
                        </span>
                      )}
                      {item.variant_color && item.variant_color !== "Default" && (
                        <span className="inline-block bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
                          Color: {item.variant_color}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold text-xl">
                          ₹{price.toFixed(2)}
                        </span>

                        {mrp > price && (
                          <span className="text-slate-500 line-through text-sm">
                            ₹{mrp.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-white font-semibold text-sm">
                        Total: <span className="text-emerald-400 text-lg">₹{(parseFloat(price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-3 bg-[#0b0d10] border border-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 rounded hover:bg-slate-800 transition text-slate-300"
                        >
                          <FiMinus />
                        </button>
                        <span className="font-semibold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 rounded hover:bg-slate-800 transition text-slate-300"
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                        title="Remove Item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ORDER SUMMARY */}
        {cart.length > 0 && (
          <div className="bg-[#0f1216] border border-slate-800 rounded-2xl shadow-md p-6 h-fit sticky top-24">
            <h2 className="text-xl font-semibold mb-6 text-white">Order Summary</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shipping</span>
                <span className="text-emerald-400 font-semibold">Free</span>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-emerald-400">₹{subtotal}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/chef/checkout")}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
