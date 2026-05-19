import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Bell, Send, Search, Clock, Mail, MessageSquare, ShieldAlert } from "lucide-react";

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Notification form
  const [type, setType] = useState("Push");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/notifications");
      setNotifications(res.data);
    } catch (error) {
      toast.error("Failed to load notification logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/superadmin/notifications", { type, title, message });
      toast.success("Broadcast notification dispatched successfully.");
      setIsModalOpen(false);
      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to send notification.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Notifications & Broadcasts</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Dispatch announcements, push alerts, promotional SMS or email notifications to all users
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          Send Broadcast
        </button>
      </div>

      {/* History Log */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#070b13]/30">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Notification Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Message Content</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Channel</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Dispatched Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                          {notif.type === "Email" ? (
                            <Mail className="w-4 h-4" />
                          ) : notif.type === "SMS" ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-black text-white">{notif.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-white/60 max-w-xs truncate">{notif.message}</td>
                    <td className="px-6 py-5 text-xs font-bold text-emerald-400 uppercase tracking-widest">{notif.type}</td>
                    <td className="px-6 py-5">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Dispatched
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-white/40">
                      {new Date(notif.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-xs text-white/30 italic">
                      No broadcast histories logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleSubmit}
            className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Dispatch Global Announcement</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Broadcast to all platform devices</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Broadcast Channel</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 cursor-pointer"
                >
                  <option value="Push">Push Notification (App Alert)</option>
                  <option value="SMS">SMS Message (Mobile Number)</option>
                  <option value="Email">Email Announcement (Mail Server)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Notification Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traditional Biryani Feast Available Now!"
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Notification Message</label>
                <textarea
                  required
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter detailed message contents or promotional coupons..."
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 resize-none"
                ></textarea>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Dispatch Now
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
