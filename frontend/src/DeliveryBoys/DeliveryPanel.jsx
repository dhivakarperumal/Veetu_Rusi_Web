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
            setIsFetchingPopupOrder(true);
            const res = await api.get("/delivery/orders/available");
            const available = Array.isArray(res.data) ? res.data : [];

            if (popupOrder) {
                const stillPending = available.some(order => Number(order.id) === Number(popupOrder.id));
                if (!stillPending) {
                    setShowPopup(false);
                    setPopupOrder(null);
                    toast.error("This order has already been assigned.");
                }
                return;
            }

            const nextOrder = available.find(order => !displayedOrderIdsRef.current.has(Number(order.id)));
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

    const acceptOrder = async () => {
        if (!popupOrder) return;
        setIsAssigning(true);
        try {
            await api.patch(`/delivery/orders/${popupOrder.id}/assign`, {
                delivery_partner: deliveryBoyId,
                status: "Assigned",
            });
            toast.success("Order assigned successfully.");
            setShowPopup(false);
            setPopupOrder(null);
            navigate("/delivery/orders");
        } catch (error) {
            console.error("Assign order failed:", error);
            const message = error.response?.data?.message || "This order has already been assigned.";
            toast.error(message);
            setShowPopup(false);
            setPopupOrder(null);
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
        <div className="admin-root flex min-h-screen bg-gray-50 text-slate-900">
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
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                    <div className="absolute inset-0 bg-black/70" aria-hidden="true"></div>
                    <div className="relative z-10 w-full max-w-2xl rounded-4xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">🚚 New Order Available</p>
                                    <h2 className="mt-4 text-2xl font-black text-slate-900">A new delivery order is available.</h2>
                                    <p className="mt-2 text-sm text-slate-500">Would you like to pick this order?</p>
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
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order ID</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900">{popupOrder.order_id || `#${popupOrder.id}`}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Amount</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900">₹{popupOrder.total_amount?.toFixed?.(2) ?? popupOrder.total_amount ?? 0}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Customer</p>
                                    <p className="mt-2 text-lg font-bold text-slate-900">{popupOrder.customer_name || popupOrder.ordered_by_name || 'Unknown'}</p>
                                    <p className="mt-2 text-sm text-slate-500">{popupOrder.customer_phone || popupOrder.customer_email || 'No contact details'}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Delivery Address</p>
                                    <p className="mt-2 text-sm text-slate-700 leading-6">
                                        {[popupOrder.street_address, popupOrder.city, popupOrder.district, popupOrder.state, popupOrder.zip_code]
                                            .filter(Boolean)
                                            .join(", ") || 'Not available'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Order Time</p>
                                    <p className="mt-2 text-sm text-slate-700">
                                        {new Date(popupOrder.ordered_at || popupOrder.created_at || popupOrder.delivery_date || Date.now()).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={skipOrder}
                                    className="inline-flex justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100 transition"
                                >
                                    Skip Order
                                </button>
                                <button
                                    type="button"
                                    onClick={acceptOrder}
                                    disabled={isAssigning}
                                    className="inline-flex justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition disabled:cursor-not-allowed disabled:opacity-60"
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
