import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import { Search, ShieldAlert, ShieldCheck, Trash2, Users, UserCheck, UserX, Filter } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/users");
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (error) {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = users;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          (u.phone && u.phone.includes(lower))
      );
    }
    
    if (statusFilter === "Active") {
      result = result.filter((u) => String(u.active).toLowerCase() === 'active');
    } else if (statusFilter === "Blocked") {
      result = result.filter((u) => String(u.active).toLowerCase() !== 'active');
    }
    
    setFilteredUsers(result);
  }, [search, statusFilter, users]);

  const handleToggleStatus = async (id, currentActive) => {
    const nextActive = String(currentActive).toLowerCase() === 'active' ? 0 : 1;
    try {
      await api.patch(`/superadmin/users/status/${id}`, { active: nextActive });
      toast.success(`User status changed successfully.`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to change user status.");
    }
  };

  const getRoleStyle = (role) => {
    const r = String(role || 'user').toLowerCase();
    if (r === 'superadmin') return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (r === 'admin') return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (r === 'chef') return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (r === 'franchise' || r === 'franchise admin') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    if (r === 'delivery_partner' || r === 'delivery partner') return 'bg-sky-100 text-sky-700 border border-sky-200';
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  const handleRoleChange = async (id) => {
    try {
      await api.patch(`/superadmin/users/role/${id}`, { role: newRole });
      toast.success("User role updated successfully.");
      setEditingRole(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer account?")) return;
    try {
      await api.delete(`/superadmin/users/${id}`);
      toast.success("User account deleted.");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user account.");
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Toaster position="top-right" />

      {/* Page Title */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">User Management</h2>
      </div>

      {/* Dark Premium Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
            onClick={() => setStatusFilter('All')}
            className="group relative overflow-hidden rounded-2xl bg-[#131127] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#2a264a]"
        >
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-600 shadow-lg text-white">
                    <Users className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Users</p>
                    <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : users.length}</h3>
                    <p className="text-[10px] text-indigo-400 mt-1">All registered customers</p>
                </div>
            </div>
        </div>

        <div 
            onClick={() => setStatusFilter('Active')}
            className="group relative overflow-hidden rounded-2xl bg-[#0a1e17] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#143d2f]"
        >
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500 shadow-lg text-white">
                    <UserCheck className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Active Users</p>
                    <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : users.filter(u => String(u.active).toLowerCase() === 'active').length}</h3>
                    <p className="text-[10px] text-emerald-400 mt-1">Customers with full access</p>
                </div>
            </div>
        </div>

        <div 
            onClick={() => setStatusFilter('Blocked')}
            className="group relative overflow-hidden rounded-2xl bg-[#26150c] p-6 shadow-xl cursor-pointer transition-transform hover:-translate-y-1 border border-[#4d2a18]"
        >
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-rose-500/20 blur-2xl transition-transform duration-500 group-hover:scale-150"></div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-rose-500 shadow-lg text-white">
                    <UserX className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">Blocked Users</p>
                    <h3 className="mt-1 text-3xl font-black text-white">{loading ? '-' : users.filter(u => String(u.active).toLowerCase() !== 'active').length}</h3>
                    <p className="text-[10px] text-rose-400 mt-1">Suspended or blocked</p>
                </div>
            </div>
        </div>
      </div>

      {/* Filter & Search Bar Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm mt-8">
          <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                  <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl px-5 py-3.5 pr-10 outline-none cursor-pointer focus:border-blue-400 transition-colors"
                  >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Blocked">Blocked</option>
                  </select>
                  <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
              </div>
              
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button className="p-2.5 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </button>
              </div>
          </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
              {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2a3042] rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Users...</p>
                  </div>
              ) : (
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-[#2a3042]">
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Customer Name</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Email Address</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Phone / Mobile</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Role</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">Registered Date</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Status</th>
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredUsers.length > 0 ? (
                              filteredUsers.map((u) => (
                                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-5">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                                                  <Users className="w-4 h-4" />
                                              </div>
                                              <span className="text-sm font-black text-slate-800">{u.name}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-5">
                                          <p className="text-sm font-bold text-slate-600">{u.email}</p>
                                      </td>
                                      <td className="px-6 py-5">
                                          <p className="text-sm font-bold text-slate-600">{u.phone || "N/A"}</p>
                                      </td>
                                      <td className="px-6 py-5" onDoubleClick={() => { setEditingRole(u.id); setNewRole(u.role || 'user'); }}>
                                          {editingRole === u.id ? (
                                              <div className="flex gap-2">
                                                  <input
                                                      type="text"
                                                      value={newRole}
                                                      onChange={(e) => setNewRole(e.target.value)}
                                                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 text-xs w-28 outline-none focus:border-blue-400"
                                                      autoFocus
                                                  />
                                                  <button onClick={() => handleRoleChange(u.id)} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-emerald-200 hover:bg-emerald-200">Save</button>
                                                  <button onClick={() => setEditingRole(null)} className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-rose-200 hover:bg-rose-200">Cancel</button>
                                              </div>
                                          ) : (
                                              <span className={`inline-block text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${getRoleStyle(u.role)}`}>
                                                  {u.role?.replace(/_/g, ' ') || 'user'}
                                              </span>
                                          )}
                                      </td>
                                      <td className="px-6 py-5">
                                          <p className="text-sm font-bold text-slate-500">
                                            {new Date(u.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                                          </p>
                                      </td>
                                      <td className="px-6 py-5 text-center">
                                          <span
                                              className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                                                  String(u.active).toLowerCase() === 'active'
                                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                      : "bg-rose-100 text-rose-700 border border-rose-200"
                                              }`}
                                          >
                                              {u.active || "Unknown"}
                                          </span>
                                      </td>
                                      <td className="px-6 py-5">
                                          <div className="flex items-center justify-center gap-3">
                                              {String(u.active).toLowerCase() === 'active' ? (
                                                  <button
                                                      onClick={() => handleToggleStatus(u.id, u.active)}
                                                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                                      title="Block User"
                                                  >
                                                      <ShieldAlert size={16} />
                                                  </button>
                                              ) : (
                                                  <button
                                                      onClick={() => handleToggleStatus(u.id, u.active)}
                                                      className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl transition-colors border border-transparent hover:border-emerald-100"
                                                      title="Unblock User"
                                                  >
                                                      <ShieldCheck size={16} />
                                                  </button>
                                              )}
                                              <button
                                                  onClick={() => handleDelete(u.id)}
                                                  className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                                  title="Delete User"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan="7" className="px-6 py-24 text-center">
                                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                          <Users size={28} />
                                      </div>
                                      <h3 className="text-sm font-bold text-slate-700">No Customers Found</h3>
                                      <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search query.</p>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              )}
          </div>
      </div>
    </div>
  );
};

export default UserManagement;
