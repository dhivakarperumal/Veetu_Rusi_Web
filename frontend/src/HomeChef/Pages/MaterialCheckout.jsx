import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import toast from "react-hot-toast";

const MaterialCheckout = () => {
  const { cart, clearCart } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowProduct = location.state?.product;
  const buyNowVariant = location.state?.variant;
  const buyNowSize = location.state?.size;
  const buyNowQuantity = location.state?.quantity || 1;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

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

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/orders/myorders");
      setAddresses(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const [form, setForm] = useState({
    user_id: user?.user_id || "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    street_address: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    zip_code: "",
    payment_method: "Online Payment"
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        user_id: user.user_id || "",
        customer_name: user.username || user.name || user.full_name || "",
        customer_email: user.email || "",
        customer_phone: user.phone || user.mobile || user.mobile_number || "",
      }));
    }
  }, [user]);
  
  useEffect(() => {
    if (user?.user_id) {
      fetchAddresses();
    }
  }, [user]);

  const selectAddress = (address) => {
    setSelectedAddress(address.id);
    setForm({
      ...form,
      customer_name: address.customer_name,
      customer_email: address.customer_email,
      customer_phone: address.customer_phone,
      street_address: address.street_address,
      city: address.city,
      district: address.district,
      state: address.state,
      country: address.country,
      zip_code: address.zip_code
    });
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
  ];

  const checkoutItems = buyNowProduct
    ? [
      {
        id: buyNowProduct.id,
        name: buyNowProduct.name,
        image: resolveImageUrl(buyNowVariant?.images?.[0] || buyNowProduct.images?.[0]),
        price: buyNowVariant?.offerPrice || buyNowVariant?.price || buyNowProduct.offer_price || buyNowProduct.price,
        quantity: buyNowQuantity,
        size: buyNowSize,
        colorName: buyNowVariant?.color
      }
    ]
    : cart;

  const subtotal = checkoutItems.reduce(
    (total, item) => total + parseFloat(item.price || 0) * item.quantity,
    0
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const saveOrder = async (paymentId = null) => {
    try {
      const orderItems = checkoutItems.map((item) => ({
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        variant_color: item.variant_color || item.colorName || "",
        variant_size: item.variant_size || item.size || "",
        price: item.price,
        image: item.image,
        email: form.customer_email,
        user_id: user?.user_id
      }));

      const orderData = {
        ...form,
        user_id: user?.user_id,
        email: form.customer_email,
        payment_status: paymentMethod === "razorpay" ? "paid" : "pending",
        payment_id: paymentId,
        items: orderItems,
        total_amount: total,
        created_at: new Date().toISOString()
      };

      await api.post("/orders", orderData);
      
      if (!buyNowProduct) {
        await clearCart();
      }

      toast.success("Order Placed Successfully!");
      navigate("/chef/orders");

    } catch (error) {
      console.error(error);
      alert("Order failed");
    }
  };

  const handleOrder = async () => {
    if (!form.customer_name.trim()) return toast.error("Please enter your name");
    if (!form.customer_email.trim()) return toast.error("Please enter email");
    if (!form.customer_phone.trim()) return toast.error("Please enter phone number");
    if (!form.street_address.trim()) return toast.error("Please enter street address");
    if (!form.city.trim()) return toast.error("Please enter city");
    if (!form.district.trim()) return toast.error("Please enter district");
    if (!form.state.trim()) return toast.error("Please select state");
    if (!form.zip_code.trim()) return toast.error("Please enter zip code");
    if (!checkoutItems.length) return alert("No product to checkout");

    try {
      if (paymentMethod === "cod") {
        await saveOrder();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) return alert("Razorpay SDK failed to load");

      const options = {
        key: "rzp_test_SGj8n5SyKSE10b",
        amount: total * 100,
        currency: "INR",
        name: "Veetu Rusi",
        description: "Order Payment",
        handler: async function (response) {
          await saveOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.customer_phone
        },
        theme: {
          color: "#059669" // emerald-600
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 text-slate-200">
      <h1 className="text-2xl font-bold mb-6 text-white">Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE FORM */}
        <div className="lg:col-span-2 space-y-6">

          {/* SAVED ADDRESSES */}
          {addresses.length > 0 && (
            <div className="bg-[#0f1216] border border-slate-800 p-6 rounded-2xl shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-white">Select Saved Address</h2>
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className={`border p-4 rounded-xl cursor-pointer transition ${
                      selectedAddress === addr.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm leading-6 text-slate-300">
                      <strong className="text-white">{addr.customer_name}</strong> <br />
                      {addr.street_address} <br />
                      {addr.city}, {addr.district} <br />
                      {addr.state} - {addr.zip_code} <br />
                      {addr.country} <br />
                      Phone: {addr.customer_phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMER DETAILS */}
          <div className="bg-[#0f1216] border border-slate-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-white">Customer Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="customer_name"
                placeholder="Full Name"
                value={form.customer_name}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl w-full focus:outline-none focus:border-emerald-500"
              />
              <input
                name="customer_email"
                placeholder="Email"
                value={form.customer_email}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl w-full focus:outline-none focus:border-emerald-500"
              />
              <input
                name="customer_phone"
                placeholder="Phone Number"
                value={form.customer_phone}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl w-full focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="bg-[#0f1216] border border-slate-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-white">Shipping Address</h2>
            <textarea
              name="street_address"
              placeholder="Street Address"
              value={form.street_address}
              onChange={handleChange}
              className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl w-full mb-4 focus:outline-none focus:border-emerald-500"
            />
            <div className="grid md:grid-cols-3 gap-4">
              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <input
                name="district"
                placeholder="District"
                value={form.district}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select State</option>
                {indianStates.map((state, i) => (
                  <option key={i} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <input
                name="zip_code"
                placeholder="Zip Code"
                value={form.zip_code}
                onChange={handleChange}
                className="bg-[#0b0d10] border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <input
                name="country"
                value="India"
                readOnly
                className="bg-slate-900 border border-slate-800 text-slate-400 p-3 rounded-xl"
              />
            </div>
          </div>

          {/* CART ITEMS */}
          <div className="bg-[#0f1216] border border-slate-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-white">Your Items</h2>
            <div className="space-y-4">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 border-b border-slate-800 pb-3">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded-lg border border-slate-800"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.name}</p>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Qty: {item.quantity}</p>
                      {(item.variant_color || item.colorName) && (item.variant_color !== 'Default') && (
                        <p className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-600"
                            style={{ backgroundColor: item.colorHex || item.color || "#ccc" }}
                          ></span>
                          <span className="font-semibold text-slate-300">
                            {item.variant_color || item.colorName}
                          </span>
                        </p>
                      )}
                      {(item.variant_size || item.size) && (item.variant_size !== 'Free Size') && (
                        <p>Weight/Size: {item.variant_size || item.size}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-400">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-[#0f1216] border border-slate-800 p-6 rounded-2xl shadow-md h-fit sticky top-24">
          <h2 className="text-lg font-semibold mb-6 text-white">Order Summary</h2>
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
              <span className="text-emerald-400">₹{total}</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="font-semibold mb-2 text-slate-300">Payment Method</p>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="radio"
                name="payment"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-emerald-500"
              />
              Online Payment (Razorpay)
            </label>
          </div>
          <button
            onClick={handleOrder}
            className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialCheckout;