import React from "react";

const HomeChefManagement = () => {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Home Chef Management</h1>
        <p className="mt-2 text-slate-600">
          Manage your chef profile, menu listings, and service availability from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Profile Status</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">Active</p>
          <p className="mt-2 text-sm text-slate-500">Your chef account is live.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Menu Items</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">0</p>
          <p className="mt-2 text-sm text-slate-500">Items currently available.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Orders</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-800">0</p>
          <p className="mt-2 text-sm text-slate-500">Pending orders for today.</p>
        </div>
      </div>
    </div>
  );
};

export default HomeChefManagement;
