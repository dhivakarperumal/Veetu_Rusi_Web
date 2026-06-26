import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiSearch, FiTruck, FiClock, FiMapPin, FiUser, FiDollarSign } from "react-icons/fi";

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    pincode: "",
    area: "",
    district: ""
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/delivery/orders/available");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load available delivery orders:", error);
      toast.error("Unable to fetch new orders.");
    } finally {
      setLoading(false);
    }
  };

  const openLocationModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowLocationModal(true);
    fetchCurrentLocation();
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
    setSelectedOrderId(null);
    setLocationData({ latitude: "", longitude: "", pincode: "", area: "", district: "" });
  };

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

  const confirmAcceptOrder = async () => {
    if (!selectedOrderId) return;
    setAssigningId(selectedOrderId);
    try {
      await api.patch(`/delivery/orders/${selectedOrderId}/assign`, locationData);
      toast.success("Order assigned successfully.");
      closeLocationModal();
      await fetchOrders();
    } catch (error) {
      console.error("Assign order failed:", error);
      const message = error.response?.data?.message || "This order has already been assigned.";
      toast.error(message);
      closeLocationModal();
      await fetchOrders();
    } finally {
      setAssigningId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visibleOrders = orders.filter((order) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return [
      order.order_id,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.street_address,
      order.city,
      order.district,
      order.state,
      String(order.id),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">New Orders</h1>
          <p className="text-sm text-slate-500 mt-2">Available pending delivery orders waiting for assignment.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders, customer, address..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Total Available</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Visible</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{visibleOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Orders ready to accept</p>
          <p className="mt-4 text-4xl font-black text-slate-900">{loading ? '-' : visibleOrders.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Pending Delivery Orders</h2>
            <p className="text-sm text-slate-500 mt-1">Accept one to move it into your active deliveries.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading available orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pending orders are available right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-[0.24em]">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Order Time</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.order_id || `#${order.id}`}</div>
                      <div className="mt-1 text-xs text-slate-500">Status: Pending</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-slate-400" />
                        <span>{order.customer_name || order.ordered_by_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-1 text-slate-400" />
                        <span>{[order.street_address, order.city, order.district, order.state, order.zip_code].filter(Boolean).join(', ') || 'Address unavailable'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{Number(order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.ordered_at || order.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openLocationModal(order.id)}
                        disabled={assigningId === order.id}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigningId === order.id ? 'Assigning...' : 'Accept'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-900">Confirm Assignment</h3>
              <button onClick={closeLocationModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Please share your current location to accept this order and update live tracking.
            </p>

            <div className="space-y-4">
              {fetchingLocation ? (
                <div className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-xl">
                  <span className="font-semibold text-sm">Fetching GPS & Address...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coordinates</label>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
                      {locationData.latitude ? `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}` : 'Not fetched'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                    <input type="text" value={locationData.pincode} readOnly className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Area</label>
                    <input type="text" value={locationData.area} readOnly className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">District</label>
                    <input type="text" value={locationData.district} readOnly className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 focus:outline-none" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  disabled={fetchingLocation}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  Retry GPS
                </button>
                <button
                  type="button"
                  onClick={confirmAcceptOrder}
                  disabled={assigningId === selectedOrderId || fetchingLocation}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assigningId === selectedOrderId ? 'Assigning...' : 'Accept Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrders;
