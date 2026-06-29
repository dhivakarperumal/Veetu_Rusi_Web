import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { io } from 'socket.io-client';
import { toast, Toaster } from 'react-hot-toast';
import api from '../api';
import ChefSidebar from "./ChefSidebar";
import ChefHeader from "./ChefHeader";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(
        window.innerWidth >= 1024
    );

    // Socket.IO and Polling - listen for new orders for this chef
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupOrder, setPopupOrder] = useState(null);
    const popupOrderRef = useRef(null);
    const displayedOrderIdsRef = useRef(new Set());
    const [calculatedDistance, setCalculatedDistance] = useState(null);

    const navigate = useNavigate();
    const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

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

    const fetchPendingOrders = async () => {
        try {
            const res = await api.get("/user-food-orders/chef");
            const allOrders = Array.isArray(res.data) ? res.data : [];
            const pendingOrders = allOrders.filter(order => order.status === 'New Order');

            if (popupOrderRef.current) {
                const stillPending = pendingOrders.some(order => Number(order.id) === Number(popupOrderRef.current.id));
                if (!stillPending) {
                    setPopupVisible(false);
                    setPopupOrder(null);
                    popupOrderRef.current = null;
                }
            }

            const nextOrder = pendingOrders.find(order => !displayedOrderIdsRef.current.has(Number(order.id)));
            if (nextOrder && !popupOrderRef.current) {
                displayedOrderIdsRef.current.add(Number(nextOrder.id));
                setPopupOrder(nextOrder);
                popupOrderRef.current = nextOrder;
                setPopupVisible(true);
                playNotificationSound();
            }
        } catch (error) {
            console.error("Failed to load pending chef orders:", error);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            const isLg = window.innerWidth >= 1024;
            setIsLargeScreen(isLg);
            if (isLg) setSidebarOpen(false);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        fetchPendingOrders();
        const interval = setInterval(fetchPendingOrders, 10000);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketBase = apiUrl.replace(/\/api\/?$/i, '') || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        const socket = io(socketBase, { 
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });
        
        socket.on('connect', () => {
            console.log('✅ Chef socket connected successfully');
        });

        socket.on('new_order', (payload) => {
            console.log('📦 New order received via socket:', payload);
            fetchPendingOrders();
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!popupOrder || popupOrder.distance_km) {
            if (popupOrder?.distance_km) setCalculatedDistance(popupOrder.distance_km);
            return;
        }

        setCalculatedDistance(null);

        const custLat = popupOrder.customer_lat ? parseFloat(popupOrder.customer_lat) : null;
        const custLng = popupOrder.customer_lng ? parseFloat(popupOrder.customer_lng) : null;
        const chefLat = popupOrder.chef_lat     ? parseFloat(popupOrder.chef_lat)     : null;
        const chefLng = popupOrder.chef_lng     ? parseFloat(popupOrder.chef_lng)     : null;

        // ── Priority 1: Both chef & customer coords in DB → instant calculation ──
        if (chefLat && chefLng && custLat && custLng) {
            setCalculatedDistance(calculateDistance(chefLat, chefLng, custLat, custLng));
            return;
        }

        // ── Priority 2: Customer coords in DB, get chef GPS live ──
        if (custLat && custLng && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, custLat, custLng);
                    setCalculatedDistance(dist || 'N/A');
                },
                () => setCalculatedDistance('N/A'),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
            return;
        }

        // ── Priority 3: No customer coords → geocode address progressively ──
        if (!navigator.geolocation) { setCalculatedDistance('N/A'); return; }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const fromLat = chefLat || pos.coords.latitude;
                const fromLng = chefLng || pos.coords.longitude;

                const { street_address, city, district, state, zip_code } = popupOrder;
                const queries = [];
                if (zip_code && state)       queries.push(`${zip_code}, ${state}, India`);
                if (city && state)           queries.push(`${city}, ${state}, India`);
                if (district && state)       queries.push(`${district}, ${state}, India`);
                if (zip_code)               queries.push(`${zip_code}, India`);
                if (street_address && city) queries.push(`${street_address}, ${city}, India`);

                for (const q of queries) {
                    try {
                        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`);
                        const data = await res.json();
                        if (data?.length > 0) {
                            const dist = calculateDistance(fromLat, fromLng, parseFloat(data[0].lat), parseFloat(data[0].lon));
                            setCalculatedDistance(dist || 'N/A');
                            return;
                        }
                    } catch (e) { console.warn('Geocoding failed:', q, e); }
                }
                setCalculatedDistance('N/A');
            },
            () => setCalculatedDistance('N/A'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [popupOrder]);


    const handleAccept = async () => {
        if (!popupOrder) return;
        try {
            await api.patch(`/user-food-orders/status/${popupOrder.id}`, { status: 'Accepted' });
            toast.success('Order accepted');
            setPopupVisible(false);
            setPopupOrder(null);
            popupOrderRef.current = null;
        } catch (err) {
            console.error(err);
            toast.error('Failed to accept order');
        }
    };

    const handleReject = async () => {
        if (!popupOrder) return;
        try {
            await api.patch(`/user-food-orders/status/${popupOrder.id}`, { status: 'Cancelled' });
            toast.success('Order rejected');
            setPopupVisible(false);
            setPopupOrder(null);
            popupOrderRef.current = null;
        } catch (err) {
            console.error(err);
            toast.error('Failed to reject order');
        }
    };

    const skipOrder = () => {
        setPopupVisible(false);
        setPopupOrder(null);
        popupOrderRef.current = null;
    };

    return (
        <div className="admin-root homechef-root flex min-h-screen bg-[#0b0d10] text-slate-200 font-sans">
            <ChefSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div
                className={`
          flex flex-col flex-1 min-w-0 min-h-screen
          transition-all duration-300 ease-in-out
          ${isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""}
        `}
            >
                <ChefHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
                    <div className="glass-container">
                        <Outlet />
                    </div>
                </main>

                {popupVisible && popupOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                            <div className="absolute inset-0 bg-black/70" aria-hidden="true" onClick={skipOrder}></div>
                            <div className="relative z-10 w-full max-w-2xl rounded-4xl bg-[#0f1418] shadow-2xl ring-1 ring-slate-900/10 overflow-hidden max-h-[90vh] flex flex-col text-slate-200">
                            <div className="p-6 sm:p-8 overflow-y-auto">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">🧑‍🍳 New Order Available</p>
                                            <h2 className="mt-4 text-2xl font-black text-white">A new food order is available.</h2>
                                            <p className="mt-2 text-sm text-slate-300">Would you like to accept this order?</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={skipOrder}
                                            className="self-start rounded-full bg-[#0b0d10] p-3 text-slate-300 hover:bg-slate-900/40 transition"
                                            aria-label="Close popup"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-800 bg-[#0b0d10] p-5">
                                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order ID</p>
                                        <p className="mt-2 text-lg font-bold text-white">{popupOrder.order_id || `#${popupOrder.id}`}</p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-800 bg-[#0b0d10] p-5">
                                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Amount</p>
                                        <p className="mt-2 text-lg font-bold text-white">{formatCurrency(popupOrder.chef_total_amount ?? popupOrder.total_amount ?? 0)}</p>
                                    </div>
                                    <div className="sm:col-span-2 rounded-3xl border border-slate-800 bg-[#0b0d10] p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">User Details</p>
                                                <p className="mt-2 text-lg font-bold text-white">{popupOrder.customer_name || popupOrder.ordered_by_name || 'Unknown'}</p>
                                                <p className="mt-2 text-sm text-slate-300">📞 {popupOrder.customer_phone || popupOrder.customer_email || 'No contact details'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Distance</p>
                                                {popupOrder.distance_km ? (
                                                    <p className="mt-2 text-lg font-bold text-amber-400">{popupOrder.distance_km} KM</p>
                                                ) : calculatedDistance === null ? (
                                                    <p className="mt-2 text-sm font-semibold text-slate-400 animate-pulse">Calculating…</p>
                                                ) : calculatedDistance === 'N/A' ? (
                                                    <p className="mt-2 text-sm font-semibold text-slate-500">N/A</p>
                                                ) : (
                                                    <p className="mt-2 text-lg font-bold text-amber-400">{calculatedDistance} KM</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-800/50">
                                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Delivery Address</p>
                                            <p className="mt-2 text-sm text-slate-300 leading-6">
                                                📍 {[popupOrder.street_address, popupOrder.city, popupOrder.district, popupOrder.state, popupOrder.zip_code]
                                                    .filter(Boolean)
                                                    .join(", ") || 'Not available'}
                                            </p>
                                        </div>
                                    </div>

                                        <div className="sm:col-span-2 rounded-3xl border border-slate-800 bg-[#0b0d10] p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Items in Order</p>
                                            <p className="text-xs font-bold text-slate-500">{(popupOrder.items || []).length} items</p>
                                        </div>
                                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                            {(popupOrder.items || []).map((item, idx) => (
                                                <div key={idx} className="rounded-2xl bg-[#0b0d10] p-3 border border-slate-800 flex items-center justify-between text-slate-200">
                                                    <div>
                                                        <p className="font-bold text-white">{item.name || item.title || item.product_name || 'Item'}</p>
                                                        <p className="text-xs font-medium text-slate-400 mt-1">Qty: {item.quantity || item.qty || 1}</p>
                                                    </div>
                                                    <p className="font-bold text-white">{formatCurrency(item.price || item.final_price || item.amount)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="sm:col-span-2 rounded-3xl border border-slate-800 bg-[#0b0d10] p-5 text-slate-200">
                                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order Time</p>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {new Date(popupOrder.ordered_at || popupOrder.created_at || Date.now()).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleReject}
                                        className="inline-flex justify-center rounded-2xl border border-red-700/30 bg-transparent px-5 py-3 text-sm font-bold text-red-400 hover:bg-red-900/10 transition"
                                    >
                                        Reject Order
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAccept}
                                        className="inline-flex justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition"
                                    >
                                        Accept Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <footer className="glass-footer text-center py-4 mt-10 text-sm text-white/70">
                    © {new Date().getFullYear()} Q-Techx Solutions. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
