import React, { useState, useEffect } from "react";
import { ShoppingCart, Trash2, Calendar, Loader } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";

const PreorderFoodSystem = () => {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    deliveryDate: "",
    specialRequests: "",
    price: "",
    customerEmail: "",
    customerPhone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    fetchPreorders();
  }, []);

  const fetchPreorders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/preorders");
      setPreorders(res.data);
    } catch (error) {
      console.error("Error fetching preorders:", error);
      toast.error("Failed to load preorders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.itemName ||
      !formData.quantity ||
      !formData.deliveryDate ||
      !formData.price
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/preorders", {
        itemName: formData.itemName,
        quantity: parseInt(formData.quantity),
        deliveryDate: formData.deliveryDate,
        specialRequests: formData.specialRequests,
        price: parseFloat(formData.price),
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
      });

      toast.success("Preorder added successfully!");
      setFormData({
        itemName: "",
        quantity: "",
        deliveryDate: "",
        specialRequests: "",
        price: "",
        customerEmail: "",
        customerPhone: "",
      });
      
      // Refresh the list
      fetchPreorders();
    } catch (error) {
      console.error("Error creating preorder:", error);
      toast.error(error.response?.data?.message || "Failed to create preorder");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/preorders/${id}/status`, { status: newStatus });
      setPreorders(
        preorders.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating preorder:", error);
      toast.error("Failed to update preorder status");
    }
  };

  const deleteOrder = async (id) => {
    try {
      await api.delete(`/preorders/${id}`);
      setPreorders(preorders.filter((o) => o.id !== id));
      toast.success("Preorder deleted!");
    } catch (error) {
      console.error("Error deleting preorder:", error);
      toast.error("Failed to delete preorder");
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    prepared: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Preorders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage customer preorders and track preparation
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              placeholder="e.g., Wedding Biryani Package"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Quantity (plates) *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Delivery Date *
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., 5000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Customer Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Customer Email
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              placeholder="customer@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Customer Phone
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              placeholder="9876543210"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Special Requests
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            placeholder="e.g., No salt, Extra spicy, etc."
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Adding Preorder...
            </>
          ) : (
            "Add Preorder"
          )}
        </button>
      </form>

      {/* Preorders List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Preorders</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="ml-3 text-gray-600">Loading preorders...</p>
          </div>
        ) : preorders.length === 0 ? (
          <p className="text-gray-500">No preorders yet.</p>
        ) : (
          <div className="grid gap-4">
            {preorders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-6 space-y-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {order.item_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Qty: {order.quantity} plates
                    </p>
                    {order.customer_email && (
                      <p className="text-xs text-gray-500 mt-1">
                        Customer: {order.customer_email}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{Number(order.price).toLocaleString()}
                    </p>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700 mt-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {order.special_requests && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Special Requests:
                    </p>
                    <p className="text-sm text-gray-600">{order.special_requests}</p>
                  </div>
                )}

                {/* Status Update */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        statusColors[order.status]
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["pending", "confirmed", "prepared", "delivered"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          className={`px-3 py-1 text-xs rounded font-bold transition ${
                            order.status === status
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreorderFoodSystem;
