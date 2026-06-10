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

  useEffect(() => {
    fetchReviews();
  }, []);

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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Average Rating</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-4xl font-black text-slate-900">{stats.average_rating.toFixed(1)}</span>
            <FiStar className="h-7 w-7 text-amber-400" />
          </div>
          <p className="mt-2 text-sm text-slate-500">Based on {stats.total_reviews} reviews</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">5-Star</p>
          <p className="mt-5 text-4xl font-black text-slate-900">{stats.five_star}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">4-Star</p>
          <p className="mt-5 text-4xl font-black text-slate-900">{stats.four_star}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">3-Star & below</p>
          <p className="mt-5 text-4xl font-black text-slate-900">{stats.three_star + stats.two_star + stats.one_star}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Submit Rating</h2>
              <p className="text-sm text-slate-500 mt-1">Share feedback on a product you delivered or want to rate.</p>
            </div>
            <FiMessageSquare className="h-6 w-6 text-slate-400" />
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Product ID</span>
              <input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product id"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} star{value > 1 ? "s" : ""}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Review comment</span>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a short note about the delivery or product"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={submitReview}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSend className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Top review breakdown</h2>
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

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Recent Reviews</h2>
            <p className="text-sm text-slate-500 mt-1">Latest customer feedback across reviewed products.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {reviews.length} reviews
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            No reviews available yet. Once customers submit ratings, they will appear here.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <FiUser className="text-slate-500" />
                      <span className="font-semibold">{review.user_name || review.user_email || "Anonymous"}</span>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">Product: {review.product_id || "N/A"}</div>
                  </div>

                  <div className="flex items-center gap-2 text-amber-500">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FiStar key={i} className={i < review.rating ? "h-4 w-4" : "h-4 w-4 opacity-30"} />
                    ))}
                    <span className="text-sm font-bold text-slate-700">{review.rating || 0}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-700">{review.comment || "No comment provided."}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <span>{formatDateTime(review.created_at)}</span>
                  <span>•</span>
                  <span>{review.user_email || "Email unavailable"}</span>
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
