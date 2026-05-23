import React, { useEffect, useState } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { FiUser, FiMail, FiPhone, FiHash, FiShield, FiCalendar, FiMapPin } from "react-icons/fi";

const formatLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/Id\b/, "ID");
};

const Profile = () => {
  const { user } = useAuth();
  const [homeChef, setHomeChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/profile");
        setHomeChef(res.data.homeChef || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load chef profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-white/80 p-8 shadow-lg shadow-slate-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Profile not available</h2>
          <p className="mt-3 text-sm text-slate-500">Please log in again to view your chef profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-white/80 p-8 shadow-lg shadow-slate-200">
        <div className="text-center text-slate-500">Loading chef profile...</div>
      </div>
    );
  }

  const details = [
    { label: "Internal ID", value: user.id || "-", icon: FiHash },
    { label: "User ID", value: user.user_id || "-", icon: FiUser },
    { label: "Name", value: user.name || user.username || "-", icon: FiUser },
    { label: "Email", value: user.email || "-", icon: FiMail },
    { label: "Phone", value: user.phone || "-", icon: FiPhone },
    { label: "Role", value: user.role || "-", icon: FiShield },
    { label: "Joined", value: user.created_at || user.created || "-", icon: FiCalendar },
    { label: "Address", value: user.street_address || user.address || "Not set", icon: FiMapPin }
  ];

  const chefFields = homeChef
    ? Object.entries(homeChef).map(([key, value]) => ({ label: formatLabel(key), value: value === null || value === undefined || value === "" ? "-" : value }))
    : [];

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
              <p className="mt-1 text-sm text-slate-500">Here are your account details and home chef profile fields.</p>
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

      {error && (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {homeChef ? (
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-900">Home Chef Profile Fields</h2>
            <p className="mt-2 text-sm text-slate-500">Displaying all columns from the home_chefs table.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {chefFields.map((field) => (
              <div key={field.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400 mb-2">{field.label}</p>
                <p className="text-base font-semibold text-slate-800 break-words">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-sm text-slate-500">No home chef record was found for this account.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
