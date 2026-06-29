import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./DeliverySidebar";
import Header from "./DeliveryHeader";
import { useAuth } from "../PrivateRouter/AuthContext.jsx";
import api from "../api";
import { toast, Toaster } from "react-hot-toast";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(
        window.innerWidth >= 1024
    );
    const [popupOrder, setPopupOrder] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isFetchingPopupOrder, setIsFetchingPopupOrder] = useState(false);
    const displayedOrderIdsRef = useRef(new Set());
    const { user } = useAuth();
    const navigate = useNavigate();
    const deliveryBoyId = user?.id || user?.user_id || user?.delivery_partner_user_id || user?.delivery_partner || null;

    const [locationData, setLocationData] = useState({
        latitude: "",
        longitude: "",
        pincode: "",
        area: "",
        district: ""
    });
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Online & Location Tracking State
    const [isOnline, setIsOnline] = useState(() => localStorage.getItem("delivery_isOnline") === "true");
    const [lastOnline, setLastOnline] = useState(() => localStorage.getItem("delivery_lastOnline") || "Never");
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (isOnline) {
            localStorage.setItem("delivery_isOnline", "true");
            if (navigator.geolocation) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        // Mock sending background ping
                        console.log(`[Auto Location Update] Lat: ${latitude}, Lng: ${longitude} at ${new Date().toLocaleTimeString()}`);
                        setLocationData(prev => ({ ...prev, latitude, longitude }));
                    },
                    (error) => {
                        console.error("Background Location tracking error:", error);
                        if (error.code === 1) {
                            setIsOnline(false);
                            toast.error("Please allow location access to go online.");
                        }
                    },
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
                );
            }
        } else {
            localStorage.setItem("delivery_isOnline", "false");
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem("delivery_lastOnline", now);
            setLastOnline(now);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [isOnline]);

    const toggleOnlineStatus = () => setIsOnline(prev => !prev);

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 540;
            gain.gain.value = 0.05;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.18);
            setTimeout(() => {
                if (ctx.state !== 'closed') ctx.close();
            }, 200);
        } catch (e) {
            console.warn('Notification sound unavailable', e);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(1);
    };

    const fetchPendingOrders = async () => {
        try {
            setIsFetchingPopupOrder(true);
            const res = await api.get("/delivery/orders/available");
            const available = Array.isArray(res.data) ? res.data : [];
            const searchingOrders = available.filter(order => order.status === 'Searching Delivery Partner');

            if (popupOrder) {
                const stillPending = searchingOrders.some(order => Number(order.id) === Number(popupOrder.id));
                if (!stillPending) {
                    setShowPopup(false);
                    setShowLocationModal(false);
                    setPopupOrder(null);
                    toast.error("This order has already been assigned.");
                }
                return;
            }

            const nextOrder = searchingOrders.find(order => !displayedOrderIdsRef.current.has(Number(order.id)));
            if (nextOrder) {
                displayedOrderIdsRef.current.add(Number(nextOrder.id));
                setPopupOrder(nextOrder);
                setShowPopup(true);
                playNotificationSound();
            }
        } catch (error) {
            console.error("Failed to load pending delivery orders:", error);
        } finally {
            setIsFetchingPopupOrder(false);
        }
    };

    const openLocationModal = () => {
        setShowPopup(false);
        setShowLocationModal(true);
        fetchCurrentLocation();
    };

    const closeLocationModal = () => {
        setShowLocationModal(false);
        setPopupOrder(null);
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
        if (!popupOrder) return;
        setIsAssigning(true);
        try {
            await api.patch(`/delivery/orders/${popupOrder.id}/assign`, {
                delivery_partner: deliveryBoyId,
                status: "Assigned",
                ...locationData
            });
            toast.success("Order assigned successfully.");
            closeLocationModal();
            navigate("/delivery/orders");
        } catch (error) {
            console.error("Assign order failed:", error);
            const message = error.response?.data?.message || "This order has already been assigned.";
            toast.error(message);
            closeLocationModal();
        } finally {
            setIsAssigning(false);
        }
    };

    const skipOrder = () => {
        setShowPopup(false);
        setPopupOrder(null);
    };

    useEffect(() => {
        fetchPendingOrders();
        const interval = setInterval(fetchPendingOrders, 9000);
        return () => clearInterval(interval);
    }, [popupOrder, deliveryBoyId]);

    return (
        <div className="admin-root flex min-h-screen bg-[#040b0a] text-slate-100">
            <Toaster position="top-right" />

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content */}
            <div
                className={`
          flex flex-col flex-1 min-w-0 min-h-screen
          transition-all duration-300 ease-in-out
          ${isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""}
        `}
            >
                {/* Header */}
                <Header 
                    onMenuClick={() => setSidebarOpen(true)} 
                    isOnline={isOnline} 
                    lastOnline={lastOnline} 
                    toggleOnlineStatus={toggleOnlineStatus}
                />

                {/* Page Content */}
                <main className="relative flex-1 overflow-y-auto bg-gradient-to-b from-[#020806] via-[#06110f] to-[#040a08] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                    <div className="glass-container">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="glass-footer text-center py-4 mt-10 text-sm text-white/70">
                    © {new Date().getFullYear()} Q-Techx Solutions. All rights reserved.
                </footer>

            </div>

            {showPopup && popupOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
                    <div className="absolute inset-0 bg-black/70" aria-hidden="true"></div>
                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl bg-slate-950/95 shadow-2xl ring-1 ring-white/10 border border-white/10">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">🚚 New Order Available</p>
                                    <h2 className="mt-4 text-2xl font-black text-white">A new delivery order is available.</h2>
                                    <p className="mt-2 text-sm text-slate-400">Would you like to pick this order?</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={skipOrder}
                                    className="self-start rounded-full bg-slate-100 p-3 text-slate-700 hover:bg-slate-200 transition"
                                    aria-label="Close popup"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order ID</p>
                                    <p className="mt-2 text-lg font-bold text-white">{popupOrder.order_id || `#${popupOrder.id}`}</p>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Amount</p>
                                    <p className="mt-2 text-lg font-bold text-white">₹{popupOrder.total_amount?.toFixed?.(2) ?? popupOrder.total_amount ?? 0}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-400">Home Chef Details</p>
                                    <p className="mt-2 text-lg font-bold text-white">{popupOrder.home_chef_name || popupOrder.chef_name || 'Chef Name Not Available'}</p>
                                    <p className="mt-2 text-sm text-slate-400">📞 {popupOrder.home_chef_phone || popupOrder.chef_phone || 'Phone Not Available'}</p>
                                    <p className="mt-2 text-sm text-slate-300 leading-6">📍 {popupOrder.home_chef_address || 'Address Not Available'}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">User Details</p>
                                            <p className="mt-2 text-lg font-bold text-white">{popupOrder.customer_name || popupOrder.ordered_by_name || 'Unknown'}</p>
                                            <p className="mt-2 text-sm text-slate-400">📞 {popupOrder.customer_phone || popupOrder.customer_email || 'No contact details'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Distance</p>
                                            <p className="mt-2 text-lg font-bold text-amber-400">
                                                {popupOrder.distance_km 
                                                    ? `${popupOrder.distance_km} KM` 
                                                    : locationData.latitude && popupOrder.home_chef_lat 
                                                        ? `${calculateDistance(locationData.latitude, locationData.longitude, popupOrder.home_chef_lat, popupOrder.home_chef_lng)} KM`
                                                        : 'N/A KM'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Delivery Address</p>
                                    <p className="mt-2 text-sm text-slate-300 leading-6">
                                        📍 {[popupOrder.street_address, popupOrder.city, popupOrder.district, popupOrder.state, popupOrder.zip_code]
                                            .filter(Boolean)
                                            .join(", ") || 'Not available'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order Time</p>
                                    <p className="mt-2 text-sm text-slate-300">
                                        ⏱ {new Date(popupOrder.ordered_at || popupOrder.created_at || popupOrder.delivery_date || Date.now()).toLocaleString()}
                                    </p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order Items & Details</p>
                                    <div className="mt-3 space-y-2">
                                        {(() => {
                                            let items = [];
                                            try {
                                                items = typeof popupOrder.items === 'string' ? JSON.parse(popupOrder.items) : popupOrder.items || [];
                                            } catch (e) {
                                                items = [];
                                            }
                                            if (!items || items.length === 0) return <p className="text-sm text-slate-400 italic">Item details not available</p>;
                                            
                                            return items.map((item, idx) => {
                                                const imageUrl = item.image || item.image_url || item.product_image || item.food_image || 'https://ui-avatars.com/api/?name=Food&background=10B981&color=fff';
                                                
                                                return (
                                                <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden border border-white/10">
                                                            <img 
                                                                src={imageUrl} 
                                                                alt={item.name || 'Item'} 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Food&background=10B981&color=fff'; }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{item.name || item.product_name || 'Item'}</p>
                                                            {(item.weight || item.unit || item.size) && (
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    {item.weight || ''} {item.unit || item.size || ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-emerald-400">Qty: {item.quantity || 1}</p>
                                                    </div>
                                                </div>
                                            )});
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={skipOrder}
                                    className="inline-flex justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20 transition"
                                >
                                    Skip Order
                                </button>
                                <button
                                    type="button"
                                    onClick={openLocationModal}
                                    className="inline-flex justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition"
                                >
                                    Accept Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Modal */}
            {showLocationModal && popupOrder && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
                                    disabled={isAssigning || fetchingLocation}
                                    className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isAssigning ? 'Assigning...' : 'Accept Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminLayout;
