// import React from "react";
// import {
//     FiSettings,
//     FiGlobe,
//     FiBell,
//     FiLock,
//     FiDatabase,
//     FiShield,
//     FiUsers,
//     FiCheck
// } from "react-icons/fi";
// import { FaRupeeSign } from "react-icons/fa";

// const Settings = () => {
//     return (
//         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
//             {/* Header */}
//             <div>
//                 <h1 className="text-2xl font-bold text-slate-100">System Preferences</h1>
//                 <p className="text-sm text-slate-400 font-medium mt-1">Configure your eMart administration experience</p>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Navigation Menu */}
//                 <div className="lg:col-span-1 space-y-2">
//                     {[
//                         { label: "General Settings", icon: <FiSettings />, active: true },
//                         { label: "Notifications", icon: <FiBell />, active: false },
//                         { label: "Security & Access", icon: <FiShield />, active: false },
//                         { label: "Regional & Language", icon: <FiGlobe />, active: false },
//                         { label: "Payment Gateways", icon: <FaRupeeSign />, active: false },
//                         { label: "Team Management", icon: <FiUsers />, active: false },
//                         { label: "Data & Backup", icon: <FiDatabase />, active: false },
//                     ].map((item, i) => (
//                         <button key={i} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-950/90 text-slate-300 hover:bg-slate-900 border border-white/10'}`}>
//                             <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-gray-50 pb-4">General Configuration</h3>

//                             <div className="space-y-6">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     <div className="space-y-2">
//                                         <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Store Name</label>
//                                         <input type="text" defaultValue="eMart Saree Collections" className="superadmin-input" />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Store Email</label>
//                                         <input type="email" defaultValue="admin@emart.com" className="superadmin-input" />
//                                     </div>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Maintenance Mode</label>
//                                     <div className="flex items-center gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10">
//                                         <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-900 transition-colors duration-200 ease-in-out">
//                                             <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-slate-200 shadow ring-0 transition duration-200 ease-in-out"></span>
//                                         </div>
//                                         <div>
//                                             <p className="text-sm font-bold text-slate-100">Disable customer access</p>
//                                             <p className="text-xs text-slate-400 mt-0.5">Your store will be inaccessible while editing.</p>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Automatic Updates</label>
//                                     <div className="flex items-center gap-4 p-4 bg-slate-900/90 rounded-2xl border border-white/10">
//                                         <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out">
//                                             <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
//                                         </div>
//                                         <div>
//                                             <p className="text-sm font-bold text-white">Enabled</p>
//                                             <p className="text-xs text-cyan-300 mt-0.5 font-medium">Keep system up-to-date with latest security patches.</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
//                             <button className="px-6 py-3 bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800 rounded-xl font-bold transition-all">Cancel Changes</button>
//                             <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
//                                 <FiCheck /> Save Configuration
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Settings;

