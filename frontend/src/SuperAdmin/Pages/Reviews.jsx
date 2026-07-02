import { useState, useEffect, useContext } from "react";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  Star,
  Search,
  Filter,
  MoreVertical,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  User,
  Trash2,
  Send,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Package,
  ArrowUpRight,
  Reply,
  X,
  Plus,
  Camera,
  Upload
} from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

const Reviews = () => {
  const { reviewsCache, setReviewsCache } = useAdmin();
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedFranchiseAdmin, setSelectedFranchiseAdmin] = useState("");
  const [selectedFranchiseAdminLabel, setSelectedFranchiseAdminLabel] = useState("");
  const [franchiseAdmins, setFranchiseAdmins] = useState([]);

  const currentCacheKey = `${filter}-${selectedRating}-${searchQuery}-${selectedFranchiseAdmin}-${selectedFranchiseAdminLabel}`;
  const cachedData = reviewsCache[currentCacheKey];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [reviews, setReviews] = useState(cachedData?.reviews || []);
  const [stats, setStats] = useState(cachedData?.stats || null);
  const [loading, setLoading] = useState(!cachedData);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);

  // Add Review State
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    product_id: "",
    user_name: "",
    user_email: "",
    rating: 5,
    comment: "",
    review_image: null
  });

  const [showDeliveryReviewModal, setShowDeliveryReviewModal] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedDeliveryPartnerId, setSelectedDeliveryPartnerId] = useState("");
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryComment, setDeliveryComment] = useState("");
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const cacheKey = `${filter}-${selectedRating}-${searchQuery}-${selectedFranchiseAdmin}-${selectedFranchiseAdminLabel}`;
      if (!reviewsCache[cacheKey]) setLoading(true);

      const params = {};
      if (filter !== "All") params.status = filter;
      if (selectedRating) params.rating = selectedRating;
      if (searchQuery) params.search = searchQuery;
      if (selectedFranchiseAdmin) {
        params.franchise_admin_id = selectedFranchiseAdmin;
        if (selectedFranchiseAdminLabel) params.franchise_admin_name = selectedFranchiseAdminLabel;
      }

      const res = await api.get("/reviews/admin/all", { params });
      const fetchedReviews = res.data.reviews || [];
      const filteredReviews = fetchedReviews.filter((review) => {
        const matchesId = selectedFranchiseAdmin && String(review.franchise_admin_id) === String(selectedFranchiseAdmin);
        const matchesName = selectedFranchiseAdminLabel && String(review.franchise_admin_name || "").toLowerCase().includes(selectedFranchiseAdminLabel.toLowerCase());
        return selectedFranchiseAdmin ? matchesId || matchesName : true;
      });
      const data = { reviews: filteredReviews, stats: res.data.stats || null };
      setReviews(data.reviews);
      setStats(data.stats);
      setReviewsCache(prev => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // fetch delivery partner reviews for superadmin tab
  const [deliveryTab, setDeliveryTab] = useState(false);
  const [deliveryReviews, setDeliveryReviews] = useState([]);
  const fetchDeliveryReviews = async () => {
    try {
      const params = {};
      if (filter !== "All") params.status = filter;
      if (selectedRating) params.rating = selectedRating;
      if (searchQuery) params.search = searchQuery;
      if (selectedFranchiseAdmin) {
        params.franchise_admin_id = selectedFranchiseAdmin;
        if (selectedFranchiseAdminLabel) params.franchise_admin_name = selectedFranchiseAdminLabel;
      }

      const res = await api.get('/delivery-partner-review', { params });
      const fetchedReviews = (res.data && res.data.data) || [];
      const filteredReviews = fetchedReviews.filter((review) => {
        const matchesId = selectedFranchiseAdmin && String(review.franchise_admin_id) === String(selectedFranchiseAdmin);
        const matchesName = selectedFranchiseAdminLabel && String(review.franchise_admin_name || "").toLowerCase().includes(selectedFranchiseAdminLabel.toLowerCase());
        return selectedFranchiseAdmin ? matchesId || matchesName : true;
      });
      setDeliveryReviews(filteredReviews);
    } catch (err) {
      console.error('Failed to fetch delivery reviews:', err);
    }
  };

  const fetchFranchiseAdmins = async () => {
    try {
      const res = await api.get('/superadmin/franchises');
      const admins = Array.isArray(res.data) ? res.data : res.data?.franchises || [];
      setFranchiseAdmins(admins.filter((franchise) => franchise?.franch_user_id || franchise?.id));
    } catch (err) {
      console.error('Failed to fetch franchise admins:', err);
      setFranchiseAdmins([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  useEffect(() => {
    const handleFetch = async () => {
      if (deliveryTab) await fetchDeliveryReviews();
      else await fetchReviews();
    };

    const timer = setTimeout(handleFetch, 250);
    return () => clearTimeout(timer);
  }, [filter, selectedRating, selectedFranchiseAdmin, searchQuery, deliveryTab]);

  useEffect(() => {
    fetchFranchiseAdmins();
  }, []);

  // Active reviews source based on tab
  const activeReviews = deliveryTab ? deliveryReviews : reviews;
  const paginatedReviews = activeReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(activeReviews.length / itemsPerPage);

  useEffect(() => {
    if (showAddModal) fetchProducts();
  }, [showAddModal]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (deliveryTab) fetchDeliveryReviews();
      else fetchReviews();
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, deliveryTab]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/reviews/admin/${id}/status`, { status });
      toast.success(`Review ${status.toLowerCase()} successfully`);
      fetchReviews();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const handleReply = async (id, isDelivery = false) => {
    if (!replyText.trim()) return;
    try {
      if (isDelivery) {
        await api.put(`/delivery-partner-review/reply/${id}`, { admin_reply: replyText });
      } else {
        await api.put(`/reviews/admin/${id}/reply`, { admin_reply: replyText });
      }
      toast.success("Reply added");
      setReplyText("");
      setActiveReplyId(null);
      if (isDelivery) fetchDeliveryReviews();
      else fetchReviews();
    } catch (err) {
      toast.error("Failed to add reply");
    }
  };

  const handleSubmitNewReview = async (e) => {
    e.preventDefault();
    if (!newReview.product_id || !newReview.user_name || !newReview.comment) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/reviews", newReview);
      toast.success("Review created successfully");
      setShowAddModal(false);
      setNewReview({
        product_id: "",
        user_name: "",
        user_email: "",
        rating: 5,
        comment: "",
        review_image: null
      });
      fetchReviews();
    } catch (err) {
      console.error("Failed to create review:", err);
      toast.error(err.response?.data?.message || "Failed to create review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReview({ ...newReview, review_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const res = await api.get("/user-food-orders/delivery-partners/active");
      setDeliveryPartners(res.data || []);
    } catch (err) {
      console.error("Failed to fetch delivery partners:", err);
      toast.error("Unable to load delivery partners");
    }
  };

  const closeDeliveryReviewModal = () => {
    setShowDeliveryReviewModal(false);
    setSelectedDeliveryPartnerId("");
    setDeliveryRating(5);
    setDeliveryComment("");
    setDeliveryImage(null);
  };

  const submitDeliveryReview = async (e) => {
    e.preventDefault();

    if (!selectedDeliveryPartnerId) {
      toast.error("Please select a delivery partner.");
      return;
    }

    if (!deliveryRating) {
      toast.error("Please select a rating.");
      return;
    }

    setDeliverySubmitting(true);

    try {
      const partner = deliveryPartners.find((partner) =>
        String(partner.user_id) === String(selectedDeliveryPartnerId) ||
        String(partner.id) === String(selectedDeliveryPartnerId) ||
        String(partner.delivery_partner_user_id) === String(selectedDeliveryPartnerId) ||
        String(partner.delivery_partner_id) === String(selectedDeliveryPartnerId)
      ) || {};

      const formData = new FormData();
      formData.append("user_id", user?.user_id || user?.id || "");
      formData.append("user_name", user?.name || user?.username || user?.email || "Admin");
      formData.append("user_email", user?.email || "");
      formData.append("rating", deliveryRating);
      formData.append("comment", deliveryComment);
      formData.append("delivery_partner_id", selectedDeliveryPartnerId);
      formData.append("delivery_partner_name", partner.name || partner.full_name || partner.partner_name || partner.delivery_partner_name || "");
      formData.append("delivery_partner_phone", partner.mobile || partner.phone || "");
      formData.append("delivery_partner_email", partner.email || "");
      formData.append("created_by", user?.user_id || user?.id || "");
      formData.append("updated_by", user?.user_id || user?.id || "");
      if (deliveryImage) {
        formData.append("image", deliveryImage);
      }

      await api.post("/delivery-partner-review", formData);
      toast.success("Delivery partner review submitted successfully.");
      closeDeliveryReviewModal();
      fetchDeliveryReviews();
    } catch (err) {
      console.error("Failed to submit delivery review:", err);
      toast.error(err.response?.data?.message || "Failed to submit delivery review.");
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Published": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Pending": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Flagged": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedRating, searchQuery, selectedFranchiseAdmin]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{stats?.total_reviews || 0}</p>
              </div>
            </div>

            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Rating</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{stats?.average_rating || 0}</p>
              </div>
            </div>

            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{stats?.pending_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-6" /> Add Review
          </button>

          <button
            onClick={() => {
              setShowDeliveryReviewModal(true);
              if (!deliveryPartners.length) fetchDeliveryPartners();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-6" /> Add Delivery Partner Review
          </button>

          {/* STATS MINI CARDS */}

        </div>
      </div>

      {/* Tabs: Food vs Delivery Partner */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => { setDeliveryTab(false); fetchReviews(); }}
          className={`px-4 py-2 rounded ${!deliveryTab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
          Food Reviews
        </button>
        <button
          onClick={() => { setDeliveryTab(true); fetchDeliveryReviews(); }}
          className={`px-4 py-2 rounded ${deliveryTab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
          Delivery Partner Reviews
        </button>
      </div>

      {/* FILTERS AND SEARCH BAR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {["All", "Pending", "Published", "Flagged"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${filter === s
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="xl:col-span-4 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search reviews, products or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full min-h-[56px] bg-white border border-slate-100 rounded-2xl pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="xl:col-span-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(selectedRating === r ? null : r)}
              className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all
                 ${selectedRating === r
                  ? "bg-amber-500 text-white"
                  : "text-slate-400 hover:bg-slate-50"}`}
            >
              <span className="text-xs font-black">{r}</span>
              <Star className={`w-3 h-3 ${selectedRating === r ? "fill-white" : ""}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-12 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Franchise Admin</label>
          <select
            value={selectedFranchiseAdmin}
            onChange={(e) => {
              setSelectedFranchiseAdmin(e.target.value);
              setSelectedFranchiseAdminLabel(e.target.selectedOptions[0]?.dataset?.name || "");
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
          >
            <option value="" data-name="">All franchise admins</option>
            {franchiseAdmins.map((admin) => {
              const label = admin.owner_name || admin.franchise_name || admin.full_name || admin.name || admin.email || `Franchise ${admin.id || ''}`;
              return (
                <option
                  key={admin.id || admin.franch_user_id}
                  value={admin.franch_user_id || admin.id}
                  data-name={label}
                >
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* REVIEWS GRID */}
      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Synchronizing Feedback...</p>
        </div>
      ) : activeReviews.length === 0 ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-2">
            <MessageSquare className="w-10 h-10" />
          </div>
          <p className="text-slate-900 font-black text-lg">No reviews found</p>
          <p className="text-slate-400 text-sm font-medium">Try adjusting your filters or search query</p>
          <button
            onClick={() => { setFilter("All"); setSelectedRating(null); setSearchQuery(""); }}
            className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedReviews.map((item) => {
            if (deliveryTab) {
              return (
                <div
                  key={`dp-${item.id}`}
                  className="group relative bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm transition hover:shadow-xl hover:-translate-y-1 duration-300"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-lg font-black">
                          {item.delivery_partner_name?.charAt(0).toUpperCase() || item.delivery_partner_id?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {item.delivery_partner_name || item.delivery_partner_id || 'Delivery Partner'}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.delivery_partner_phone || item.delivery_partner_email || 'No contact available'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-500">{item.rating || '0'}</div>
                        <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                          {item.status || 'Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Reviewer</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.user_name || item.user_email || 'Anonymous'}
                      </p>
                      {item.user_email && <p className="text-xs text-slate-500 truncate">{item.user_email}</p>}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-4">
                        "{item.comment || 'No comment provided.'}"
                      </p>

                      {item.image && (
                        <div className="relative h-44 rounded-[1.5rem] overflow-hidden border border-slate-100">
                          <img
                            src={item.image}
                            alt="Delivery review"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500">
                          <div className="space-y-1">
                            <p className="font-black uppercase tracking-[0.2em]">Submitted</p>
                            <p>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-black uppercase tracking-[0.2em]">Partner ID</p>
                            <p className="truncate">{item.delivery_partner_id || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="mt-4 text-[11px] text-slate-500">
                          <p className="font-black uppercase tracking-[0.2em]">Franchise Admin</p>
                          <p>{item.franchise_admin_name || 'Not assigned'}</p>
                        </div>

                        {item.admin_reply && (
                        <div className="rounded-3xl bg-blue-50 border border-blue-100 p-4 text-[11px] text-slate-600">
                          <p className="font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Official Reply</p>
                          <p>{item.admin_reply}</p>
                        </div>
                      )}

                        <button
                          type="button"
                          onClick={() => setActiveReplyId(activeReplyId === item.id ? null : item.id)}
                          className={`w-full mt-3 rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition ${
                            activeReplyId === item.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#0b0d10] text-slate-300 border-slate-800 hover:bg-[#0f1216]'
                          }`}
                        >
                          <Reply className="inline-block w-4 h-4 mr-2" />
                          {activeReplyId === item.id ? 'Cancel reply' : 'Reply'}
                        </button>

                        {activeReplyId === item.id && (
                          <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Official Reply</span>
                              <button onClick={() => setActiveReplyId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              placeholder="Type response..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="flex-1 w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-700 resize-none mb-4"
                            />
                            <button
                              onClick={() => handleReply(item.id, true)}
                              disabled={!replyText.trim()}
                              className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Send className="w-3 h-3" /> Send Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`group relative bg-white rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1
                  ${item.status === 'Pending' ? 'ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/5' : ''}`}
              >
                {/* Header: User & Rating */}
                <div className="p-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-sm font-black shadow-lg">
                        {item.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm truncate w-24">{item.user_name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < item.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Body: Comment & Product */}
                <div className="flex-1 px-6 space-y-4">
                  <div className="relative">
                    <p className="text-sm font-semibold text-slate-600 italic leading-relaxed line-clamp-4 min-h-[5rem]">
                      "{item.comment}"
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                        <p className="text-[10px] font-black text-slate-700 truncate">
                          {item.product_name || "Product Deleted"}
                        </p>
                      </div>
                      {item.product_id && (
                        <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                          ID: {item.product_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.review_image && (
                    <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-100 group/img">
                      <img
                        src={item.review_image}
                        alt="Review"
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <ArrowUpRight className="text-white w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {item.admin_reply && (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 relative">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Official Reply</p>
                      <p className="text-[11px] font-medium text-slate-500 italic leading-snug line-clamp-2">
                        {item.admin_reply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Actions */}
                <div className="p-4 mt-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Franchise Admin</span>
                    <span className="text-[12px] font-bold text-slate-700">{item.franchise_admin_name || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.status !== "Published" && (
                      <button
                        onClick={() => handleStatusUpdate(item.id, "Published")}
                        title="Approve"
                        className="p-2.5 bg-white text-emerald-500 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {item.status !== "Flagged" && (
                      <button
                        onClick={() => handleStatusUpdate(item.id, "Flagged")}
                        title="Flag"
                        className="p-2.5 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveReplyId(activeReplyId === item.id ? null : item.id)}
                      title="Reply"
                      className={`p-2.5 rounded-xl border transition-all shadow-sm
                        ${activeReplyId === item.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white"}`}
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* REPLY OVERLAY */}
                {activeReplyId === item.id && (
                  <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col animate-in slide-in-from-bottom-full duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Official Reply</span>
                      <button onClick={() => setActiveReplyId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      placeholder="Type response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-700 resize-none mb-4"
                    />
                    <button
                      onClick={() => handleReply(item.id)}
                      disabled={!replyText.trim()}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3 h-3" /> Send Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>

          <span className="text-sm font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 italic">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}></div>

          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Create Manual Review</h2>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Admin Control Panel</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitNewReview} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Product *</label>
                  <select
                    required
                    value={newReview.product_id}
                    onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm font-semibold transition-all"
                  >
                    <option value="">Select a Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Customer Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newReview.user_name}
                    onChange={(e) => setNewReview({ ...newReview, user_name: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newReview.user_email}
                    onChange={(e) => setNewReview({ ...newReview, user_email: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm font-semibold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Customer Rating</label>
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${star <= newReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-black text-slate-400 uppercase">{newReview.rating} Stars</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Review Comment *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Write the customer's feedback here..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm font-semibold transition-all resize-none"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Review Image (Optional)</label>
                <div className="relative group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover:bg-blue-50/30 group-hover:border-blue-200 transition-all">
                    {newReview.review_image ? (
                      <div className="relative">
                        <img src={newReview.review_image} className="w-32 h-32 rounded-2xl object-cover shadow-xl" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setNewReview({ ...newReview, review_image: null }); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 shadow-sm">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Click to upload photo</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">PNG, JPG or WEBP max 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewReview}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {submitting ? "Creating..." : "Create Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeliveryReviewModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeDeliveryReviewModal}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Create Delivery Partner Review</h2>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Manual review entry</p>
              </div>
              <button onClick={closeDeliveryReviewModal} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={submitDeliveryReview} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Delivery Partner *</label>
                <select
                  required
                  value={selectedDeliveryPartnerId}
                  onChange={(e) => setSelectedDeliveryPartnerId(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-semibold transition-all"
                >
                  <option value="">Select a Delivery Partner</option>
                  {deliveryPartners.map((partner) => {
                    const optionKey = partner.id || partner.user_id || partner.delivery_partner_user_id || partner.delivery_partner_id;
                    const optionLabel = partner.name || partner.full_name || partner.partner_name || partner.delivery_partner_name || `Partner ${optionKey}`;
                    const optionMeta = partner.mobile || partner.email ? `(${partner.mobile || partner.email})` : "";
                    return (
                      <option key={optionKey} value={partner.user_id || partner.id || partner.delivery_partner_user_id || partner.delivery_partner_id}>
                        {optionLabel} {optionMeta}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedDeliveryPartnerId && (
                <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Selected Partner</p>
                  <p className="text-lg font-bold mt-2">
                    {deliveryPartners.find((partner) =>
                      String(partner.user_id) === String(selectedDeliveryPartnerId) ||
                      String(partner.id) === String(selectedDeliveryPartnerId) ||
                      String(partner.delivery_partner_user_id) === String(selectedDeliveryPartnerId) ||
                      String(partner.delivery_partner_id) === String(selectedDeliveryPartnerId)
                    )?.name || "Selected Partner"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {deliveryPartners.find((partner) =>
                      String(partner.user_id) === String(selectedDeliveryPartnerId) ||
                      String(partner.id) === String(selectedDeliveryPartnerId) ||
                      String(partner.delivery_partner_user_id) === String(selectedDeliveryPartnerId) ||
                      String(partner.delivery_partner_id) === String(selectedDeliveryPartnerId)
                    )?.mobile || ""}
                  </p>
                </div>
              )}

              <div>
                <label className="font-semibold">Rating</label>
                <div className="flex gap-3 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDeliveryRating(star)}
                      className={`w-12 h-12 rounded-full transition ${deliveryRating >= star ? "bg-yellow-400 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold">Comment</label>
                <textarea
                  rows={5}
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  placeholder="Tell us about the delivery experience..."
                  className="mt-3 w-full rounded-2xl border p-4 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-semibold">Upload Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDeliveryImage(e.target.files[0])}
                  className="mt-3 block w-full"
                />
                {deliveryImage && <p className="text-xs text-slate-500 mt-2">Selected file: {deliveryImage.name}</p>}
              </div>
            </form>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={closeDeliveryReviewModal}
                className="px-6 py-3 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDeliveryReview}
                disabled={deliverySubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {deliverySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {deliverySubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
