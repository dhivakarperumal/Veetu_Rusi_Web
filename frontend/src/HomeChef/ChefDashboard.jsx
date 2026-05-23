import React from "react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/chef/analytics": "Analytics Dashboard",
  "/chef/add-products": "Add Products",
  "/chef/recipes": "Recipe Details",
  "/chef/upload-videos": "Food Videos",
  "/chef/social-media": "Social Media",
  "/chef/daily-menu": "Daily Menu",
  "/chef/meal-slots": "Meal Slots",
  "/chef/preorders": "Preorders",
  "/chef/delivery-settings": "Delivery Settings",
  "/chef/earnings": "Wallet & Earnings",
  "/chef/orders": "Orders",
};

const HomeChefDashboard = () => {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    for (const [p, t] of Object.entries(pageTitles)) {
      if (path.startsWith(p + "/")) return t;
    }
    return "Analytics Dashboard";
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">{getTitle()}</h1>
        <p className="text-slate-600 mt-2">
          Welcome back! Use the sidebar to manage products, orders, menus, and earnings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Daily Orders</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">0</p>
          <p className="mt-2 text-sm text-slate-500">Orders received today</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Menu Items</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">0</p>
          <p className="mt-2 text-sm text-slate-500">Active items listed</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Earnings</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">₹0</p>
          <p className="mt-2 text-sm text-slate-500">Total earnings this month</p>
        </div>
      </div>
    </div>
  );
};

export default HomeChefDashboard;
