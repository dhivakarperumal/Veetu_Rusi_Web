import React, { useState, useEffect } from "react";
import {
    Settings as SettingsIcon,
    Globe,
    Bell,
    Shield,
    Users,
    Check,
    DollarSign,
    Gift,
    AlertCircle,
    X,
    CreditCard
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";

const Settings = () => {
    const [activeModal, setActiveModal] = useState(null);
    const [settings, setSettings] = useState({
        base_pickup_charge: 20,
        base_delivery_charge: 15,
        per_km_charge: 5,
        minimum_charge: 30,
        waiting_time_charge_per_min: 2,
        free_waiting_time_mins: 5,
        return_delivery_charge: 10,
        toll_charges: 0,
        platform_commission_percent: 10,
        gst_tax_percent: 18,
        
        cod_bonus: 5,
        night_delivery_bonus: 15,
        peak_hour_bonus: 10,
        rain_weather_bonus: 20,
        festival_bonus: 25,
        heavy_parcel_charge: 10,
        multi_order_bonus: 5,
        ev_vehicle_bonus: 10,
        
        daily_incentive_target_orders: 15,
        daily_incentive_reward: 100,
        
        order_cancellation_penalty: 20,
        late_delivery_penalty: 15,
        customer_complaint_penalty: 50,
        // Receipt settings
        receipt_enabled: true,
        receipt_header: '',
        receipt_footer: '',
        receipt_logo: '',
        receipt_show_item_sku: false,
        receipt_printer_name: '',
        upi_enabled: false,
        upi_id: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings/delivery-partner');
            if (res.data.success && res.data.data && Object.keys(res.data.data).length > 0) {
                setSettings(prev => ({ ...prev, ...res.data.data }));
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.post('/settings/delivery-partner', settings);
            if (res.data.success) {
                toast.success("Settings saved successfully!");
                setActiveModal(null);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let val;
        if (type === 'checkbox') val = checked;
        else if (type === 'number') val = parseFloat(value) || 0;
        else val = value;
        setSettings(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const tabs = [
        { id: "earnings", label: "Delivery Partner Earnings", icon: <DollarSign size={20} />, description: "Base charges, per km, wait times" },
        { id: "bonuses", label: "Incentives & Bonuses", icon: <Gift size={20} />, description: "Peak hour, rain, festival bonuses" },
        { id: "penalties", label: "Penalties & Deductions", icon: <AlertCircle size={20} />, description: "Cancellations, late deliveries" },
        { id: "general", label: "General System Settings", icon: <SettingsIcon size={20} />, description: "Store name, maintenance mode" },
        { id: "notifications", label: "Notifications", icon: <Bell size={20} />, description: "SMS & Push configurations" },
        { id: "security", label: "Security & Access", icon: <Shield size={20} />, description: "Roles and permissions" },
        { id: "regional", label: "Regional & Language", icon: <Globe size={20} />, description: "Timezone and languages" },
        { id: "payments", label: "Payment Gateways", icon: <CreditCard size={20} />, description: "UPI, Cards configuration" },
        { id: "receipt", label: "Receipt Settings", icon: <CreditCard size={20} />, description: "Print/email receipt header/footer and options" },
    ];

    /* ── MODALS ── */
    const renderModalContent = () => {
        switch (activeModal) {
            case "earnings":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "Base Pickup Charge (₹)", name: "base_pickup_charge" },
                            { label: "Base Delivery Charge (₹)", name: "base_delivery_charge" },
                            { label: "Per KM Charge (₹)", name: "per_km_charge" },
                            { label: "Minimum Charge (₹)", name: "minimum_charge" },
                            { label: "Waiting Time Charge (/min) (₹)", name: "waiting_time_charge_per_min" },
                            { label: "Free Waiting Time (mins)", name: "free_waiting_time_mins" },
                            { label: "Return Delivery Charge (₹)", name: "return_delivery_charge" },
                            { label: "Toll Charges (₹)", name: "toll_charges" },
                            { label: "Platform Commission (%)", name: "platform_commission_percent" },
                            { label: "GST/Tax (%)", name: "gst_tax_percent" }
                        ].map(field => (
                            <div key={field.name} className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400">{field.label}</label>
                                <input type="number" name={field.name} value={settings[field.name]} onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-500/50 transition" />
                            </div>
                        ))}
                    </div>
                );
            case "bonuses":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "COD Bonus (₹)", name: "cod_bonus" },
                            { label: "Night Delivery Bonus (₹)", name: "night_delivery_bonus" },
                            { label: "Peak Hour Bonus (₹)", name: "peak_hour_bonus" },
                            { label: "Rain/Weather Bonus (₹)", name: "rain_weather_bonus" },
                            { label: "Festival Bonus (₹)", name: "festival_bonus" },
                            { label: "Heavy Parcel Charge (₹)", name: "heavy_parcel_charge" },
                            { label: "Multi Order Bonus (₹)", name: "multi_order_bonus" },
                            { label: "EV Vehicle Bonus (₹)", name: "ev_vehicle_bonus" },
                            { label: "Daily Target (Orders)", name: "daily_incentive_target_orders" },
                            { label: "Daily Target Reward (₹)", name: "daily_incentive_reward" }
                        ].map(field => (
                            <div key={field.name} className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400">{field.label}</label>
                                <input type="number" name={field.name} value={settings[field.name]} onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-500/50 transition" />
                            </div>
                        ))}
                    </div>
                );
            case "penalties":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "Order Cancellation Penalty (₹)", name: "order_cancellation_penalty" },
                            { label: "Late Delivery Penalty (₹)", name: "late_delivery_penalty" },
                            { label: "Customer Complaint Penalty (₹)", name: "customer_complaint_penalty" }
                        ].map(field => (
                            <div key={field.name} className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400">{field.label}</label>
                                <input type="number" name={field.name} value={settings[field.name]} onChange={handleChange}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-500/50 transition" />
                            </div>
                        ))}
                    </div>
                );
            case "general":
            case "notifications":
            case "security":
            case "regional":
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <SettingsIcon size={48} className="mb-4 opacity-20" />
                        <p>This settings module is currently under development.</p>
                    </div>
                );
            case "payments":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#08120f]/50">
                            <div>
                                <p className="text-sm font-bold text-white">Enable UPI Payments</p>
                                <p className="text-xs text-slate-400">Show UPI QR code on receipts</p>
                            </div>
                            <input type="checkbox" name="upi_enabled" checked={!!settings.upi_enabled} onChange={handleChange} className="h-5 w-8" />
                        </div>
                        
                        {settings.upi_enabled && (
                            <div className="space-y-2 p-4 rounded-2xl border border-white/10 bg-white/5">
                                <label className="text-xs font-semibold text-slate-400">Merchant UPI ID</label>
                                <input 
                                    type="text" 
                                    name="upi_id" 
                                    placeholder="e.g. merchant@upi"
                                    value={settings.upi_id || ''} 
                                    onChange={handleChange} 
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition" 
                                />
                                <p className="text-[10px] text-slate-500">This UPI ID will be used to generate the payment QR code.</p>
                            </div>
                        )}
                    </div>
                );
            case "receipt":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#08120f]/50">
                            <div>
                                <p className="text-sm font-bold text-white">Enable Receipts</p>
                                <p className="text-xs text-slate-400">Toggle printing/emailing of receipts</p>
                            </div>
                            <input type="checkbox" name="receipt_enabled" checked={!!settings.receipt_enabled} onChange={handleChange} className="h-5 w-8" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400">Receipt Header</label>
                            <input type="text" name="receipt_header" value={settings.receipt_header || ''} onChange={handleChange} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400">Receipt Footer</label>
                            <textarea name="receipt_footer" value={settings.receipt_footer || ''} onChange={handleChange} rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400">Receipt Logo URL</label>
                                <input type="text" name="receipt_logo" value={settings.receipt_logo || ''} onChange={handleChange} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400">Printer Name (optional)</label>
                                <input type="text" name="receipt_printer_name" value={settings.receipt_printer_name || ''} onChange={handleChange} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="checkbox" name="receipt_show_item_sku" checked={!!settings.receipt_show_item_sku} onChange={handleChange} />
                            <label className="text-sm text-slate-400">Show item SKU on receipts</label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 text-slate-100 relative min-h-screen">
            {/* Header */}
            <div className="rounded-3xl border border-white/10 bg-[#08120f]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Admin Panel</p>
                <h1 className="mt-2 text-3xl font-black text-white">System Settings</h1>
                <p className="mt-2 text-sm text-slate-400">Configure global platform parameters, delivery earnings, and rules.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveModal(tab.id)}
                            className="flex flex-col items-start gap-4 p-6 rounded-3xl border border-white/10 bg-[#08120f]/85 hover:bg-white/5 transition-all text-left shadow-[0_20px_80px_rgba(0,0,0,0.35)] group"
                        >
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                {tab.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{tab.label}</h3>
                                <p className="text-sm text-slate-400">{tab.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Modal Popup */}
            {activeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0a1612] shadow-2xl flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                {tabs.find(t => t.id === activeModal)?.icon}
                                {tabs.find(t => t.id === activeModal)?.label}
                            </h2>
                            <button onClick={() => setActiveModal(null)} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            <form id="settings-form" onSubmit={handleSave}>
                                {renderModalContent()}
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5 shrink-0 bg-[#0a1612] rounded-b-[2rem]">
                            <button onClick={() => setActiveModal(null)} type="button"
                                className="rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition">
                                Cancel
                            </button>
                            <button form="settings-form" type="submit" disabled={saving}
                                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50">
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
