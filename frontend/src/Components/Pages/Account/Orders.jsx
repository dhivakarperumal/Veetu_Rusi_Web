import React, { useEffect, useState, useContext } from "react";
import PageContainer from "../../CommenComponents/PageContainer";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          classes: "bg-emerald-50 text-emerald-600 border-emerald-200",
          icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
        };

      case "shipped":
        return {
          classes: "bg-blue-50 text-blue-600 border-blue-200",
          icon: <Truck className="w-4 h-4 mr-1.5 animate-pulse" />,
        };

      case "processing":
        return {
          classes: "bg-amber-50 text-amber-600 border-amber-200",
          icon: <Clock className="w-4 h-4 mr-1.5 animate-spin-slow" />,
        };

      default:
        return {
          classes: "bg-gray-50 text-gray-600 border-gray-200",
          icon: <Package className="w-4 h-4 mr-1.5" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${config.classes}`}
    >
      {config.icon}
      {status}
    </span>
  );
};

export default function Orders() {
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [address, setAddress] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");

        const allOrders = res.data || [];

        const userOrders = allOrders.filter(
          (order) => order.user_id === user?.user_id,
        );

        setOrders(userOrders);
      } catch (error) {
        console.error("Failed to load orders", error);
      }
    };

    if (user?.user_id) fetchOrders();
  }, [user]);

  const openOrderDetails = async (order) => {
    setLoadingOrder(true);

    try {
      // fetch order details
      const orderRes = await api.get(`/orders/${order.id}`);
      setSelectedOrder(orderRes.data);

      // fetch address using order_id
      const addressRes = await api.get(`/addresses/${order.id}`);
      setAddress(addressRes.data);

      setShowPopup(true);
    } catch (error) {
      console.error("Failed to load order details", error);
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10">
      <PageContainer>
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>

          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => openOrderDetails(order)}
                className="bg-white rounded-3xl border border-primary/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                {/* top gradient */}
                <div className="h-2 w-full bg-gradient-to-r from-primary-light via-primary-light to-secondary"></div>

                {/* ORDER SUMMARY CARD */}
                <div className="bg-gradient-to-br from-primary-light/10 via-white to-secondary/10 pt-6 px-6 pb-4">
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Order ID</span>
                      <span className="font-semibold">
                        {order.order_id || order.id}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-primary/10 pb-2">
                      <span className="text-gray-500">Status</span>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex justify-between pt-2 text-base font-bold bg-primary/5 px-3 py-2 rounded-lg">
                      <span>Total Amount</span>
                      <span className="text-primary">
                        ₹{order.total_amount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="px-6 pt-4 pb-0 space-y-6">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-6 items-start border border-primary/10 rounded-2xl p-4 hover:shadow-lg hover:border-primary/30 transition bg-white group-hover:bg-primary/5"
                    >
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-24 h-28 object-cover rounded-xl shadow-md border border-primary/10"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold text-lg text-primary-dark group-hover:text-primary transition">
                            {item.product_name}
                          </h3>

                          <p className="font-bold text-primary text-lg bg-primary/10 px-3 py-1 rounded-lg">
                            ₹{item.price}
                          </p>
                        </div>

                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          {item.variant_color && (
                            <p>Color: {item.variant_color}</p>
                          )}

                          {item.variant_size && (
                            <p>Size: {item.variant_size}</p>
                          )}

                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        {showPopup && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
              {/* HEADER */}

              <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-primary-light to-secondary text-white">
                <h2 className="text-2xl font-bold tracking-wide">
                  Order Details
                </h2>

                <button
                  onClick={() => setShowPopup(false)}
                  className="text-white text-2xl hover:scale-110 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* CONTENT */}

              <div className="p-8 overflow-y-auto space-y-8">
                {loadingOrder ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* ORDER INFO */}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order ID
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {selectedOrder.order_id || selectedOrder.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          User ID
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {selectedOrder.user_id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order Date
                        </p>
                        <p className="font-semibold text-primary-dark">
                          {new Date(
                            selectedOrder.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Payment Method
                        </p>
                        <p className="font-semibold capitalize text-primary-dark">
                          {selectedOrder.payment_method}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Payment Status
                        </p>
                        <p className="font-semibold capitalize text-primary-dark">
                          {selectedOrder.payment_status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Order Status
                        </p>
                        <StatusBadge status={selectedOrder.status} />
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
                          Total Amount
                        </p>
                        <p className="font-bold text-primary text-lg">
                          ₹{selectedOrder.total_amount}
                        </p>
                      </div>
                    </div>

                    {/* SHIPPING ADDRESS */}

                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Shipping Address
                      </h3>

                      <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
                        {address ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="font-semibold">
                              {address.customer_name}
                            </p>

                            <p>{address.street_address}</p>

                            <p>
                              {address.city}, {address.district}
                            </p>

                            <p>
                              {address.state} - {address.zip_code}
                            </p>

                            <p>{address.country}</p>

                            <p>Phone: {address.customer_phone}</p>

                            <p>Email: {address.customer_email}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Address not available</p>
                        )}
                      </div>
                    </div>

                    {/* PRODUCT DETAILS */}

                    <div>
                      <h3 className="text-lg font-bold text-primary-dark mb-4">
                        Products
                      </h3>

                      <div className="space-y-5">
                        {selectedOrder.items &&
                        selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, index) => {
                            const subtotal = item.price * item.quantity;

                            return (
                              <div
                                key={index}
                                className="flex gap-5 border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                              >
                                <img
                                  src={item.image}
                                  alt={item.product_name}
                                  className="w-24 h-28 object-cover rounded-xl"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.png";
                                  }}
                                />

                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <h4 className="font-semibold text-lg text-primary-dark">
                                      {item.product_name}
                                    </h4>

                                    <p className="font-bold text-primary text-lg">
                                      ₹{item.price}
                                    </p>
                                  </div>

                                  <div className="text-sm text-gray-600 mt-3 space-y-1">
                                    {(item.color || item.variant_color) && (
                                      <p>
                                        <span className="font-medium">
                                          Color:
                                        </span>{" "}
                                        {item.color || item.variant_color}
                                      </p>
                                    )}

                                    {(item.size || item.variant_size) && (
                                      <p>
                                        <span className="font-medium">
                                          Size:
                                        </span>{" "}
                                        {item.size || item.variant_size}
                                      </p>
                                    )}

                                    <p>
                                      <span className="font-medium">
                                        Quantity:
                                      </span>{" "}
                                      {item.quantity}
                                    </p>

                                    <p>
                                      <span className="font-medium">
                                        Subtotal:
                                      </span>{" "}
                                      ₹{subtotal}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center py-6">
                            No items in this order
                          </p>
                        )}
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-6 border-t border-gray-100 pt-6 flex justify-between items-center">
                      <p className="text-xl font-bold text-primary-dark">
                        Total: ₹{selectedOrder.total_amount}
                      </p>

                      <button
                        onClick={() => setShowPopup(false)}
                        className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-2.5 rounded-xl font-semibold shadow-md hover:opacity-90 transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <style>
        {`
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
          `}
      </style>
    </div>
  );
}
