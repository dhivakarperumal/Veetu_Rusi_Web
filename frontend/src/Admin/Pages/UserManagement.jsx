import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import { Search, ShieldAlert, ShieldCheck, Trash2, Users, UserCheck, UserX, Filter, Plus, Edit2, X, List, LayoutGrid } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [formData, setFormData] = useState({ id: null, name: "", email: "", phone: "", role: "user", password: "" });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: null, name: "", email: "", phone: "", role: "user", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setFormData({ id: user.id, name: user.name, email: user.email, phone: user.phone || "", role: user.role || "user", password: "" });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await api.post("/admin/users", formData);
        toast.success("User added successfully.");
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/users/${formData.id}`, payload);
        toast.success("User updated successfully.");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch {
      toast.error(`Failed to ${modalMode} user.`);
    }
  };

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(lower) ||
          (u.email || "").toLowerCase().includes(lower) ||
          (u.phone && u.phone.includes(lower))
      );
    }

    if (roleFilter !== "All") {
      result = result.filter((u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter === "Active") {
      result = result.filter((u) => String(u.active).toLowerCase() === 'active');
    } else if (statusFilter === "Blocked") {
      result = result.filter((u) => String(u.active).toLowerCase() !== 'active');
    }

    return result;
  }, [search, statusFilter, roleFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((currentPageIndex - 1) * itemsPerPage, currentPageIndex * itemsPerPage);

  const handleToggleStatus = async (id, currentActive) => {
    const nextActive = String(currentActive).toLowerCase() === 'active' ? 0 : 1;
    try {
      await api.patch(`/admin/users/status/${id}`, { active: nextActive });
      toast.success(`User status changed successfully.`);
      fetchUsers();
    } catch {
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
      await api.patch(`/admin/users/role/${id}`, { role: newRole });
      toast.success("User role updated successfully.");
      setEditingRole(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user role.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer account?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User account deleted.");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user account.");
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Toaster position="top-right" />

      {/* Page Title */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">User Management</h2>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
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

      {/* Toolbar: Search on Left, View Mode Switcher on Right */}
      <div className="admin-reference-toolbar flex flex-col md:flex-row md:items-center justify-between gap-4 superadmin-panel p-4 rounded-xl">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl outline-none font-medium text-slate-100 text-sm focus:bg-slate-900 focus:border-emerald-600/40 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Right: Filters & View toggle mode */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-100 focus:bg-slate-900 focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
            <option value="chef">Chef</option>
            <option value="franchise">Franchise</option>
            <option value="delivery_partner">Delivery Partner</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-100 focus:bg-slate-900 focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>

          <div data-admin-view-toggle className="admin-view-toggle flex bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${viewMode === "table"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-700"
                }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${viewMode === "card"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-700"
                }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
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
                              <th className="px-6 py-5 text-xs font-black text-white uppercase tracking-wider">S.No</th>
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
                              paginatedUsers.map((u, index) => (
                                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-5">
                                          <span className="text-sm font-bold text-slate-500">{index + 1 + (currentPage - 1) * itemsPerPage}</span>
                                      </td>
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
                                                  onClick={() => openEditModal(u)}
                                                  className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                                                  title="Edit User"
                                              >
                                                  <Edit2 size={16} />
                                              </button>
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
                                  <td colSpan="8" className="px-6 py-24 text-center">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedUsers.map((u) => (
            <div
              key={u.id}
              className="bg-slate-950/90 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-2xl transition-all duration-200 hover:shadow-2xl/40 text-white"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{u.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      String(u.active).toLowerCase() === 'active'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {u.active || "Unknown"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>
                    <strong className="text-slate-300">Phone:</strong> {u.phone || "N/A"}
                  </p>
                  <p>
                    <strong className="text-slate-300">Role:</strong>{" "}
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getRoleStyle(u.role)}`}>
                      {u.role?.replace(/_/g, ' ') || 'user'}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-300">Registered:</strong>{" "}
                    {new Date(u.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-white/10">
                {String(u.active).toLowerCase() === 'active' ? (
                  <button
                    onClick={() => handleToggleStatus(u.id, u.active)}
                    className="p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-200 rounded-lg transition"
                    title="Block User"
                  >
                    <ShieldAlert size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(u.id, u.active)}
                    className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-200 rounded-lg transition"
                    title="Unblock User"
                  >
                    <ShieldCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(u)}
                  className="p-1.5 hover:bg-slate-800/70 text-slate-300 hover:text-white rounded-lg transition"
                  title="Edit User"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-200 rounded-lg transition"
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {paginatedUsers.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs italic">
              No users match your criteria.
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
          <div className="text-slate-600 text-xs font-semibold">
              Showing {paginatedUsers.length > 0 ? (Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)) : 0} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} customers
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <label htmlFor="itemsPerPage" className="uppercase tracking-[0.18em] font-bold">Rows</label>
                  <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs outline-none focus:border-emerald-500"
                  >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                  </select>
              </div>

              <div className="inline-flex items-center rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-slate-600 text-xs font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 hover:bg-slate-50"
                  >
                      Prev
                  </button>
                  <div className="px-4 py-2 text-slate-700 text-xs font-bold uppercase tracking-[0.18em] bg-slate-50">
                      Page {currentPage} of {totalPages}
                  </div>
                  <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-slate-600 text-xs font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 hover:bg-slate-50"
                  >
                      Next
                  </button>
              </div>
          </div>
      </div>

      {/* User Form Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {modalMode === "add" ? "Register New User" : "Edit User"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {modalMode === "add" ? "Add a new user to your system" : "Update user details"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. johndoe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Role *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700 appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="chef">Chef</option>
                  <option value="franchise">Franchise</option>
                  <option value="delivery_partner">Delivery Partner</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password {modalMode === "add" && "*"}</label>
                <input
                  required={modalMode === "add"}
                  type="password"
                  placeholder={modalMode === "add" ? "Enter a secure password" : "Leave blank to keep unchanged"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium text-slate-700"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors"
                >
                  {modalMode === "add" ? "Register User" : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;
