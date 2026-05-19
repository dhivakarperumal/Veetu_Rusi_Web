import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Bell, Send, Clock, Mail, MessageSquare } from "lucide-react";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Notifications & Broadcasts</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          Send Broadcast
        </button>
      </div>

      {/* History Log */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-700">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Notification Title</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Message Content</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Channel</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Dispatched Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#1B4D22] border border-slate-100">
                          {notif.type === "Email" ? (
                            <Mail className="w-4 h-4" />
                          ) : notif.type === "SMS" ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-black text-slate-800">{notif.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-600 max-w-xs truncate">{notif.message}</td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{notif.type}</td>
                    <td className="px-6 py-5">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        Dispatched
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No broadcast histories logged yet</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Dispatch Global Announcement</h3>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-1">Broadcast to all platform devices</p>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Broadcast Channel</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
                >
                  <option value="Push">Push Notification (App Alert)</option>
                  <option value="SMS">SMS Message (Mobile Number)</option>
                  <option value="Email">Email Announcement (Mail Server)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Notification Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traditional Biryani Feast Available Now!"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Notification Message</label>
                <textarea
                  required
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter detailed message contents or promotional coupons..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50/70 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Dispatch Now
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black text-xs uppercase tracking-widest rounded-xl transition"
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
