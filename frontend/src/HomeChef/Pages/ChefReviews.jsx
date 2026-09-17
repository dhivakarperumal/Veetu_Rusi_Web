import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Star, Search, Loader2, CheckCircle, Award } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const ChefReviews = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const chefUserId = user?.user_id || user?.id;
      if (!chefUserId) {
        setProducts([]);
        return;
      }

      const [productRes, foodRes] = await Promise.all([
        api.get(`/products/user/${chefUserId}`).catch(() => ({ data: [] })),
        api.get(`/chef-foods`, { params: { chef_user_id: chefUserId } }).catch(() => ({ data: [] })),
      ]);

      const productList = Array.isArray(productRes.data)
        ? productRes.data
        : productRes.data?.data || [];
      const foodList = Array.isArray(foodRes.data)
        ? foodRes.data
        : foodRes.data?.data || [];

      const normalizedProducts = Array.isArray(productList)
        ? productList.map((product) => ({
            ...product,
            source: 'chef_product',
          }))
        : [];
      const normalizedFoods = Array.isArray(foodList)
        ? foodList.map((food) => ({
            ...food,
            source: 'chef_food',
            product_code: food.product_code || `CF${food.id}`,
          }))
        : [];

      setProducts([...normalizedProducts, ...normalizedFoods]);
    } catch (err) {
      console.error("Failed to load products for review page:", err);
      toast.error("Unable to load products.");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchReviews = async () => {
    if (!products?.length) {
      setReviews([]);
      return;
    }

    setLoadingReviews(true);
    try {
      const reviewSets = await Promise.all(
        products.map(async (product) => {
          try {
            const res = await api.get(`/reviews/product/${product.id}`);
            return (Array.isArray(res.data?.reviews) ? res.data.reviews : []).map((review) => ({
              ...review,
              product_name: product.name || product.product_code || `Product ${product.id}`,
            }));
          } catch (error) {
            console.warn(`Unable to load reviews for product ${product.id}:`, error);
            return [];
          }
        })
      );
      setReviews(reviewSets.flat());
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      toast.error("Unable to load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (products.length > 0) {
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [products]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        if (selectedProduct && String(review.product_id) !== String(selectedProduct)) {
          return false;
        }
        if (selectedRating && Number(review.rating) !== Number(selectedRating)) {
          return false;
        }
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return [
          review.user_name,
          review.user_email,
          review.comment,
          review.product_name,
        ]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(term));
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reviews, search, selectedProduct, selectedRating]);

  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const average = total === 0 ? 0 : reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / total;
    return {
      total_reviews: total,
      average_rating: Number(average.toFixed(1)),
      five_star: reviews.filter((item) => item.rating === 5).length,
      four_star: reviews.filter((item) => item.rating === 4).length,
      three_star: reviews.filter((item) => item.rating === 3).length,
      two_star: reviews.filter((item) => item.rating === 2).length,
      one_star: reviews.filter((item) => item.rating === 1).length,
    };
  }, [reviews]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-2xl bg-[#0b0d10] p-3 text-slate-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Chef Reviews</p>
              <h1 className="text-3xl font-black text-white">Customer feedback</h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-slate-300">
            Review details for products from your assigned franchise.
            Search, filter by product, and inspect customer ratings here.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Reviews", value: reviewStats.total_reviews, note: "Customer feedback", icon: MessageSquare, border: "from-blue-500/40 via-cyan-500/20", glow: "bg-blue-600/15", iconBg: "from-blue-600 to-cyan-700", shadow: "shadow-blue-700/40", labelColor: "text-blue-300/70", panel: "bg-[#13161b]" },
          { label: "Average Rating", value: reviewStats.average_rating, note: "Out of 5 stars", icon: Star, border: "from-emerald-500/40 via-teal-500/20", glow: "bg-emerald-500/20", iconBg: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-600/40", labelColor: "text-emerald-300/70", panel: "bg-linear-to-br from-[#071a10] to-[#0a0e1a]" },
          { label: "5-Star Reviews", value: reviewStats.five_star, note: "Top-rated feedback", icon: Award, border: "from-amber-500/40 via-orange-500/20", glow: "bg-amber-500/20", iconBg: "from-amber-500 to-orange-600", shadow: "shadow-amber-600/40", labelColor: "text-amber-300/70", panel: "bg-linear-to-br from-[#1a1004] to-[#0a0e1a]" },
          { label: "Reviewed Products", value: products.length, note: "Items receiving feedback", icon: CheckCircle, border: "from-rose-500/40 via-red-500/20", glow: "bg-rose-500/20", iconBg: "from-rose-500 to-red-600", shadow: "shadow-rose-600/40", labelColor: "text-rose-300/70", panel: "bg-linear-to-br from-[#1a0a0a] to-[#0a0e1a]" },
        ].map(({ label, value, note, icon: Icon, border, glow, iconBg, shadow, labelColor, panel }) => (
          <div key={label} className={`relative overflow-hidden group rounded-2xl p-px bg-linear-to-br ${border} to-transparent hover:-translate-y-1 transition-all duration-300`}>
            <div className={`relative ${panel} rounded-2xl p-6 flex items-center gap-4 h-full`}><div className={`absolute -top-6 -right-6 w-28 h-28 ${glow} rounded-full blur-2xl pointer-events-none`} /><div className={`relative shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br ${iconBg} flex items-center justify-center shadow-lg ${shadow}`}><Icon className="w-6 h-6 text-white" /></div><div><p className={`text-[10px] ${labelColor} font-black uppercase tracking-[0.2em]`}>{label}</p><h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{value}</h4><p className="text-[10px] text-white/25 font-semibold mt-1">{note}</p></div></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-[#0f1216] p-5 shadow-sm text-slate-200">
          <div className="space-y-2">
            <h2 className="text-lg font-black text-white">Filters</h2>
            <p className="text-sm text-slate-300">Narrow the review results by product, rating, or keyword.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-slate-600"
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name || product.product_code || `Product ${product.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Rating</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['All', 5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSelectedRating(rating === 'All' ? null : rating)}
                    className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-[0.16em] transition ${
                          selectedRating === rating || (rating === 'All' && selectedRating === null)
                            ? 'bg-slate-900 text-white'
                            : 'bg-[#0b0d10] text-slate-300 hover:bg-[#0f1216]'
                        }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Keyword search</label>
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer, comment or product"
                  className="w-full rounded-2xl border border-slate-800 bg-[#0b0d10] pl-11 pr-4 py-3 text-sm text-white outline-none transition focus:border-slate-600"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#0b0d10] p-4 text-sm text-slate-300">
              <p className="font-black text-white">Chef user</p>
              <p>{user?.name || user?.username || user?.email || 'Unknown user'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-[#0f1216] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between text-slate-200">
            <div>
              <p className="text-sm font-black text-white">Review results</p>
              <p className="text-sm text-slate-300">{filteredReviews.length} reviews shown</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-[#0b0d10] p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">5-star</p>
                <p className="mt-2 text-lg font-black text-white">{reviewStats.five_star}</p>
              </div>
              <div className="rounded-3xl bg-[#0b0d10] p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">4-star</p>
                <p className="mt-2 text-lg font-black text-white">{reviewStats.four_star}</p>
              </div>
              <div className="rounded-3xl bg-[#0b0d10] p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">3-star+</p>
                <p className="mt-2 text-lg font-black text-white">{reviewStats.three_star + reviewStats.four_star + reviewStats.five_star}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0f1216] p-5 shadow-sm text-slate-200">
            {loadingProducts || loadingReviews ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Loading reviews...</p>
              </div>
            ) : !products.length ? (
              <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-slate-400 bg-[#0b0d10]">
                No products found for your profile yet. Add items or check with your franchise owner.
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-slate-400 bg-[#0b0d10]">
                No reviews match your filters. Try another product, rating, or keyword.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-800 bg-[#0b0d10] p-5 text-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{review.product_name}</p>
                        <h3 className="mt-2 text-lg font-black text-white">{review.user_name || review.user_email || 'Customer'}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rating</p>
                        <p className="mt-2 text-lg font-black text-amber-400">{review.rating || 0} / 5</p>
                        <p className="mt-2 text-xs text-slate-300">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                      <span className="rounded-full bg-[#0f1216] px-3 py-1 border border-slate-800">{review.user_email || 'No email'}</span>
                      <span className="rounded-full bg-[#0f1216] px-3 py-1 border border-slate-800">Status: {review.status || 'Published'}</span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{review.comment || 'No review comment available.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefReviews;
