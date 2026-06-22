import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search, ShieldAlert, ShieldCheck, Trash2, Users,
  UserPlus, X, Eye, EyeOff, RefreshCw, CheckCircle2
} from "lucide-react";

const ROLES = ["user", "admin", "superadmin", "chef", "franchise", "delivery_partner"];

const defaultForm = {
  full_name: "",
  email: "",
  mobile_number: "",
  password: "",
  role: "user",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  const isActiveStatus = (status) => String(status).toLowerCase() === "active";

  const getRoleStyle = (role) => {
    const r = String(role || "user").toLowerCase();
    if (r === "superadmin") return "bg-purple-500/15 text-purple-300 border border-purple-500/25";
    if (r === "admin") return "bg-blue-500/15 text-blue-300 border border-blue-500/25";
    if (r === "chef") return "bg-orange-500/15 text-orange-300 border border-orange-500/25";
    if (r === "franchise" || r === "franchise admin") return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25";
    if (r === "delivery_partner" || r === "delivery partner") return "bg-sky-500/15 text-sky-300 border border-sky-500/25";
    return "bg-white/10 text-white/50 border border-white/10";
  };

  const filteredUsers = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        (u.phone && u.phone.includes(lower)) ||
        (u.role && u.role.toLowerCase().includes(lower))
    );
  }, [search, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentActive) => {
    const nextActive = isActiveStatus(currentActive) ? 0 : 1;
    try {
      setUpdatingId(id);
      await api.patch(`/superadmin/users/status/${id}`, { active: nextActive });
      toast.success("User status changed successfully.");
      fetchUsers();
    } catch {
      toast.error("Failed to change user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/superadmin/users/${id}`);
      toast.success("User account deleted.");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user account.");
    }
  };

  const handleRoleChange = async (id) => {
    try {
      setUpdatingId(id);
      await api.patch(`/superadmin/users/role/${id}`, { role: newRole });
      toast.success("User role updated successfully.");
      setEditingRole(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Generate random strong password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#!";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, password: pass }));
    setShowPassword(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Name, email and password are required.");
      return;
    }
    try {
      setCreating(true);
      const res = await api.post("/superadmin/users", form);
      setCreatedUser({ ...form, user_id: res.data.user_id });
      toast.success("User created successfully!");
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setForm(defaultForm);
    setCreatedUser(null);
    setShowPassword(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">User Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Monitor registered customers, inspect account statistics, and block/suspend access
          </p>
        </div>
        <button
          onClick={() => { setCreatedUser(null); setForm(defaultForm); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Customer Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Email Address</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Phone / Mobile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Registered Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{u.email}</td>
                    <td className="px-6 py-5 text-sm font-bold text-white/60">{u.phone || "N/A"}</td>
                    <td className="px-6 py-5" onDoubleClick={() => { setEditingRole(u.id); setNewRole(u.role || "user"); }}>
                      {editingRole === u.id ? (
                        <div className="flex gap-2 items-center">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-[#070b13] border border-white/20 rounded-lg px-2 py-1 text-white text-xs outline-none"
                            autoFocus
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleRoleChange(u.id)} className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">Save</button>
                          <button onClick={() => setEditingRole(null)} className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">✕</button>
                        </div>
                      ) : (
                        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer ${getRoleStyle(u.role)}`}>
                          {u.role?.replace(/_/g, " ") || "user"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-white/40">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const isActive = isActiveStatus(u.active);
                        return (
                          <button
                            type="button"
                            onDoubleClick={() => handleToggleStatus(u.id, u.active)}
                            disabled={updatingId === u.id}
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15"
                                : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15"
                            }`}
                            title="Double click to toggle status"
                          >
                            {updatingId === u.id ? "Updating..." : u.active}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const isActive = isActiveStatus(u.active);
                          return isActive ? (
                            <button onClick={() => handleToggleStatus(u.id, u.active)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition" title="Block User" disabled={updatingId === u.id}>
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleToggleStatus(u.id, u.active)} className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition" title="Unblock User" disabled={updatingId === u.id}>
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          );
                        })()}
                        <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition" title="Delete User" disabled={updatingId === u.id}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No customer accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Right-Side Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-[#0a0f1e] border-l border-white/10 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#070b13]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Create New User</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Login credentials will be set immediately</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="p-2 hover:bg-white/5 text-white/40 hover:text-white rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6">
              {createdUser ? (
                /* Success State */
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-10">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">User Created!</h4>
                    <p className="text-xs text-white/40 mt-1">Save these credentials — password won't be shown again</p>
                  </div>

                  {/* Credentials Card */}
                  <div className="w-full bg-[#070b13] border border-white/10 rounded-2xl p-5 text-left space-y-3">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Full Name</p>
                      <p className="text-sm font-bold text-white mt-0.5">{createdUser.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Email (Username)</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{createdUser.email}</p>
                    </div>
                    {createdUser.mobile_number && (
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Mobile</p>
                        <p className="text-sm font-bold text-white mt-0.5">{createdUser.mobile_number}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Password</p>
                      <p className="text-sm font-black text-yellow-400 mt-0.5 font-mono tracking-widest">{createdUser.password}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Role</p>
                      <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider mt-0.5 ${getRoleStyle(createdUser.role)}`}>
                        {createdUser.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">User ID</p>
                      <p className="text-xs font-mono text-white/60 mt-0.5">{createdUser.user_id}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => { setCreatedUser(null); setForm(defaultForm); setShowPassword(false); }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 transition"
                    >
                      Create Another
                    </button>
                    <button
                      onClick={closeDrawer}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleCreateUser} className="space-y-5">

                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. Dhivakar Perumal"
                      className="w-full px-4 py-3 bg-[#070b13]/80 border border-white/10 rounded-xl text-white text-sm font-medium outline-none focus:border-emerald-500/40 transition placeholder-white/20"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 bg-[#070b13]/80 border border-white/10 rounded-xl text-white text-sm font-medium outline-none focus:border-emerald-500/40 transition placeholder-white/20"
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      value={form.mobile_number}
                      onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value }))}
                      placeholder="9876543210"
                      className="w-full px-4 py-3 bg-[#070b13]/80 border border-white/10 rounded-xl text-white text-sm font-medium outline-none focus:border-emerald-500/40 transition placeholder-white/20"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Role *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, role: r }))}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition ${
                            form.role === r
                              ? getRoleStyle(r) + " scale-[1.03]"
                              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          {r.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Password *</label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition"
                      >
                        <RefreshCw className="w-3 h-3" /> Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 pr-12 bg-[#070b13]/80 border border-white/10 rounded-xl text-white text-sm font-medium outline-none focus:border-emerald-500/40 transition placeholder-white/20 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.password && (
                      <p className="text-[10px] text-white/30 mt-1.5 font-mono px-1">
                        Strength: {form.password.length < 8 ? "🔴 Weak" : form.password.length < 12 ? "🟡 Medium" : "🟢 Strong"}
                      </p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
                    <p className="text-[10px] text-blue-300/70 font-bold leading-relaxed">
                      💡 The user can log in immediately with these credentials. Make sure to share the password securely — it is hashed and cannot be recovered later.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Create User</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
