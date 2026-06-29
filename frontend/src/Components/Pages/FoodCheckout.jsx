import React, { useContext, useEffect, useMemo, useState } from "react";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";



const getTomorrowDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

export default function FoodCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userFoodCart, placeFoodOrder } = useContext(StoreContext);
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [country, setCountry] = useState("India");
  const [zipCode, setZipCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowDate());
  const [deliveryTime, setDeliveryTime] = useState("12:00");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const location = useLocation();
  const buyNowItem = location.state;
  const checkoutItems = buyNowItem?.product
    ? [
      {
        id: buyNowItem.product.id,
        name: buyNowItem.product.name,
        image:
          buyNowItem.variant?.images?.[0] ||
          buyNowItem.product.images?.[0],
        price:
          buyNowItem.variant?.final_price ||
          buyNowItem.product.final_price ||
          buyNowItem.product.offer_price ||
          buyNowItem.product.price,
        quantity: buyNowItem.quantity,
        variant: buyNowItem.variant,
        size: buyNowItem.size,
      },
    ]
    : userFoodCart;

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (total, item) =>
          total + parseFloat(item.price || 0) * (item.quantity || 1),
        0
      ),
    [checkoutItems]
  );

  useEffect(() => {
    setDeliveryDate(getTomorrowDate());
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || user.username || "");
      setEmail(user.email || "");
      setPhone(user.phone || user.mobile || "");
    }
  }, [user]);

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const cleanPath = url.replace(/\\/g, "/");
    const finalPath = cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`;

    return `${backendUrl}${finalPath}`;
  };

  const validateDelivery = () => {
    const requiredFields = [streetAddress, city, district, stateValue, country, zipCode];
    if (!user) return "Please login to continue.";
    if (!checkoutItems.length) return "Your food cart is empty.";
    if (requiredFields.some((field) => !field.trim())) return "Please fill in all address fields.";
    if (!deliveryDate || !deliveryTime) return "Please choose a delivery date and time.";

    const selectedDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 24);

    if (selectedDateTime < minDateTime) {
      return "Delivery must be scheduled at least 24 hours from now.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateDelivery();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await placeFoodOrder({
        street_address: streetAddress,
        city,
        district,
        state: stateValue,
        country,
        zip_code: zipCode,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        payment_method: paymentMethod,
      });

      toast.success("Order placed successfully.");
      const newOrderId = res?.id || res?.insertId || null;
      if (newOrderId) {
        navigate("/food-orders", { state: { newOrderId } });
      } else {
        navigate("/food-orders");
      }
    } catch (err) {
      toast.error("Unable to place the order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Food Checkout" />
      <div className="min-h-screen bg-gray-50 py-16">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option>Cash on Delivery</option>
                      <option>Online Payment</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Delivery details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                    <textarea
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">District</label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                    <input
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">ZIP / Postal Code</label>
                    <input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Schedule delivery</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      min={getTomorrowDate()}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Time</label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>


            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Order summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Items</span>
                    <span>{checkoutItems.length}</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {checkoutItems.map((item) => {
                      const image = resolveImageUrl(item.image);

                      return (
                        <div
                          key={item.id}
                          className="rounded-3xl border border-slate-200 p-4 bg-slate-50"
                        >
                          <div className="flex items-center gap-4">

                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/images/no-image.png";
                                }}
                              />
                            </div>

                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {item.name}
                              </p>

                              <p className="text-sm text-slate-500 mt-1">
                                Qty {item.quantity} × ₹{parseFloat(item.price || 0).toFixed(2)}
                              </p>
                            </div>

                            <p className="font-semibold text-slate-900 whitespace-nowrap">
                              ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                            </p>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 mt-4">
                      <span>Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-8 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Placing order...' : 'Place Order'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/food-cart')}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to cart
                </button>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
}