import { useState } from "react";
import {
  FiSettings,
  FiBell,
  FiShield,
  FiGlobe,
  FiDatabase,
  FiUsers,
  FiCheck,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const menuItems = [
  { id: "general", title: "General Settings", icon: FiSettings },
  { id: "notifications", title: "Notifications", icon: FiBell },
  { id: "security", title: "Security & Access", icon: FiShield },
  { id: "regional", title: "Regional & Language", icon: FiGlobe },
  { id: "payment", title: "Payment Gateways", icon: FaRupeeSign },
  { id: "team", title: "Team Management", icon: FiUsers },
  { id: "backup", title: "Data & Backup", icon: FiDatabase },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    storeName: "eMart Saree Collections",
    email: "admin@emart.com",
    phone: "+91 9876543210",
    address: "Bangalore, Karnataka",
    currency: "INR",
    language: "English",
    maintenance: false,
    autoUpdate: true,
    emailNotification: true,
    smsNotification: false,
    loginAlert: true,
    backupEnabled: true,
    backupSchedule: "Daily",
  });

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "notifications":
        return (
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Email Alerts</label>
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Email notifications</p>
                  <p className="text-sm text-slate-400">Receive updates about orders, payouts, and partner activity.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("emailNotification", !settings.emailNotification)}
                  className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-200 ${settings.emailNotification ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${settings.emailNotification ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">SMS Alerts</label>
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">SMS notifications</p>
                  <p className="text-sm text-slate-400">Send account status and delivery reminders directly to your phone.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("smsNotification", !settings.smsNotification)}
                  className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-200 ${settings.smsNotification ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${settings.smsNotification ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-slate-300">
              <p className="text-sm font-black text-white mb-2">Notification rules</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Order updates within 2 minutes</li>
                <li>• Payout alerts after each weekly settlement</li>
                <li>• Urgent security alerts for login activity</li>
              </ul>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Login Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Access Protection</label>
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Secure login alerts</p>
                  <p className="text-sm text-slate-400">Get notified when unknown devices access your account.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("loginAlert", !settings.loginAlert)}
                  className={`relative inline-flex h-6 w-12 rounded-full transition-colors duration-200 ${settings.loginAlert ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${settings.loginAlert ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-slate-300">
              <p className="font-bold text-white">Security best practices</p>
              <p className="text-sm text-slate-400 mt-2">Use a strong password, enable login alerts, and keep your device secure while on delivery routes.</p>
            </div>
          </div>
        );
      case "regional":
        return (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                  <option>Tamil</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Store Region</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Default Currency</label>
                <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white flex items-center gap-2">
                  <FaRupeeSign className="text-emerald-400" />
                  <span>{settings.currency}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Delivery Zone</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        );
      case "payment":
        return (
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Payment Partner</label>
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                <p className="font-bold text-white">Veetu Pay Gateway</p>
                <p className="text-sm text-slate-400 mt-1">Accept payouts and partner settlements through a secure gateway.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Currency</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Settlement Hours</label>
                <input
                  type="text"
                  value="24 hours"
                  readOnly
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-300 outline-none"
                />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-400">
              <p className="font-bold text-white">Payment note</p>
              <p className="mt-2">Enable the Veetu Pay gateway once your payout account details are verified. This keeps partner earnings flowing smoothly.</p>
            </div>
          </div>
        );
      case "team":
        return (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Team Capacity</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Active Partners", value: 18 },
                  { label: "Pending Invites", value: 4 },
                  { label: "Support Tickets", value: 2 },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-900 p-4 border border-white/10">
                    <p className="text-sm text-slate-400 uppercase tracking-[0.24em]">{item.label}</p>
                    <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
              <p className="font-bold text-white">Team access control</p>
              <p className="text-sm text-slate-400 mt-2">Invite partners, manage permissions, and assign delivery zones from the partner control panel.</p>
            </div>
          </div>
        );
      case "backup":
        return (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Backup Status</p>
                  <p className="mt-2 text-white font-bold">{settings.backupEnabled ? "Enabled" : "Disabled"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("backupEnabled", !settings.backupEnabled)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${settings.backupEnabled ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-200"}`}>
                  {settings.backupEnabled ? "Turn Off" : "Enable"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Backup Schedule</label>
                <select
                  value={settings.backupSchedule}
                  onChange={(e) => handleChange("backupSchedule", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Last Backup</label>
                <input
                  type="text"
                  value="Today • 02:15 AM"
                  readOnly
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-300 outline-none"
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleChange("storeName", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Store Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.26em] text-slate-400">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        );
    }
  };

  const activeSection = menuItems.find((item) => item.id === activeTab);

  return (
    <div className="min-h-screen bg-[#040c0d] px-6 py-8 text-slate-100">
      <div className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400">Delivery Partner Workspace</span>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Settings</h1>
        <p className="max-w-2xl text-sm text-slate-400 mt-3">Manage platform preferences, security, payouts, and partner access settings from a unified dark dashboard.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl">
          <div className="rounded-[1.75rem] border border-slate-800 bg-[#06110e] p-5 shadow-inner shadow-black/10">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Navigation</p>
            <div className="mt-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                      active
                        ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "text-slate-300 hover:bg-slate-900/80"
                    }`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-900 text-slate-400"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick summary</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Status</p>
                <p className="mt-2 text-lg font-black text-white">All systems normal</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current tab</p>
                <p className="mt-2 text-lg font-black text-white">{activeSection?.title}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-emerald-300">{activeSection?.title}</div>
                <h2 className="text-3xl font-black text-white">{activeSection?.title}</h2>
                <p className="text-sm text-slate-400 max-w-2xl">Update your workspace preferences with the latest delivery partner style guidelines and secure payout controls.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({
                    storeName: "eMart Saree Collections",
                    email: "admin@emart.com",
                    phone: "+91 9876543210",
                    address: "Bangalore, Karnataka",
                    currency: "INR",
                    language: "English",
                    maintenance: false,
                    autoUpdate: true,
                    emailNotification: true,
                    smsNotification: false,
                    loginAlert: true,
                    backupEnabled: true,
                    backupSchedule: "Daily",
                  })}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
                >
                  Reset
                </button>
                <button className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                  <FiCheck className="inline-block mr-2 h-4 w-4" /> Save Changes
                </button>
              </div>
            </div>

            <div className="mt-8">{renderTabContent()}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Partner health</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Live</span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-slate-900/90 p-4 border border-white/5">
                  <p className="text-sm text-slate-400">Current uptime</p>
                  <p className="mt-2 text-2xl font-black text-white">99.98%</p>
                </div>
                <div className="rounded-3xl bg-slate-900/90 p-4 border border-white/5">
                  <p className="text-sm text-slate-400">Next scheduled sync</p>
                  <p className="mt-2 text-lg font-bold text-white">Today • 03:00 AM</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Tips</p>
              <h3 className="mt-4 text-2xl font-black text-white">Optimize delivery earnings</h3>
              <p className="mt-3 text-sm text-slate-400">Keep your profile updated, maintain high ratings, and complete partner challenges to increase payouts and unlock premium routes.</p>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="rounded-3xl bg-slate-900/90 p-4 border border-white/5">• Keep notifications enabled for instant payout alerts.</div>
                <div className="rounded-3xl bg-slate-900/90 p-4 border border-white/5">• Verify your account details for faster settlements.</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
