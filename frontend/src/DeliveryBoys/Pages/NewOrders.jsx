import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
  FiSearch, FiMapPin, FiPhone, FiRefreshCw,
  FiPackage, FiEye, FiCheck, FiX, FiGrid, FiList, FiNavigation
} from "react-icons/fi";

const fmt = (n) =>
  `₹${parseFloat(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const statusStyle = () => "bg-amber-950 text-amber-300 border-amber-800";

/* ─── Location Modal ─────────────────────────────────────────────────── */
const LocationModal = ({ order, onClose, onSaved }) => {
  const [locationData, setLocationData] = useState({
    latitude: "", longitude: "", pincode: "", area: "", district: ""
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.address) {
            setLocationData({
              latitude,
              longitude,
              pincode: data.address.postcode || "",
              area: data.address.suburb || data.address.neighbourhood || data.address.village || data.address.town || data.address.city || "",
              district: data.address.state_district || data.address.county || data.address.city_district || ""
            });
            toast.success("Location fetched successfully!");
          } else {
            setLocationData((prev) => ({ ...prev, latitude, longitude }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          toast.error("Failed to fetch address details. Using coordinates only.");
          setLocationData((prev) => ({ ...prev, latitude, longitude }));
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        toast.error("Unable to retrieve your location");
        setFetchingLocation(false);
      }
    );
  };

  useEffect(() => {
    fetchCurrentLocation();
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const confirmAcceptOrder = async () => {
    setAssigning(true);
    try {
      await api.patch(`/delivery/orders/${order.id}/assign`, locationData);
      toast.success("Order assigned successfully.");
      onSaved();
      onClose();
    } catch (error) {
      console.error("Assign order failed:", error);
      const message = error.response?.data?.message || "This order has already been assigned.";
      toast.error(message);
      onSaved(); // maybe refresh list because it's taken
      onClose();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm flex flex-col rounded-[2rem] border border-white/10 bg-[#0c1018] shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-900 to-slate-900 rounded-t-[2rem] px-6 py-5 relative">
          <button type="button" onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition">
            <FiX size={15} />
          </button>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Assignment</p>
          <h3 className="text-lg font-black text-white italic">Accept Order</h3>
          <p className="text-[11px] text-blue-300/70 font-bold mt-0.5">{order.order_id || `#${order.id}`}</p>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Please share your current location to accept this order and update live tracking.
            </p>

            {fetchingLocation ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-white/5 rounded-2xl">
                <FiNavigation className="text-blue-500 animate-pulse mb-3" size={24} />
                <span className="font-bold text-xs text-slate-300">Fetching GPS & Address...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Coordinates</label>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 text-slate-200 text-xs font-bold">
                    {locationData.latitude ? `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}` : 'Not fetched'}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Pincode</label>
                  <input type="text" value={locationData.pincode} readOnly className="w-full p-3 bg-slate-900 rounded-xl border border-white/5 text-slate-200 text-xs font-bold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Area</label>
                  <input type="text" value={locationData.area} readOnly className="w-full p-3 bg-slate-900 rounded-xl border border-white/5 text-slate-200 text-xs font-bold focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">District</label>
                  <input type="text" value={locationData.district} readOnly className="w-full p-3 bg-slate-900 rounded-xl border border-white/5 text-slate-200 text-xs font-bold focus:outline-none" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 border-t border-white/5 bg-[#0c1018] rounded-b-[2rem] flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={fetchCurrentLocation} disabled={fetchingLocation}
              className="flex-1 rounded-2xl border border-white/10 bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition disabled:opacity-50">
              Retry GPS
            </button>
            <button type="button" onClick={confirmAcceptOrder}
              disabled={assigning || fetchingLocation}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-[10px] font-black uppercase tracking-widest text-white transition shadow-lg shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed">
              <FiCheck size={12} />
              {assigning ? "Assigning…" : "Accept Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────── */
const NewOrders = () => {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [viewMode, setViewMode]         = useState("table"); // "card" | "table"
  const [acceptingOrder, setAcceptingOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders/available");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to fetch new orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    // Exclude orders that are already assigned to a delivery partner
    if (o.delivery_boy_id) return false;
    if (["Delivery Partner Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"].includes(o.status)) {
        return false;
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [o.order_id, o.customer_name, o.customer_phone, String(o.id)]
      .filter(Boolean).some((v) => v.toLowerCase().includes(q));
  });

  const metrics = [
    { label: "Total Available",  value: orders.length, color: "blue" },
  ];

  /* ── Empty / Loading ── */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4 rounded-[2rem] border border-white/10 bg-slate-950/95">
      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center">
        <FiPackage size={32} className="text-slate-600" />
      </div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">No new orders available</p>
      <p className="text-xs text-slate-700">Check back later for new delivery assignments.</p>
    </div>
  );

  /* ── Card View ── */
  const CardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {filtered.map((order) => {
        const address = [order.street_address, order.city, order.district, order.state, order.zip_code]
          .filter(Boolean).join(", ");
        return (
          <div key={order.id}
            className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden hover:border-blue-500/20 transition-colors">

            {/* Card Top */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div className="min-w-0">
                <p className="text-white font-black text-sm truncate">{order.order_id || `#${order.id}`}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                  {order.ordered_at || order.created_at
                    ? new Date(order.ordered_at || order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusStyle()}`}>
                Pending
              </span>
            </div>

            {/* Card Body */}
            <div className="px-6 py-4 space-y-3">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-slate-300 shrink-0">
                  {(order.customer_name || order.ordered_by_name || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{order.customer_name || order.ordered_by_name || "Customer"}</p>
                  {order.customer_phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <FiPhone size={10} className="text-slate-500" />
                      <p className="text-[11px] text-slate-500 font-semibold">{order.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {address && (
                <div className="flex items-start gap-2 rounded-2xl bg-slate-900/60 border border-white/5 px-4 py-3">
                  <FiMapPin size={13} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-slate-300 text-xs font-semibold leading-relaxed">{address}</p>
                </div>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between">
                <p className="text-white font-black text-base">{fmt(order.total_amount)}</p>
                <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 bg-slate-900 text-slate-400">
                  {order.payment_method || "COD"}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setAcceptingOrder(order)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/20">
                <FiCheck size={13} /> Accept Order
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── Table View ── */
  const TableView = () => (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/70">
              {["#", "Order ID / Date", "Customer", "Address", "Amount", "Status", "Actions"].map((h) => (
                <th key={h}
                  className={`px-5 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap
                    ${h === "Actions" ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((order, idx) => {
              const address = [order.street_address, order.city, order.district, order.state]
                .filter(Boolean).join(", ");
              return (
                <tr key={order.id} className="hover:bg-white/[0.025] transition-colors">
                  {/* # */}
                  <td className="px-5 py-4 text-slate-600 font-black text-sm">{idx + 1}</td>

                  {/* Order ID */}
                  <td className="px-5 py-4">
                    <p className="font-black text-white text-xs">{order.order_id || `#${order.id}`}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {order.ordered_at || order.created_at
                        ? new Date(order.ordered_at || order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                        {(order.customer_name || order.ordered_by_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{order.customer_name || order.ordered_by_name || "—"}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">{order.customer_phone || ""}</p>
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-5 py-4 max-w-[200px]">
                    <div className="flex items-start gap-1.5">
                      <FiMapPin size={11} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{address || "—"}</p>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4">
                    <p className="text-white font-black text-sm">{fmt(order.total_amount)}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{order.payment_method || "COD"}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusStyle()}`}>
                      Pending
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button onClick={() => setAcceptingOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider transition"
                        title="Accept Order">
                        <FiCheck size={11} /> Accept
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="border-t border-white/10 bg-slate-950/80 px-6 py-3">
        <p className="text-xs text-slate-600 font-semibold">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      <Toaster position="top-right" />

      {acceptingOrder && (
        <LocationModal
          order={acceptingOrder}
          onClose={() => setAcceptingOrder(null)}
          onSaved={fetchOrders}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_40%)]" />
        <div className="relative">
          {/* Header Title Area */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-400">
              Delivery Partner · Opportunities
            </p>
            <h1 className="mt-3 text-4xl font-black text-white tracking-tight">New Orders</h1>
            <p className="mt-2 text-sm text-slate-400">Available pending delivery orders waiting for assignment.</p>
          </div>

          {/* Header Controls Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-6">
            {/* Search (Left Side) */}
            <div className="relative w-full sm:w-auto">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-full sm:w-72 rounded-full border border-white/10 bg-slate-900 pl-10 pr-4 py-3 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:border-blue-500 outline-none" />
            </div>

            {/* Other Actions (Right Side) */}
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center rounded-full border border-white/10 bg-slate-900 p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition
                    ${viewMode === "card" ? "bg-emerald-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}
                  title="Card View"
                >
                  <FiGrid size={13} /> Card
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition
                    ${viewMode === "table" ? "bg-emerald-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}
                  title="Table View"
                >
                  <FiList size={13} /> Table
                </button>
              </div>

              {/* Refresh */}
              <button onClick={fetchOrders} disabled={loading}
                className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 h-[42px]">
                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-xl">
            <span className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-20 blur-3xl bg-${m.color}-500`} />
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 mb-2">{m.label}</p>
            <p className={`text-3xl font-black text-${m.color}-400`}>{loading ? "—" : m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5 rounded-[2rem] border border-white/10 bg-slate-950/95">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading orders…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : viewMode === "card" ? (
        <CardView />
      ) : (
        <TableView />
      )}
    </div>
  );
};

export default NewOrders;
