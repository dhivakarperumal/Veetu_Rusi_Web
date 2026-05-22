import React, { useState } from "react";
import { ShoppingCart, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const PreorderFoodSystem = () => {
  const [preorders, setPreorders] = useState([]);
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    deliveryDate: "",
    specialRequests: "",
    price: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
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

    setPreorders([
      ...preorders,
      {
        ...formData,
        id: Date.now(),
        status: "pending",
        orderedAt: new Date(),
      },
    ]);
    toast.success("Preorder added!");
    setFormData({
      itemName: "",
      quantity: "",
      deliveryDate: "",
      specialRequests: "",
      price: "",
    });
  };

  const updateStatus = (id, newStatus) => {
    setPreorders(
      preorders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
    toast.success(`Order status updated to ${newStatus}`);
  };

  const deleteOrder = (id) => {
    setPreorders(preorders.filter((o) => o.id !== id));
    toast.success("Preorder deleted!");
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
        <h1 className="text-3xl font-black text-slate-900">Preorder Food System</h1>
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
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
        >
          Add Preorder
        </button>
      </form>

      {/* Preorders List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Preorders</h2>
        {preorders.length === 0 ? (
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
                      {order.itemName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Qty: {order.quantity} plates
                    </p>
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
                      Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

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
