import React, { useContext, useEffect, useMemo, useState } from "react";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { upsertUserAddress, readUserAddresses } from "../../utils/addressStorage";

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const location = useLocation();
  const buyNowItem = location.state?.product ? location.state : null;
  const appliedCoupon = location.state?.appliedCoupon || null;
  
  const checkoutItems = buyNowItem?.product
    ? [
      {
        id: buyNowItem.product.id,
        product_id: buyNowItem.product.product_id || buyNowItem.product.id,
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
        chef_user_id: buyNowItem.product.chef_user_id || buyNowItem.product.created_by || buyNowItem.product.created_by_user_id || "",
        chef_id: buyNowItem.product.chef_id || "",
        chef_name: buyNowItem.product.chef_name || buyNowItem.product.created_by_name || "",
        chef_email: buyNowItem.product.chef_email || buyNowItem.product.created_by_email || "",
        chef_phone: buyNowItem.product.chef_phone || buyNowItem.product.created_by_phone || "",
        franchise_id: buyNowItem.product.franchise_id || "",
        franchise_user_id: buyNowItem.product.franchise_user_id || "",
        franchise_name: buyNowItem.product.franchise_name || "",
        franchise_email: buyNowItem.product.franchise_email || "",
        franchise_phone: buyNowItem.product.franchise_phone || "",
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
      setSavedAddresses(readUserAddresses(user.user_id));
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

  const fillAddress = (address) => {
    setSelectedAddressId(address.id);

    setName(address.customer_name || "");
    setEmail(address.customer_email || "");
    setPhone(address.customer_phone || "");
    setStreetAddress(address.street_address || "");
    setCity(address.city || "");
    setDistrict(address.district || "");
    setStateValue(address.state || "");
    setZipCode(address.zip_code || "");
    setCountry(address.country || "India");

    toast.success("Address loaded successfully.");
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const finalizeOrder = async (paymentId = null) => {
    try {
      const res = await placeFoodOrder({
        name,
        email,
        phone,
        street_address: streetAddress,
        city,
        district,
        state: stateValue,
        country,
        zip_code: zipCode,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "Online Payment" ? "Paid" : "Pending",
        payment_id: paymentId || null,
        coupon_id: appliedCoupon?.id || null,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discountAmount || 0,
        final_total: appliedCoupon ? appliedCoupon.finalTotal : subtotal,
        isBuyNow: Boolean(buyNowItem?.product),
        items: checkoutItems,
      });

      if (user?.user_id) {
        const nextAddresses = upsertUserAddress(user.user_id, {
          user_id: user.user_id,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          street_address: streetAddress,
          city,
          district,
          state: stateValue,
          country,
          zip_code: zipCode,
        });
        setSavedAddresses(nextAddresses);
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateDelivery();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === "Online Payment") {
      try {
        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error("Razorpay SDK failed to load.");
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: "rzp_test_SGj8n5SyKSE10b",
          amount: Math.round(subtotal * 100),
          currency: "INR",
          name: "Veetu Rusi",
          description: "Food Order Payment",
          handler: async function (response) {
            await finalizeOrder(response.razorpay_payment_id);
          },
          prefill: {
            name,
            email,
            contact: phone,
          },
          theme: {
            color: "#059669",
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        console.error(err);
        toast.error("Payment failed. Please try again.");
        setIsSubmitting(false);
      }
      return;
    }

    await finalizeOrder();
  };

  return (
    <>
      <PageHeader title="Food Checkout" />
      <div className="min-h-screen bg-gray-50 py-16">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">

              {savedAddresses.length > 0 && (
                <div className="bg-white rounded-3xl shadow p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Saved Addresses
                  </h2>

                  <div className="space-y-4">
                    {savedAddresses.slice(0, 3).map((address) => (
                      <div
                        key={address.id}
                        onClick={() => fillAddress(address)}
                        className={`rounded-2xl p-5 cursor-pointer transition-all duration-200
${selectedAddressId === address.id
                            ? "border-2 border-emerald-600 bg-emerald-50 shadow-lg ring-2 ring-emerald-200"
                            : "border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50"
                          }`}
                      >
                        <div className="grid md:grid-cols-2 gap-2 text-sm">

                          <p>
                            <span className="font-semibold">Name:</span>{" "}
                            {address.customer_name}
                          </p>

                          <p>
                            <span className="font-semibold">Email:</span>{" "}
                            {address.customer_email}
                          </p>

                          <p>
                            <span className="font-semibold">Phone:</span>{" "}
                            {address.customer_phone}
                          </p>

                          <p>
                            <span className="font-semibold">Street Address:</span>{" "}
                            {address.street_address}
                          </p>

                          <p>
                            <span className="font-semibold">City:</span>{" "}
                            {address.city}
                          </p>

                          <p>
                            <span className="font-semibold">District:</span>{" "}
                            {address.district}
                          </p>

                          <p>
                            <span className="font-semibold">State:</span>{" "}
                            {address.state}
                          </p>

                          <p>
                            <span className="font-semibold">ZIP Code:</span>{" "}
                            {address.zip_code}
                          </p>

                          <p className="md:col-span-2">
                            <span className="font-semibold">Country:</span>{" "}
                            {address.country}
                          </p>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Personal Information
                </h2>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  {/* Row 1 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Enter your street address"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      City
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter your city"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      District
                    </label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Enter your district"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      State
                    </label>

                    <select
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select State</option>

                      {/* States */}
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>

                      {/* Union Territories */}
                      <option value="Andaman and Nicobar Islands">
                        Andaman and Nicobar Islands
                      </option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">
                        Dadra and Nagar Haveli and Daman and Diu
                      </option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Enter your ZIP code"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Country
                    </label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Delivery Details
                </h2>

                <div className="grid gap-6 md:grid-cols-2">

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      min={getTomorrowDate()}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                </div>

                <div className="mt-8 border-t border-gray-300 pt-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Payment Information
                  </h3>

                  <div className="flex flex-wrap items-center gap-8">

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Cash on Delivery"
                        checked={paymentMethod === "Cash on Delivery"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="cursor-pointer"
                      />
                      <span>Cash on Delivery</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online Payment"
                        checked={paymentMethod === "Online Payment"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="cursor-pointer"
                      />
                      <span>Online Payment</span>
                    </label>

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
                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-600 font-semibold mt-2">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-black text-slate-900 mt-4">
                      <span>Total</span>
                      <span>₹{appliedCoupon ? appliedCoupon.finalTotal.toFixed(2) : subtotal.toFixed(2)}</span>
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
