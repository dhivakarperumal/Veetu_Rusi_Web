import React, { useState, useContext, useEffect } from "react";
import {
  FiUser, FiPackage, FiMapPin, FiLock, FiLogOut,
  FiMail, FiPhone, FiShield, FiMapPin as FiLocation, FiGift
} from "react-icons/fi";
import SetPassword from "./SetPassword";
import PersonalInfo from "./PersonalInfo";
import Orders from "./Orders";
import Address from "./Address";
import PageContainer from "../../CommenComponents/PageContainer";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import MyFoodOrders from "../MyFoodOrders";
import Referral from "../Referral";

export default function Account() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tab || "personal");
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab]);

  const menuItems = [
    { key: "personal", label: "Personal Info", icon: <FiUser size={18} /> },
    // { key: "orders",   label: "Product Orders", icon: <FiPackage size={18} /> },
    { key: "food_orders", label: "My Orders", icon: <FiPackage size={18} /> },
    { key: "referrals", label: "Referrals", icon: <FiGift size={18} /> },
    { key: "address",  label: "Manage Address", icon: <FiMapPin size={18} /> },
    { key: "password", label: "Set Password",  icon: <FiLock size={18} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatarLetter = (user?.username || user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* Hero Banner */}
    
        

      {/* Body */}
      <div className="min-h-screen bg-[#F8F6F2] py-10">
        <PageContainer>
          <div className="grid lg:grid-cols-4 gap-8">

            {/* SIDEBAR */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                {/* Quick info card */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-green-50 to-white">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Account</p>
                  <p className="font-bold text-gray-800 truncate">
                    {user?.username || user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>

                {/* Nav items */}
                <nav className="p-3 space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all cursor-pointer text-sm
                        ${activeTab === item.key
                          ? "bg-primary text-white shadow-md shadow-green-200"
                          : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      <span className={activeTab === item.key ? "text-white" : "text-primary"}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <button
                      onClick={() => setLogoutConfirm(true)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all cursor-pointer text-sm text-red-500 hover:bg-red-50"
                    >
                      <FiLogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </nav>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="lg:col-span-3">
              {activeTab === "personal" && <PersonalInfo />}
              {activeTab === "orders"   && <Orders />}
              {activeTab === "food_orders" && <MyFoodOrders isEmbedded={true} />}
              {activeTab === "referrals" && <Referral />}
              {activeTab === "address"  && <Address />}
              {activeTab === "password" && <SetPassword />}
            </div>

          </div>
        </PageContainer>
      </div>

      {/* Logout Confirm Modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLogOut size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sign Out?</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}