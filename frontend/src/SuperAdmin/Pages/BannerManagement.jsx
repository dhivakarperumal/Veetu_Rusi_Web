import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Image, Link as LinkIcon, Calendar } from "lucide-react";

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/banners");
      setBanners(res.data);
    } catch (error) {
      toast.error("Failed to load hero/offer banners.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please upload a banner image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("banner_title", title);
      formData.append("banner_image", selectedFile);
      formData.append("redirect_url", redirectUrl);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("status", "Active");

      await api.post("/superadmin/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Banner uploaded and published successfully.");
      setIsModalOpen(false);
      setTitle("");
      setRedirectUrl("");
      setStartDate("");
      setEndDate("");
      setSelectedFile(null);
      fetchBanners();
    } catch (error) {
      toast.error("Failed to publish banner.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this banner?")) return;
    try {
      await api.delete(`/superadmin/banners/${id}`);
      toast.success("Banner removed successfully.");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to delete banner.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Banner Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Configure homepage sliders, promotional campaign banners, and discount redirects
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-[#0B1120]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col justify-between shadow-xl group"
            >
              {/* Image Preview */}
              <div className="h-44 relative bg-slate-950 overflow-hidden">
                <img
                  src={`${import.meta.env.VITE_API_URL}/../uploads/banners/${banner.banner_image}`}
                  alt={banner.banner_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";
                  }}
                />
                <span className="absolute top-4 right-4 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase bg-emerald-600 text-white border border-white/10 shadow-lg">
                  {banner.status}
                </span>
              </div>

              {/* Banner Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-md font-black text-white truncate leading-none mb-1">
                    {banner.banner_title}
                  </h4>
                  {banner.redirect_url && (
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <LinkIcon className="w-3.5 h-3.5" />
                      {banner.redirect_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : "Always"}
                    </span>
                  </div>
                  <span>to</span>
                  <span>
                    {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : "Always"}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 pb-6 pt-4 border-t border-white/5 bg-[#070b13]/20">
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remove Banner
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-full bg-[#0B1120]/20 p-12 text-center rounded-[2.5rem] border border-white/5 border-dashed">
              <Image className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No active banners uploaded</p>
            </div>
          )}
        </div>
      )}

      {/* Add Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form
            onSubmit={handleSubmit}
            className="bg-[#0B1120] border border-white/5 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="bg-[#1B4D22] p-8 text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Upload Promotion Banner</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Publish hero slide or merchant offer</p>
            </div>
            <div className="p-8 space-y-6 text-white overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Banner Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Delivery on Home Food!"
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Banner Image Upload</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-white/5 file:text-white hover:file:bg-white/10"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Redirect URL / Target Path</label>
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="e.g. /shop or /chef/id"
                  className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase block mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#070b13]/60 border border-white/5 rounded-2xl outline-none font-medium text-white text-sm focus:border-emerald-500/30 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1B4D22] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
              >
                Publish Banner
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

export default BannerManagement;
