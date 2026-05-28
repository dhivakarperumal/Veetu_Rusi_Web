import React, { useContext } from "react";
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

export default function FoodCartPage() {
  const { userFoodCart, removeFromFoodCart, updateFoodCartQuantity } = useContext(StoreContext);
  const navigate = useNavigate();

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

  return (
    <>
      <PageHeader title="My Food Cart" />
      <div className="min-h-screen bg-gray-50 py-16">
        <PageContainer>
          <div className=" grid lg:grid-cols-3 gap-10">

            <div className="lg:col-span-2 space-y-6">

              {userFoodCart.length === 0 ? (

                <div className="text-center py-24 bg-white rounded-xl shadow">

                  <FiShoppingCart className="mx-auto text-primary-light text-5xl mb-4" />

                  <h2 className="text-xl font-semibold text-gray-700">
                    Your food cart is empty
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Browse available foods and add items to your food cart.
                  </p>

                  <button
                    onClick={() => navigate("/shop")}
                    className="mt-6 px-6 py-3 bg-primary text-white rounded-lg"
                  >
                    Browse Foods
                  </button>

                </div>

              ) : (

                userFoodCart.map((item, index) => {

                  const image = resolveImageUrl(item.image);
                  const price = item.price;

                  return (

                    <div
                      key={index}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 flex flex-col md:flex-row gap-6 items-center"
                    >

                      <div className="w-32 h-40 rounded-lg overflow-hidden">

                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />

                      </div>

                      <div className="flex-1">

                        <h3 className="font-semibold text-lg text-gray-800">
                          {item.name}
                        </h3>

                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          {item.category && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3">

                          <span className="text-primary-light font-bold text-lg">
                            ₹{price}
                          </span>

                        </div>

                        <div className="flex items-center gap-3 mt-4">

                          <button
                            onClick={() => updateFoodCartQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer"
                          >
                            <FiMinus />
                          </button>

                          <span className="font-semibold text-gray-700">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateFoodCartQuantity(item.id, item.quantity + 1)}
                            className="bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer"
                          >
                            <FiPlus />
                          </button>

                        </div>

                      </div>

                      <button
                        onClick={() => removeFromFoodCart(item.id)}
                        className="bg-primary-light text-white p-2 rounded-lg hover:bg-primary-dark transition cursor-pointer"
                      >
                        <FiTrash2 />
                      </button>

                    </div>

                  );
                })

              )}

            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-24">

              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Order Summary
              </h2>

              <div className="space-y-4">

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>

                <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-light">₹{subtotal}</span>
                </div>

              </div>

              <button onClick={() => navigate("/checkout")} className="w-full mt-6 bg-primary-light hover:bg-primary-dark text-white py-3 rounded-lg font-semibold transition cursor-pointer">
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/shop")}
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
