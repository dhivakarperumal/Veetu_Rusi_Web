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
                    role: u.role ? u.role.toLowerCase() : 'user',
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
                role: u.role ? u.role.toLowerCase() : 'user',
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
        if (normalizedRole.includes("admin")) return "bg-slate-900 text-white shadow-sm";
        if (normalizedRole.includes("manager")) return "bg-indigo-50 text-indigo-600 border border-indigo-100";
        if (normalizedRole.includes("dealer")) return "bg-amber-50 text-amber-600 border border-amber-100";
        return "bg-emerald-50 text-emerald-600 border border-emerald-100"; // User / Customer
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
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

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
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    <FiUserPlus /> Add New User
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-100 px-2 mt-2">
                <button
                    onClick={() => setSelectedTab("All")}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${selectedTab === "All" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                    All Users
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "All" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
                        {users.length}
                    </span>
                    {selectedTab === "All" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
                <button
                    onClick={() => setSelectedTab("New")}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${selectedTab === "New" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                    New Users
                    {newUsersCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "New" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}>
                            {newUsersCount}
                        </span>
                    )}
                    {selectedTab === "New" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
            </div>


            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold text-gray-600 cursor-pointer appearance-none min-w-[140px]"
                            >
                                <option value="all">all roles</option>
                                <option value="admin">admin</option>
                                <option value="manager">manager</option>
                                <option value="dealer">dealer</option>
                                <option value="user">user</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Profile</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-gray-50 px-3 py-4 md:p-0">
                            {loading ? (
                                <tr className="block md:table-row">
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-bold block md:table-cell">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan="5" className="px-6 py-12 text-center block md:table-cell">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                <FiSearch size={24} />
                                            </div>
                                            <p className="text-gray-500 font-medium">No users found</p>
                                            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</span>
                                                <div className="flex items-center gap-3 text-right md:text-left">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                                                        <img src={user.avatar} alt={user.name} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {user.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</span>
                                                <div className="relative group/role">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleQuickRoleUpdate(user.id, e.target.value, user)}
                                                        className={`appearance-none cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent outline-none transition-all ${getRoleStyle(user.role)}`}
                                                    >
                                                        <option value="admin">admin</option>
                                                        <option value="manager">manager</option>
                                                        <option value="dealer">dealer</option>
                                                        <option value="user">user</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                    <span className="text-sm font-bold text-slate-700">{user.status}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 md:px-6 md:py-4 text-sm text-gray-500 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</span>
                                                <span>{user.joined}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell text-right md:text-right">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm md:shadow-none"
                                                        title="Edit User"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm md:shadow-none"
                                                        title="Delete User"
                                                    >
                                                        <FiUserX size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} Users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:bg-gray-100"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Modify Domain Privileges' : 'Register New User'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{isEditing ? `Updating permissions for ID: ${editUserId}` : 'Add a new user to your system'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="e.g. johndoe"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 8900"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Assign Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                                >
                                    <option value="admin">admin</option>
                                    <option value="manager">manager</option>
                                    <option value="dealer">dealer</option>
                                    <option value="user">user</option>
                                </select>
                            </div>
                            {!isEditing && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter a secure password"
                                        className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={submitLoading || !formData.username || !formData.email || (!isEditing && !formData.password)}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
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
