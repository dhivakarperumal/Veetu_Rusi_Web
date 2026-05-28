import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Search, ShieldAlert, ShieldCheck, Trash2, Users } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");

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

  const isActiveStatus = (status) => String(status).toLowerCase() === 'active';

  const getRoleStyle = (role) => {
    const r = String(role || 'user').toLowerCase();
    if (r === 'superadmin') return 'bg-purple-500/15 text-purple-300 border border-purple-500/25';
    if (r === 'admin') return 'bg-blue-500/15 text-blue-300 border border-blue-500/25';
    if (r === 'chef') return 'bg-orange-500/15 text-orange-300 border border-orange-500/25';
    if (r === 'franchise' || r === 'franchise admin') return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25';
    if (r === 'delivery_partner' || r === 'delivery partner') return 'bg-sky-500/15 text-sky-300 border border-sky-500/25';
    return 'bg-white/10 text-white/50 border border-white/10';
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
      toast.success(`User status changed successfully.`);
      fetchUsers();
    } catch {
      toast.error("Failed to change user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer account?")) return;
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">User Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Monitor registered customers, inspect account statistics, and block/suspend access
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex bg-[#0B1120]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
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
                    <td className="px-6 py-5" onDoubleClick={() => { setEditingRole(u.id); setNewRole(u.role || 'user'); }}>
                      {editingRole === u.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs w-24 outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleRoleChange(u.id)} className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">Save</button>
                          <button onClick={() => setEditingRole(null)} className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">Cancel</button>
                        </div>
                      ) : (
                        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getRoleStyle(u.role)}`}>
                          {u.role?.replace(/_/g, ' ') || 'user'}
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
                            <button
                              onClick={() => handleToggleStatus(u.id, u.active)}
                              className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
                              title="Block User"
                              disabled={updatingId === u.id}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.active)}
                              className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition"
                              title="Unblock User"
                              disabled={updatingId === u.id}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition"
                          title="Delete User"
                          disabled={updatingId === u.id}
                        >
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
    </div>
  );
};

export default UserManagement;
