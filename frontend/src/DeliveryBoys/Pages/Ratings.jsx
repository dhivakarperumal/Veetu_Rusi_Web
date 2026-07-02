import React, { useEffect, useState } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FiStar, FiUser, FiCalendar, FiMessageSquare, FiSend } from "react-icons/fi";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const Ratings = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [deliveryReviews, setDeliveryReviews] = useState([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0,
  });
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDeliveryPartner = ['delivery_partner', 'delivery', 'delivery_boy'].includes(user?.role);
  const showTabs = user?.role === 'superadmin' || isDeliveryPartner;
  const [deliveryTab, setDeliveryTab] = useState(isDeliveryPartner);
  const activeReviews = deliveryTab ? deliveryReviews : reviews;

  const computeStats = (items) => {
    const total_reviews = items.length;
    const ratings = items.reduce((acc, item) => {
      const value = Number(item.rating) || 0;
      if (value >= 5) acc.five_star += 1;
      else if (value >= 4) acc.four_star += 1;
      else if (value >= 3) acc.three_star += 1;
      else if (value >= 2) acc.two_star += 1;
      else if (value >= 1) acc.one_star += 1;
      acc.sum += value;
      return acc;
    }, { five_star: 0, four_star: 0, three_star: 0, two_star: 0, one_star: 0, sum: 0 });

    return {
      total_reviews,
      average_rating: total_reviews ? Number((ratings.sum / total_reviews).toFixed(1)) : 0,
      five_star: ratings.five_star,
      four_star: ratings.four_star,
      three_star: ratings.three_star,
      two_star: ratings.two_star,
      one_star: ratings.one_star,
    };
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setStats(data.stats || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      });
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Unable to load ratings.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery-partner-review');
      const reviews = (res.data && res.data.data) || [];
      setDeliveryReviews(reviews);
      setStats(computeStats(reviews));
    } catch (err) {
      console.error('Failed to load delivery reviews:', err);
      toast.error('Unable to load delivery partner ratings.');
      setDeliveryReviews([]);
      setStats(computeStats([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeliveryPartner) {
      setDeliveryTab(true);
    }
  }, [isDeliveryPartner]);

  useEffect(() => {
    if (deliveryTab) {
      fetchDeliveryReviews();
    } else {
      fetchReviews();
    }
  }, [deliveryTab]);

  const submitReview = async () => {
    if (!productId.trim()) {
      toast.error("Enter a product ID to submit a rating.");
      return;
    }
    if (!rating || rating < 1) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/reviews", {
        product_id: productId.trim(),
        user_id: user?.user_id || user?.id,
        user_name: user?.name || user?.username || user?.email || "Delivery Partner",
        user_email: user?.email || null,
        rating,
        comment: comment.trim() || null,
      });

      toast.success("Rating submitted successfully.");
      setProductId("");
      setRating(5);
      setComment("");
      fetchReviews();
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Ratings</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Customer ratings and feedback from reviews. Use this page to review recent ratings and provide new review feedback for a product.
        </p>
        {showTabs && (
          <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-950/80 p-1 shadow-lg shadow-slate-950/20">
            <button
              onClick={() => setDeliveryTab(false)}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${!deliveryTab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Food Reviews
            </button>
            <button
              onClick={() => setDeliveryTab(true)}
              className={`rounded-full px-5 py-2 text-sm font-black transition ${deliveryTab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Delivery Partner Reviews
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="table-card rounded-3xl p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Average Rating</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-4xl font-black text-white">{stats.average_rating.toFixed(1)}</span>
            <FiStar className="h-7 w-7 text-amber-400" />
          </div>
          <p className="mt-2 text-sm text-slate-400">Based on {stats.total_reviews} reviews</p>
        </div>
        <div className="table-card rounded-3xl p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">5-Star</p>
          <p className="mt-5 text-4xl font-black text-white">{stats.five_star}</p>
        </div>
        <div className="table-card rounded-3xl p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">4-Star</p>
          <p className="mt-5 text-4xl font-black text-white">{stats.four_star}</p>
        </div>
        <div className="table-card rounded-3xl p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">3-Star & below</p>
          <p className="mt-5 text-4xl font-black text-white">{stats.three_star + stats.two_star + stats.one_star}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="table-card rounded-4xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white">Submit Rating</h2>
              <p className="text-sm text-slate-400 mt-1">Share feedback on a product you delivered or want to rate.</p>
            </div>
            <FiMessageSquare className="h-6 w-6 text-slate-400" />
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Product ID</span>
              <input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product id"
                className="superadmin-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="superadmin-input mt-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Review comment</span>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a short note about the delivery or product"
                className="superadmin-textarea mt-2"
              />
            </label>

            <button
              type="button"
              onClick={submitReview}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSend className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>

        <div className="table-card rounded-4xl p-6">
          <h2 className="text-xl font-black text-white">Top review breakdown</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: "5 star", value: stats.five_star },
              { label: "4 star", value: stats.four_star },
              { label: "3 star", value: stats.three_star },
              { label: "2 star", value: stats.two_star },
              { label: "1 star", value: stats.one_star },
            ].map((item) => (
              <div key={item.label} className="grid grid-cols-[1fr_auto] gap-3">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card rounded-4xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">Recent Reviews</h2>
            <p className="text-sm text-slate-400 mt-1">Latest feedback from {deliveryTab ? 'delivery partner' : 'product'} reviews.</p>
          </div>
          <div className="rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200">
            {activeReviews.length} reviews
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">Loading reviews...</div>
        ) : activeReviews.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            No reviews available yet. Once customers submit ratings, they will appear here.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeReviews.map((review) => (
              <div key={review.id} className="group rounded-4xl border border-slate-800/50 bg-slate-950/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500 text-white text-lg font-black">
                        {deliveryTab
                          ? (review.delivery_partner_name?.charAt(0) || 'D')
                          : (review.user_name?.charAt(0) || review.user_email?.charAt(0) || 'R')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {deliveryTab
                            ? review.delivery_partner_name || review.delivery_partner_id || 'Delivery Partner'
                            : review.user_name || review.user_email || 'Anonymous'}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {deliveryTab ? review.delivery_partner_email || review.delivery_partner_phone || 'Contact unavailable' : review.product_id ? `Product ${review.product_id}` : 'Product unavailable'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400">{review.rating || 0}</div>
                    <div className="mt-2 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                      {review.status || 'Published'}
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-300 italic">"{review.comment || 'No comment provided.'}"</p>

                <div className="mt-5 grid gap-3 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-4 py-3">
                    <span>Submitted</span>
                    <span>{formatDateTime(review.created_at)}</span>
                  </div>
                  {deliveryTab && review.admin_reply && (
                    <div className="rounded-3xl bg-blue-950/80 p-4 text-slate-200">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400">Official Reply</p>
                      <p className="mt-2 text-sm leading-snug">{review.admin_reply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;
