import React from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { FiUser, FiMail, FiPhone, FiHash, FiShield, FiCalendar, FiMapPin } from "react-icons/fi";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-white/80 p-8 shadow-lg shadow-slate-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Profile not available</h2>
          <p className="mt-3 text-sm text-slate-500">Please log in again to view your chef profile.</p>
        </div>
      </div>
    );
  }

  const details = [
    { label: "Internal ID", value: user.id || "-", icon: FiHash },
    { label: "User ID", value: user.user_id || "-", icon: FiUser },
    { label: "Name", value: user.name || user.username || "-", icon: FiUser },
    { label: "Username", value: user.username || "-", icon: FiUser },
    { label: "Email", value: user.email || "-", icon: FiMail },
    { label: "Phone", value: user.phone || "-", icon: FiPhone },
    { label: "Role", value: user.role || "-", icon: FiShield },
    { label: "Joined", value: user.created_at || user.created || "-", icon: FiCalendar },
    { label: "Address", value: user.street_address || user.address || "Not set", icon: FiMapPin }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-slate-900 text-4xl font-black text-white">
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Chef Profile</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">{user.name || user.username || "Chef"}</h1>
              <p className="mt-1 text-sm text-slate-500">Here are your account details from the users table.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">User ID</p>
            <p className="mt-2 text-xl font-black text-slate-900">{user.user_id || "-"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
              </div>
              <p className="text-base font-semibold text-slate-800 break-words">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profile;
