import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiShield,
    FiCamera,
    FiCheck,
    FiKey,
    FiLock,
    FiX,
    FiEdit2,
    FiUser,
    FiCalendar,
    FiLoader
} from "react-icons/fi";

const Profile = () => {
    const { user, login } = useContext(AuthContext);

    const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);

    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    const [profileData, setProfileData] = useState({
        username: "",
        name: "",
        email: "",
        phone: "",
        street_address: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        zip_code: "",
        role: "",
        created_at: ""
    });

    // Fetch full profile from API
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/auth/profile`);
            const profile = res.data.user || res.data;
            setProfileData({
                username: profile.username || "",
                name: profile.name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                street_address: profile.street_address || "",
                city: profile.city || "",
                district: profile.district || "",
                state: profile.state || "",
                country: profile.country || "India",
                zip_code: profile.zip_code || "",
                role: profile.role || "",
                created_at: profile.created_at || ""
            });
        } catch (err) {
            console.error("Failed to load profile:", err);
            // Fallback to local user data
            setProfileData({
                username: user?.username || "",
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                street_address: "",
                city: "",
                district: "",
                state: "",
                country: "India",
                zip_code: "",
                role: user?.role || "",
                created_at: ""
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchProfile();
    }, [user?.id]);

    const openPwdModal = () => setIsPwdModalOpen(true);
    const openEditModal = () => setIsEditModalOpen(true);

    const closePwdModal = () => {
        setIsPwdModalOpen(false);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    // Save profile to DB
    const handleProfileUpdate = async () => {
        if (!profileData.username.trim()) {
            toast.error("Username is required");
            return;
        }
        if (!profileData.email.trim()) {
            toast.error("Email is required");
            return;
        }

        try {
            setSaving(true);
            const res = await api.put(`/auth/profile`, {
                username: profileData.username,
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone,
                street_address: profileData.street_address,
                city: profileData.city,
                district: profileData.district,
                state: profileData.state,
                country: profileData.country,
                zip_code: profileData.zip_code
            });

            // Update local storage & context with new data
            const updatedUser = res.data.user;
            const token = localStorage.getItem("token");
            login({ ...user, ...updatedUser }, token);

            toast.success("Profile updated successfully");
            closeEditModal();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Change password via API
    const handlePwdChange = async () => {
        if (!currentPwd.trim()) {
            toast.error("Enter your current password");
            return;
        }
        if (newPwd.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (newPwd !== confirmPwd) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            setChangingPwd(true);
            await api.put(`/auth/profile/password`, {
                currentPassword: currentPwd,
                newPassword: newPwd
            });

            toast.success("Password changed successfully");
            closePwdModal();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPwd(false);
        }
    };

    const locationDisplay = [profileData.city, profileData.state, profileData.country]
        .filter(Boolean)
        .join(", ") || "Not set";

    const memberSince = profileData.created_at
        ? new Date(profileData.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
        : "";

    const profileInitial = (profileData.name || profileData.username || "U").charAt(0).toUpperCase();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FiLoader className="animate-spin text-4xl text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Profile Card */}
            <div className="px-4 md:px-8">
                <div className="table-card rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-white/10">

                    <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/10 pb-8">

                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2rem] bg-slate-900 ring-8 ring-white/20 shadow-2xl overflow-hidden flex items-center justify-center text-white text-7xl font-black">
                                {profileInitial}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left space-y-2 flex-1">

                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-3xl font-black text-slate-800">
                                    {profileData.name || profileData.username || "User"}
                                </h1>

                                <button
                                    onClick={openEditModal}
                                    className="p-2 rounded-lg bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
                                >
                                    <FiEdit2 />
                                </button>
                            </div>

                            <p className="text-slate-400 font-medium">
                                @{profileData.username} • {profileData.role || "Admin"}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                                <span className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <FiMapPin className="text-blue-500" />
                                    {locationDisplay}
                                </span>

                                <span className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <FiShield className="text-emerald-500" />
                                    Identity Verified
                                </span>

                                {memberSince && (
                                    <span className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <FiCalendar className="text-purple-500" />
                                        Joined {memberSince}
                                    </span>
                                )}
                            </div>

                        </div>

                        {/* Change Password */}
                        <button
                            onClick={openPwdModal}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-colors"
                            Change Password
                        </button>

                    </div>

                    {/* Account Info */}
                    <div className="grid md:grid-cols-2 gap-6 mt-8">

                        <div className="flex items-center gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <FiUser className="text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Username</p>
                                <p className="font-bold text-white">{profileData.username || "–"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <FiMail className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Email</p>
                                <p className="font-bold text-white">{profileData.email || "–"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <FiPhone className="text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Phone</p>
                                <p className="font-bold text-white">{profileData.phone || "Not set"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-950/90 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                <FiMapPin className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Location</p>
                                <p className="font-bold text-white">{locationDisplay}</p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>


            {/* EDIT PROFILE MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">

                    <div className="bg-slate-950/95 p-6 rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto border border-white/10">

                        <button
                            onClick={closeEditModal}
                            className="absolute top-3 right-3 p-2 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                            <FiX />
                        </button>

                        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                            <FiEdit2 className="text-cyan-400" />
                            Edit Profile
                        </h2>

                        <div className="space-y-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Username *</label>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={profileData.username}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, username: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={profileData.name}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, name: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Email *</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={profileData.email}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, email: e.target.value })
                                    }
                                    className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Phone</label>
                                <input
                                    type="text"
                                    placeholder="Phone number"
                                    value={profileData.phone}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, phone: e.target.value })
                                    }
                                    className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>


                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</p>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Street Address</label>
                                <input
                                    type="text"
                                    placeholder="Street address"
                                    value={profileData.street_address}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, street_address: e.target.value })
                                    }
                                    className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">City</label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={profileData.city}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, city: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">District</label>
                                    <input
                                        type="text"
                                        placeholder="District"
                                        value={profileData.district}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, district: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">State</label>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={profileData.state}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, state: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Country</label>
                                    <input
                                        type="text"
                                        placeholder="Country"
                                        value={profileData.country}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, country: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">ZIP Code</label>
                                    <input
                                        type="text"
                                        placeholder="ZIP"
                                        value={profileData.zip_code}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, zip_code: e.target.value })
                                        }
                                        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleProfileUpdate}
                                disabled={saving}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <FiLoader className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck />
                                        Save Changes
                                    </>
                                )}
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* PASSWORD MODAL */}
            {isPwdModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">

                    <div className="bg-slate-950/95 p-6 rounded-2xl w-full max-w-md relative border border-white/10">

                        <button
                            onClick={closePwdModal}
                            className="absolute top-3 right-3 p-2 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                            <FiX />
                        </button>

                        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                            <FiLock className="text-cyan-400" />
                            Change Password
                        </h2>

                        <div className="space-y-4">

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Current Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                    className="superadmin-input"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    className="superadmin-input"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    className="superadmin-input"
                                />
                            </div>

                            <button
                                onClick={handlePwdChange}
                                disabled={changingPwd}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {changingPwd ? (
                                    <>
                                        <FiLoader className="animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <FiKey />
                                        Update Password
                                    </>
                                )}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            <Toaster position="top-right" />
        </div>
    );
};

export default Profile;
