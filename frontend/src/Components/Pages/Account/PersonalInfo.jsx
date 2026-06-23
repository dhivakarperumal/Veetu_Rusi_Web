import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";
import {
  FiUser, FiMail, FiPhone, FiShield, FiMapPin,
  FiSave, FiLoader, FiEdit2, FiCheckCircle
} from "react-icons/fi";

export default function PersonalInfo() {
  const { user, login } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || user.name || user.full_name || "",
        email: user.email || "",
        phone: user.phone || user.mobile || user.mobile_number || "",
        role: user.role || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await api.put(`/auth/profile`, {
        username: form.username,
        email: form.email,
        phone: form.phone
      });
      if (res.data?.user) {
        const token = localStorage.getItem("token");
        login(res.data.user, token);
      }
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-green-100 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-gray-800 font-medium mt-0.5 break-words">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Personal Information</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage your profile details</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              editing
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-primary text-white hover:bg-primary-light shadow-sm"
            }`}
          >
            <FiEdit2 size={14} />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="p-6">
          {!editing ? (
            /* ─── VIEW MODE ─── */
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow icon={<FiUser size={16} />}   label="Full Name"     value={user?.username || user?.name} />
              <InfoRow icon={<FiMail size={16} />}   label="Email Address" value={user?.email} />
              <InfoRow icon={<FiPhone size={16} />}  label="Phone Number"  value={user?.phone || user?.mobile_number} />
              <InfoRow icon={<FiShield size={16} />} label="Account Role"  value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"} />
              {user?.pincode && (
                <InfoRow icon={<FiMapPin size={16} />} label="Location Pincode" value={user.pincode} />
              )}
              {user?.location_name && (
                <InfoRow icon={<FiMapPin size={16} />} label="Location" value={user.location_name.split(",").slice(0, 2).join(",")} />
              )}
            </div>
          ) : (
            /* ─── EDIT MODE ─── */
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full pl-9 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                <div className="relative">
                  <FiPhone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Role (read only) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Account Role</label>
                <div className="relative">
                  <FiShield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : ""}
                    disabled
                    className="w-full pl-9 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-400 cursor-not-allowed capitalize"
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="sm:col-span-2 flex justify-end mt-2">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-semibold transition shadow-sm disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <><FiLoader className="animate-spin" size={16} /> Saving...</>
                  ) : (
                    <><FiSave size={16} /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location card */}
      {(user?.pincode || user?.latitude) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-green-100 text-primary flex items-center justify-center">
              <FiMapPin size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Current Location</h3>
              <p className="text-xs text-gray-400">Auto-detected location</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {user?.pincode && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Pincode</p>
                <p className="text-xl font-black text-primary mt-1">{user.pincode}</p>
              </div>
            )}
            {user?.latitude && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Latitude</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{parseFloat(user.latitude).toFixed(4)}</p>
              </div>
            )}
            {user?.longitude && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Longitude</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{parseFloat(user.longitude).toFixed(4)}</p>
              </div>
            )}
          </div>
          {user?.location_name && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-start gap-2">
              <FiCheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">{user.location_name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}