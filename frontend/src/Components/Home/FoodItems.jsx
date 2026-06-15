import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import api from "../../api";
import Heading from "../Heading";
import QuickViewModal from "../Products/QuickModel";

const parseJsonField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [value];
  }
};

const getFoodImage = (item) => {
  const images = parseJsonField(item.images);
  if (Array.isArray(images) && images.length > 0 && images[0]) {
    return images[0];
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "Chef Food")}&background=random&size=600`;
};

const getStatusClasses = (status) => {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "low stock":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "out of stock":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const FoodItems = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const openQuickView = (food) => {
    setSelectedFood(food);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setSelectedFood(null);
  };

  const formatPrice = (value) => {
    const amount = parseFloat(value || 0);
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await api.get("/chef-foods");
        const data = Array.isArray(res.data) ? res.data : [];
        setFoods(data);
      } catch (err) {
        console.error("Error fetching food items:", err);
        setError("Unable to load food items right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="mb-10">
          <Heading
            title="Food Items"
            subtitle="Explore chef-crafted dishes from our kitchen with rich details and premium presentation."
          />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-4xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="h-72 bg-slate-100" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-full w-1/2" />
                  <div className="h-20 bg-slate-100 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-4xl bg-white border border-rose-200 p-8 text-center text-rose-700 shadow-sm">
            {error}
          </div>
        ) : foods.length === 0 ? (
          <div className="rounded-4xl bg-white border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-lg font-black text-slate-800">No food items available yet.</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for fresh chef creations.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

            {foods.map((food) => {
              const firstVariant = food?.variants?.[0];

              const mrp =
                firstVariant?.mrp ||
                food?.mrp;

              const offerPrice =
                firstVariant?.offerPrice ||
                food?.offer_price;

              return (
                <article
                  key={food.id}
                  className="group overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={getFoodImage(food)}
                      alt={food.name || "Food"}
                      className="h-56 w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Status */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getStatusClasses(
                          food.status
                        )}`}
                      >
                        {food.status || "Active"}
                      </span>
                    </div>

                    {/* Quick View */}
                    <button
                      type="button"
                      onClick={() => openQuickView(food)}
                      className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 transition"
                    >
                      <FiPlus size={18} />
                    </button>

                    {/* Title */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-black line-clamp-1">
                        {food.name || "Chef Special"}
                      </h3>

                      <p className="text-white/80 text-sm">
                        👨‍🍳 {food.chef_name || food.created_by_name || "Chef"}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {food.category ||
                          food.chef_category ||
                          "Uncategorized"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-6 text-slate-500 line-clamp-2 min-h-[48px]">
                      {food.description ||
                        "A delightful homemade dish prepared by our chef."}
                    </p>

                    {/* Price */}
                    <div className="mt-5 flex items-center gap-2 flex-wrap">
                      {offerPrice &&
                        Number(offerPrice) < Number(mrp) ? (
                        <>
                          <span className="text-sm text-slate-400 line-through font-medium">
                            ₹{formatPrice(mrp)}
                          </span>

                          <span className="text-2xl font-black text-emerald-600">
                            ₹{formatPrice(offerPrice)}
                          </span>

                          <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
                            {Math.round(
                              ((Number(mrp) - Number(offerPrice)) /
                                Number(mrp)) *
                              100
                            )}
                            % OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-emerald-600">
                          ₹{formatPrice(mrp)}
                        </span>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => openQuickView(food)}
                      className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showQuickView && selectedFood && (
        <QuickViewModal product={selectedFood} onClose={closeQuickView} />
      )}
    </section>
  );
};

export default FoodItems;
