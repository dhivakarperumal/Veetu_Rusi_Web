import React, { useState, useEffect } from "react";
import api from "../../api";
import {
    FiSearch,
    FiFilter,
    FiUserPlus,
    FiMoreVertical,
    FiMail,
    FiPhone,
    FiCalendar,
    FiUserX,
    FiX,
    FiEdit2
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";


const Users = ({ initialTab = "All" }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(initialTab);
    const [selectedRole, setSelectedRole] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const roleOptions = ["all", "superadmin", "admin", "franchise", "manager", "chef", "dealer", "delivery_partner", "user"];

    const formatRoleLabel = (role) => {
        if (!role) return "";
        return role === "all"
            ? "all roles"
            : role.replace(/_/g, " ");
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Update tab when initialTab prop changes
    useEffect(() => {
        setSelectedTab(initialTab);
    }, [initialTab]);

    // ---- Modal State for Registering/Editing User ----
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        name: "",
        email: "",
        phone: "",
        role: "user",
        password: ""
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get("/auth/users");
                // Transform data if needed for UI
                const fetchedUsers = response.data.map(u => ({
                    id: u.id || u.user_id,
                    name: u.name || u.username,
                    email: u.email,
                    phone: u.phone || u.mobile || u.mobile_number || '',
                    role: u.role ? u.role.toString().trim().toLowerCase() : 'user',
                    status: 'Active', // Mocking status since it's not in db yet
                    joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
                    rawCreated_at: u.created_at,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username)}&background=random`
                }));
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get("/auth/users");
            const fetchedUsers = response.data.map(u => ({
                id: u.id || u.user_id,
                name: u.name || u.username,
                email: u.email,
                phone: u.phone || u.mobile || u.mobile_number || '',
                role: u.role ? u.role.toString().trim().toLowerCase() : 'user',
                status: 'Active',
                joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
                rawCreated_at: u.created_at,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username)}&background=random`
            }));
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveUser = async () => {
        if (!formData.username || !formData.email) return;
        if (!isEditing && !formData.password) return;

        setSubmitLoading(true);
        try {
            if (isEditing) {
                await api.put(`/auth/users/${editUserId}`, { ...formData, role: formData.role.toLowerCase() });
                toast.success("User updated successfully!");
            } else {
                await api.post("/auth/register", { ...formData, role: formData.role.toLowerCase() });
                toast.success("User registered successfully!");
            }
            setIsModalOpen(false);
            setFormData({ username: "", name: "", email: "", phone: "", role: "user", password: "" });
            setIsEditing(false);
            setEditUserId(null);
            fetchUsers();
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await api.delete(`/auth/users/${id}`);
            toast.success("User eliminated from system.");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleQuickRoleUpdate = async (id, newRole, user) => {
        try {
            const payload = {
                username: user.username || user.name,
                name: user.name,
                email: user.email,
                phone: user.phone || ""
            };
            await api.put(`/auth/users/${id}`, { ...payload, role: newRole.toLowerCase() });
            toast.success(`Role updated to ${newRole.toLowerCase()}`);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const openEditModal = (user) => {
        setFormData({
            username: user.username || user.name,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            password: "" // Don't show password on edit
        });
        setEditUserId(user.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const getRoleStyle = (role) => {
        const normalizedRole = role ? role.toLowerCase() : "";
        if (normalizedRole.includes("superadmin")) return "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20";
        if (normalizedRole.includes("delivery_partner")) return "bg-sky-500/10 text-sky-300 border border-sky-400/20";
        if (normalizedRole.includes("admin")) return "bg-violet-500/10 text-violet-300 border border-violet-400/20";
        if (normalizedRole.includes("franchise")) return "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20";
        if (normalizedRole.includes("chef")) return "bg-purple-500/10 text-purple-300 border border-purple-400/20";
        if (normalizedRole.includes("manager")) return "bg-indigo-500/10 text-indigo-300 border border-indigo-400/20";
        if (normalizedRole.includes("dealer")) return "bg-amber-500/10 text-amber-300 border border-amber-400/20";
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"; // User / Customer
    };

    const isToday = (dateString) => {
        if (!dateString || dateString === 'N/A') return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const filteredUsers = users.filter(user => {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = user.name.toLowerCase().includes(lowerSearch) ||
            user.email.toLowerCase().includes(lowerSearch) ||
            (user.phone || '').toLowerCase().includes(lowerSearch);

        const matchesTab = selectedTab === "All" || (selectedTab === "New" && isToday(user.rawCreated_at));
        const matchesRole = selectedRole === "all" || (user.role && user.role.toLowerCase() === selectedRole.toLowerCase());

        return matchesSearch && matchesTab && matchesRole;
    });

    const newUsersCount = users.filter(u => isToday(u.rawCreated_at)).length;

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTab, selectedRole]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">

                </div>
                <button
                    onClick={() => { setIsEditing(false); setFormData({ username: "", name: "", email: "", phone: "", role: "user", password: "" }); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-2xl font-black uppercase tracking-[0.18em] transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <FiUserPlus /> Add New User
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/10 px-2 mt-2">
                <button
                    onClick={() => setSelectedTab("All")}
                    className={`pb-4 text-sm font-black transition-all relative flex items-center gap-2 ${selectedTab === "All" ? "text-white" : "text-slate-400 hover:text-white"}`}
                >
                    All Users
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "All" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300"}`}>
                        {users.length}
                    </span>
                    {selectedTab === "All" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
                </button>
                <button
                    onClick={() => setSelectedTab("New")}
                    className={`pb-4 text-sm font-black transition-all relative flex items-center gap-2 ${selectedTab === "New" ? "text-white" : "text-slate-400 hover:text-white"}`}
                >
                    New Users
                    {newUsersCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "New" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-300"}`}>
                            {newUsersCount}
                        </span>
                    )}
                    {selectedTab === "New" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
                </button>
            </div>


            {/* Table Container */}
            <div className="superadmin-card rounded-3xl overflow-hidden bg-slate-950/95 border border-white/10 shadow-2xl">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/95">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Find by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:bg-slate-800 focus:border-emerald-400/40 transition-all text-sm text-slate-100 placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:bg-slate-800 focus:border-emerald-400/40 transition-all text-sm font-bold text-slate-100 cursor-pointer appearance-none min-w-[140px]"
                            >
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {formatRoleLabel(role)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
                            <p className="text-xs uppercase tracking-[0.36em] text-slate-500">Total Users</p>
                            <p className="mt-3 text-3xl font-black text-white">{users.length}</p>
                            <p className="mt-2 text-sm text-slate-400">All registered users in the system.</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
                            <p className="text-xs uppercase tracking-[0.36em] text-slate-500">New Today</p>
                            <p className="mt-3 text-3xl font-black text-white">{newUsersCount}</p>
                            <p className="mt-2 text-sm text-slate-400">Users registered in the last 24 hours.</p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
                            <p className="text-xs uppercase tracking-[0.36em] text-slate-500">Current Filter</p>
                            <p className="mt-3 text-lg font-black text-white">{selectedTab} / {formatRoleLabel(selectedRole)}</p>
                            <p className="mt-2 text-sm text-slate-400">Use search and role filter to narrow results.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-12 text-center text-slate-300">
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-12 text-center">
                            <div className="mx-auto inline-flex max-w-xl flex-col items-center justify-center gap-3 rounded-[2rem] bg-slate-950 p-8">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                                    <FiSearch size={24} />
                                </div>
                                <p className="text-lg font-black text-white">No users found</p>
                                <p className="text-sm text-slate-400">Try adjusting the search query, selected tab, or role filter.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {currentItems.map((user) => (
                                <div key={user.id} className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-white/10 shadow-lg shadow-black/20">
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white">{user.name}</p>
                                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">ID {user.id}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">{user.status}</span>
                                            <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-slate-300">Joined {user.joined}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Email</p>
                                            <p className="mt-2 text-sm text-slate-200 break-all">{user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Phone</p>
                                            <p className="mt-2 text-sm text-slate-200">{user.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Role</p>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleQuickRoleUpdate(user.id, e.target.value, user)}
                                                className={`mt-2 w-full min-w-[180px] appearance-none rounded-full border border-white/10 bg-slate-900/90 px-3 py-2 text-[12px] font-black uppercase tracking-[0.25em] transition-all ${getRoleStyle(user.role)}`}
                                            >
                                                {roleOptions.filter((role) => role !== 'all').map((role) => (
                                                    <option key={role} value={role}>{formatRoleLabel(role)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-sm text-slate-400">
                                            <p className="font-black uppercase tracking-[0.28em] text-slate-500">Contact</p>
                                            <p className="mt-2">{user.email}</p>
                                            <p>{user.phone || 'No phone added'}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 px-4 text-sm font-black text-slate-300 transition hover:bg-emerald-500/10 hover:text-white"
                                            >
                                                <FiEdit2 className="mr-2" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 px-4 text-sm font-black text-slate-300 transition hover:bg-rose-500/10 hover:text-white"
                                            >
                                                <FiUserX className="mr-2" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/80">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} Users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="superadmin-card rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-slate-950 border border-white/10">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-slate-900/90">
                            <div>
                                <h2 className="text-xl font-black text-white">{isEditing ? 'Modify Domain Privileges' : 'Register New User'}</h2>
                                <p className="text-xs text-slate-400 mt-1">{isEditing ? `Updating permissions for ID: ${editUserId}` : 'Add a new user to your system'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="e.g. johndoe"
                                    className="w-full bg-slate-900 border border-white/10 text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    className="w-full bg-slate-900 border border-white/10 text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 8900"
                                    className="w-full bg-slate-900 border border-white/10 text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assign Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900 border border-white/10 text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium cursor-pointer"
                                >
                                        <option value="admin">admin</option>
                                    <option value="franchise">franchise</option>
                                    <option value="manager">manager</option>
                                    <option value="chef">chef</option>
                                    <option value="dealer">dealer</option>
                                    <option value="delivery_partner">delivery partner</option>
                                    <option value="user">user</option>
                                </select>
                            </div>
                            {!isEditing && (
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter a secure password"
                                        className="w-full bg-slate-900 border border-white/10 text-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-900/90 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-sm font-black text-slate-300 hover:text-white hover:bg-slate-800 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={submitLoading || !formData.username || !formData.email || (!isEditing && !formData.password)}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 text-sm font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                            >
                                {submitLoading ? "Processing..." : isEditing ? "Update Credentials" : "Register User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
