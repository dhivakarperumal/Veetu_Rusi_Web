import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import PageHeader from "../CommenComponents/PageHeader";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";



const Checkout = () => {

  const { cart, clearCart } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const navigate = useNavigate();

  const location = useLocation();

  const buyNowProduct = location.state?.product;
  const buyNowVariant = location.state?.variant;
  const buyNowSize = location.state?.size;
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const buyNowQuantity = location.state?.quantity || 1;

  const fetchAddresses = async () => {
    try {

      const res = await api.get("/orders");

      const userAddresses = res.data.filter(
        (addr) => addr.user_id === user?.user_id
      );

      setAddresses(userAddresses);

    } catch (error) {
      console.error(error);
    }
  };

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
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi"
  ];

  const checkoutItems = buyNowProduct
    ? [
      {
        id: buyNowProduct.id,
        name: buyNowProduct.name,
        image: buyNowVariant?.images?.[0],
        price: buyNowProduct.offer_price,
        quantity: buyNowQuantity,
        size: buyNowSize,
        colorName: buyNowVariant?.color
      }
    ]
    : cart;

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

      // Save order
      await api.post("/orders", orderData);

      // ❌ removed update-stock API

      // Clear cart
      await clearCart();

      // Reset form
      setForm({
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
        payment_method: "Showroom"
      });

      toast.success("Order Placed Successfully!");
      navigate("/account?tab=orders");

    } catch (error) {
      console.error(error);
      alert("Order failed");
    }
  };

  const handleOrder = async () => {

    if (!form.customer_name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!form.customer_email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (!form.customer_phone.trim()) {
      toast.error("Please enter phone number");
      return;
    }

    if (!form.street_address.trim()) {
      toast.error("Please enter street address");
      return;
    }

    if (!form.city.trim()) {
      toast.error("Please enter city");
      return;
    }

    if (!form.district.trim()) {
      toast.error("Please enter district");
      return;
    }

    if (!form.state.trim()) {
      toast.error("Please select state");
      return;
    }

    if (!form.zip_code.trim()) {
      toast.error("Please enter zip code");
      return;
    }

    if (!checkoutItems.length) {
      alert("No product to checkout");
      return;
    }

    try {

      // CASH ON DELIVERY
      if (paymentMethod === "cod") {
        await saveOrder();
        return;
      }

      // RAZORPAY PAYMENT
      const loaded = await loadRazorpay();

      if (!loaded) {
        alert("Razorpay SDK failed to load");
        return;
      }

      const options = {
        key: "rzp_test_SGj8n5SyKSE10b",
        amount: total * 100,
        currency: "INR",
        name: "Saree World",
        description: "Order Payment",

        handler: async function (response) {

          console.log("Payment Success:", response);

          await saveOrder(response.razorpay_payment_id);

        },

        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.customer_phone
        },

        theme: {
          color: "#ef4444"
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
    <>
      <PageHeader title="Checkout" />
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">

        {/* LEFT SIDE FORM */}
        <div className="lg:col-span-2 space-y-8">

          {/* SAVED ADDRESSES */}

          {addresses.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">

              <h2 className="text-lg font-semibold mb-4">
                Select Saved Address
              </h2>

              <div className="space-y-4">

                {addresses.map((addr) => (

                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className={`border p-4 rounded-lg cursor-pointer transition
            ${selectedAddress === addr.id
                        ? "border-primary bg-red-50"
                        : "hover:border-gray-400"
                      }`}
                  >

                    <p className="text-sm leading-6">

                      <strong>{addr.customer_name}</strong> <br />

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
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Customer Details</h2>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                name="customer_name"
                placeholder="Full Name"
                value={form.customer_name}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="customer_email"
                placeholder="Email"
                value={form.customer_email}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="customer_phone"
                placeholder="Phone Number"
                value={form.customer_phone}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

            <textarea
              name="street_address"
              placeholder="Street Address"
              value={form.street_address}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full mb-4"
            />

            <div className="grid md:grid-cols-3 gap-4">

              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="district"
                placeholder="District"
                value={form.district}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              >
                <option value="">Select State</option>

                {indianStates.map((state, i) => (
                  <option key={i} value={state}>
                    {state}
                  </option>
                ))}

              </select>

            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">

              <input
                name="zip_code"
                placeholder="Zip Code"
                value={form.zip_code}
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="country"
                value="India"
                readOnly
                className="border p-3 rounded-lg bg-gray-100"
              />

            </div>

          </div>

          {/* CART ITEMS */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-lg font-semibold mb-4">Your Items</h2>

            <div className="space-y-4">

              {checkoutItems.map((item) => (

                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b pb-3"
                >

                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded"
                  />

                  <div className="flex-1">

                    <p className="font-semibold">{item.name}</p>

                    <div className="text-sm text-gray-500 space-y-1">

                      <p>Qty: {item.quantity}</p>

                      {item.colorName && (
                        <p className="flex items-center gap-2">

                          <span
                            className="w-3 h-3 rounded-full border border-gray-400"
                            style={{ backgroundColor: item.colorHex || item.color || "#ccc" }}
                          ></span>

                          <span
                            className="font-semibold"
                            style={{
                              color: item.colorHex || item.color || "#555",
                              textShadow: "0 0 1px rgba(0,0,0,0.4)"
                            }}
                          >
                            {item.colorName}
                          </span>
                        </p>
                      )}

                      {item.size && (
                        <p>
                          Size: {item.size}
                        </p>
                      )}

                    </div>

                  </div>

                  <span className="font-semibold">
                    ₹{item.price * item.quantity}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white p-6 rounded-xl shadow h-fit sticky top-24">

          <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>

            <div className="border-t pt-4 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

          </div>

          <div className="mt-6">
            <p className="font-semibold mb-2">Payment Method</p>

            {/* <label className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Cash on Delivery
            </label> */}

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Online Payment (Razorpay)
            </label>
          </div>

          <button
            onClick={handleOrder}
            className="w-full cursor-pointer mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light"
          >
            Place Order
          </button>

        </div>

      </div>
    </>
  );
};

export default Checkout;