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

import React, { useState } from "react";
import {
  FiSettings,
  FiBell,
  FiShield,
  FiGlobe,
  FiDatabase,
  FiUsers,
  FiCheck,
  FiSave,
  FiRefreshCw,
  FiLock,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const menuItems = [
  {
    id: "general",
    title: "General Settings",
    icon: <FiSettings />,
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: <FiBell />,
  },
  {
    id: "security",
    title: "Security & Access",
    icon: <FiShield />,
  },
  {
    id: "regional",
    title: "Regional & Language",
    icon: <FiGlobe />,
  },
  {
    id: "payment",
    title: "Payment Gateways",
    icon: <FaRupeeSign />,
  },
  {
    id: "team",
    title: "Team Management",
    icon: <FiUsers />,
  },
  {
    id: "backup",
    title: "Data & Backup",
    icon: <FiDatabase />,
  },
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
    backup: true,
  });

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-white">
          System Preferences
        </h1>

        <p className="text-slate-400 mt-2">
          Configure your administration panel settings.
        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 h-fit">

          <h2 className="text-lg font-bold text-white mb-5">
            Settings
          </h2>

          <div className="space-y-2">

            {menuItems.map((item) => (

              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span className="font-medium">
                  {item.title}
                </span>

              </button>

            ))}

          </div>

        </div>

        {/* Right Content */}

        <div className="lg:col-span-3">

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">

            {activeTab === "general" && (

              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  General Configuration
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                                      {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Store Name
                    </label>

                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) =>
                        handleChange("storeName", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Store Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Store Email
                    </label>

                    <div className="relative">
                      <FiMail className="absolute left-3 top-4 text-slate-400" />

                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) =>
                          handleChange("email", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number
                    </label>

                    <div className="relative">
                      <FiPhone className="absolute left-3 top-4 text-slate-400" />

                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) =>
                          handleChange("phone", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Address
                    </label>

                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-4 text-slate-400" />

                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Currency
                    </label>

                    <select
                      value={settings.currency}
                      onChange={(e) =>
                        handleChange("currency", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Language
                    </label>

                    <select
                      value={settings.language}
                      onChange={(e) =>
                        handleChange("language", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                </div>

                {/* Switch Cards */}
                <div className="mt-8 space-y-4">

                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Maintenance Mode
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Disable customer access while updating the store.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.maintenance}
                      onChange={(e) =>
                        handleChange("maintenance", e.target.checked)
                      }
                      className="h-6 w-6"
                    />
                  </div>

                  {/* Auto Update */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Automatic Updates
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Install the latest security updates automatically.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.autoUpdate}
                      onChange={(e) =>
                        handleChange("autoUpdate", e.target.checked)
                      }
                      className="h-6 w-6"
                    />
                  </div>

                </div>

              </div>
            )}
                </div>
                            {/* ================= Notifications ================= */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Notification Settings
                </h2>

                <div className="space-y-5">

                  <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800 border border-slate-700">
                    <div>
                      <h3 className="text-white font-semibold">
                        Email Notifications
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Receive important system emails.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.emailNotification}
                      onChange={(e) =>
                        handleChange(
                          "emailNotification",
                          e.target.checked
                        )
                      }
                      className="w-6 h-6"
                    />
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800 border border-slate-700">
                    <div>
                      <h3 className="text-white font-semibold">
                        SMS Notifications
                      </h3>

                      <p className="text-slate-400 text-sm">
                        Receive SMS alerts.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.smsNotification}
                      onChange={(e) =>
                        handleChange(
                          "smsNotification",
                          e.target.checked
                        )
                      }
                      className="w-6 h-6"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ================= Security ================= */}

            {activeTab === "security" && (
              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Security & Access
                </h2>

                <div className="space-y-6">

                  <div>
                    <label className="block text-slate-300 mb-2">
                      Current Password
                    </label>

                    <input
                      type="password"
                      placeholder="********"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2">
                      New Password
                    </label>

                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
                      Update Password
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ================= Regional ================= */}

            {activeTab === "regional" && (
              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Regional & Language
                </h2>

                <div className="grid md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-slate-300 mb-2">
                      Time Zone
                    </label>

                    <select className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white">

                      <option>Asia/Kolkata</option>
                      <option>Asia/Dubai</option>
                      <option>UTC</option>

                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2">
                      Date Format
                    </label>

                    <select className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white">

                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY/MM/DD</option>

                    </select>
                  </div>

                </div>

              </div>
            )}

            {/* ================= Payment ================= */}

            {activeTab === "payment" && (
              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Payment Gateways
                </h2>

                <div className="grid md:grid-cols-2 gap-6">

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">

                    <h3 className="text-white font-bold mb-2">
                      Razorpay
                    </h3>

                    <p className="text-slate-400 text-sm">
                      Enable Razorpay payments.
                    </p>

                    <input
                      type="checkbox"
                      className="mt-5 w-6 h-6"
                    />

                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">

                    <h3 className="text-white font-bold mb-2">
                      Cashfree
                    </h3>

                    <p className="text-slate-400 text-sm">
                      Enable Cashfree Gateway.
                    </p>

                    <input
                      type="checkbox"
                      className="mt-5 w-6 h-6"
                    />

                  </div>

                </div>

              </div>
            )}

            {/* ================= Team ================= */}

            {activeTab === "team" && (
              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Team Management
                </h2>

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b border-slate-700">

                        <th className="text-left py-3 text-slate-300">
                          Name
                        </th>

                        <th className="text-left py-3 text-slate-300">
                          Role
                        </th>

                        <th className="text-left py-3 text-slate-300">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      <tr className="border-b border-slate-800">

                        <td className="py-4 text-white">
                          Admin
                        </td>

                        <td className="py-4 text-slate-400">
                          Super Admin
                        </td>

                        <td className="py-4 text-green-400">
                          Active
                        </td>

                      </tr>

                      <tr>

                        <td className="py-4 text-white">
                          Manager
                        </td>

                        <td className="py-4 text-slate-400">
                          Staff
                        </td>

                        <td className="py-4 text-green-400">
                          Active
                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>
            )}

            {/* ================= Backup ================= */}

            {activeTab === "backup" && (
              <div>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Data & Backup
                </h2>

                <div className="space-y-6">

                  <button className="flex items-center gap-3 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-white font-semibold">

                    <FiDatabase />

                    Create Backup

                  </button>

                  <button className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-xl text-white font-semibold">

                    <FiRefreshCw />

                    Restore Backup

                  </button>

                </div>

              </div>
            )}
                      {/* Bottom Action Buttons */}
          <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-end gap-4">

            <button
              type="button"
              className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              onClick={() => {
                alert("Settings saved successfully!");
              }}
            >
              <FiSave className="text-lg" />
              Save Settings
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
