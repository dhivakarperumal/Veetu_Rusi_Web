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
          return "bg-slate-900 text-cyan-300 border-cyan-800";
        case "delivered":
          return "bg-slate-900 text-emerald-300 border-emerald-800";
        case "picked up":
          return "bg-slate-900 text-amber-300 border-amber-800";
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
        <div className="w-10 h-10 border-4 border-cyan-600/20 border-t-cyan-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Live Tracking...</p>
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
        <div className="table-card rounded-[2.5rem] p-12 text-center border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <Truck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">
            No active deliveries at this time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Deliveries List */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-tight mb-4">Active Orders</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    selectedOrder?.id === order.id
                      ? "bg-slate-900/90 border-blue-500 ring-2 ring-blue-500/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                      : "bg-slate-950/80 border-white/10 hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-slate-100">#ORD-0{order.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{order.order_id}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
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
              <div className="table-card rounded-[2.5rem] overflow-hidden">
                <div className="bg-slate-950/95 p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-100">#ORD-0{selectedOrder.id}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{selectedOrder.order_id}</p>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name</p>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] font-black text-slate-100">
                          {selectedOrder.customer_name?.charAt(0) || "C"}
                        </div>
                        <span className="font-bold text-slate-100">{selectedOrder.customer_name || "Guest"}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                      <a href={`tel:${selectedOrder.customer_phone}`} className="flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300 transition">
                        <Phone className="w-4 h-4" />
                        {selectedOrder.customer_phone || "N/A"}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h4>
                  <div className="bg-slate-950/90 rounded-2xl p-4 border border-white/10">
                    <p className="text-sm font-bold text-slate-100 mb-2">
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
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Order Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                      <p className="text-xl font-black text-emerald-400">₹{Number(selectedOrder.total_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Time</p>
                      <p className="font-bold text-slate-100 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {new Date(selectedOrder.ordered_at || selectedOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Delivery Progress</h4>
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
                            ? "bg-emerald-500 border-emerald-400 text-slate-950" 
                            : "bg-slate-900 border-white/10 text-slate-400"
                        }`}>
                          {item.completed ? "✓" : i + 1}
                        </div>
                        <span className={`font-bold ${item.completed ? "text-emerald-400" : "text-slate-400"}`}>
                          {item.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-sm p-12 text-center">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
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
