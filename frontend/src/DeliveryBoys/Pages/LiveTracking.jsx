import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  MapPin, Phone, User, Clock, Truck, Package, CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";

const LiveTracking = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveDeliveries();
    const interval = setInterval(fetchActiveDeliveries, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchActiveDeliveries = async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/delivery/orders?status=Out for Delivery");
      setOrders(Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(res.data) && res.data.length > 0 && !selectedOrder) {
        setSelectedOrder(res.data[0]);
      }
    } catch (error) {
      console.error("Fetch active deliveries error:", error);
      toast.error("Failed to load active deliveries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "out for delivery":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "picked up":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "out for delivery":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "picked up":
        return <Package className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Live Tracking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/5 shadow-2xl"
        style={{ background: "linear-gradient(130deg,#0a2010 0%,#0B1120 60%,#0a1020 100%)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #06B6D4 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-1">
              Real-Time
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tight leading-none">
              Live Tracking
            </h1>
            <p className="text-xs text-white/30 font-semibold mt-2 uppercase tracking-widest">
              {orders.length} active delivery{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchActiveDeliveries}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-lg shadow-cyan-900/40"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
            No active deliveries at this time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Deliveries List */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">Active Orders</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    selectedOrder?.id === order.id
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200 shadow-md"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-slate-800">#ORD-0{order.id}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{order.order_id}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                    <User className="w-3 h-3" />
                    {order.customer_name || "Guest"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">#ORD-0{selectedOrder.id}</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{selectedOrder.order_id}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-6 border-b border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name</p>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-[11px] font-black text-blue-600">
                          {selectedOrder.customer_name?.charAt(0) || "C"}
                        </div>
                        <span className="font-bold text-slate-700">{selectedOrder.customer_name || "Guest"}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                      <a href={`tel:${selectedOrder.customer_phone}`} className="flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 transition">
                        <Phone className="w-4 h-4" />
                        {selectedOrder.customer_phone || "N/A"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="p-6 border-b border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-slate-800 mb-2">
                      {[
                        selectedOrder.street_address,
                        selectedOrder.city,
                        selectedOrder.district,
                        selectedOrder.state,
                        selectedOrder.zip_code
                      ].filter(Boolean).join(", ") || "Address unavailable"}
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6 border-b border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                      <p className="text-xl font-black text-emerald-600">₹{Number(selectedOrder.total_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Time</p>
                      <p className="font-bold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(selectedOrder.ordered_at || selectedOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Delivery Progress</h4>
                  <div className="space-y-3">
                    {[
                      { step: "Order Placed", completed: true },
                      { step: "Picked Up", completed: ["Picked Up", "Out for Delivery", "Delivered"].includes(selectedOrder.status) },
                      { step: "Out for Delivery", completed: ["Out for Delivery", "Delivered"].includes(selectedOrder.status) },
                      { step: "Delivered", completed: selectedOrder.status === "Delivered" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                          item.completed 
                            ? "bg-emerald-100 border-emerald-500 text-emerald-700" 
                            : "bg-gray-100 border-gray-300 text-gray-400"
                        }`}>
                          {item.completed ? "✓" : i + 1}
                        </div>
                        <span className={`font-bold ${item.completed ? "text-emerald-700" : "text-gray-500"}`}>
                          {item.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center">
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                  Select an order to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
