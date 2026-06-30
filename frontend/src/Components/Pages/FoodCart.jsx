import React, { useContext } from "react";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import CouponSection from "../CommenComponents/CouponSection";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

export default function FoodCartPage() {
  const { userFoodCart, removeFromFoodCart, updateFoodCartQuantity } = useContext(StoreContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const cleanPath = url.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl}${finalPath}`;
  };

  const subtotal = userFoodCart.reduce(
    (total, item) => total + parseFloat(item.price || 0) * item.quantity,
    0
  );

  const isCartEmpty = userFoodCart.length === 0;

  return (
    <>
      <PageHeader title="My Food Cart" />
      <div className="min-h-screen bg-gray-50 py-16">
        <PageContainer>
          <div className="grid lg:grid-cols-3 gap-10">

            <div className="lg:col-span-2">
              <div className="overflow-x-auto bg-white rounded-3xl shadow-md">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Item</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userFoodCart.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                          Your food cart is empty. Browse available foods and add items to your food cart.
                        </td>
                      </tr>
                    ) : (
                      userFoodCart.map((item, index) => {
                        const image = resolveImageUrl(item.image);
                        const price = parseFloat(item.price || 0);
                        const total = (price * item.quantity).toFixed(2);

                        return (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                                  <img
                                    src={image}
                                    alt={item.name}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{item.name}</p>
                                  {item.category && <p className="mt-1 text-sm text-gray-500">{item.category}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top font-semibold text-gray-800">₹{price.toFixed(2)}</td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateFoodCartQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  title={item.quantity <= 1 ? "Minimum quantity is 1" : "Decrease quantity"}
                                  aria-label="Decrease quantity"
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 transition ${item.quantity <= 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                  <FiMinus />
                                </button>
                                <span className="w-10 text-center text-gray-700 font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateFoodCartQuantity(item.id, item.quantity + 1)}
                                  className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                >
                                  <FiPlus />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top font-semibold text-gray-800">₹{total}</td>
                            <td className="px-6 py-4 align-top">
                              <button
                                onClick={() => removeFromFoodCart(item.id)}
                                title="Remove item"
                                aria-label={`Remove ${item.name} from cart`}
                                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600 transition"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-24">

              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Order Summary
              </h2>

              <div className="space-y-4 mb-4">

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-light">
                    ₹{appliedCoupon ? appliedCoupon.finalTotal.toFixed(2) : subtotal.toFixed(2)}
                  </span>
                </div>

              </div>

              {!isCartEmpty && (
                <CouponSection 
                  cartItems={userFoodCart}
                  cartTotal={subtotal} 
                  customerId={user?.id}
                  appliedCoupon={appliedCoupon}
                  onCouponApplied={setAppliedCoupon}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                />
              )}

              <button
                onClick={() => navigate("/food-checkout", { state: { appliedCoupon } })}
                disabled={isCartEmpty}
                className={`w-full mt-3 py-3 rounded-lg font-semibold transition ${isCartEmpty
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  }`}
              >
                Food Checkout
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full mt-3 border border-primary-light text-primary-light py-3 rounded-lg hover:bg-primary-light/10 transition cursor-pointer"
              >
                Continue Shopping
              </button>

            </div>

          </div>
        </PageContainer>
      </div>
    </>
  );
}
