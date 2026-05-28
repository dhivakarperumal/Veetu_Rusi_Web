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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {foods.map((food) => (
              <article
                key={food.id}
                className="group overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <img
                    src={getFoodImage(food)}
                    alt={food.name || "Chef Food"}
                    className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 top-4 flex items-center justify-between px-4">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${getStatusClasses(food.status)}`}>
                      {food.status || "Active"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openQuickView(food)}
                      className="rounded-full bg-white/90 p-3 text-slate-900 shadow-sm transition hover:bg-white"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>

<div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{food.name || "Chef Special"}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-3">
                        {food.description || "A delightful homemade dish prepared by our chef."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Category</p>
                        <p className="mt-2 font-black text-slate-900">{food.category || food.chef_category || "Uncategorized"}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Chef</p>
                        <p className="mt-2 font-black text-slate-900">{food.chef_name || food.created_by_name || "Chef"}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">MRP</p>
                        <p className="mt-2 font-black text-slate-900">₹{formatPrice(food.mrp)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Price</p>
                        <p className="mt-2 font-black text-emerald-700">₹{formatPrice(food.final_price || food.offer_price || food.mrp)}</p>
                      </div>
                    </div>
                  </div>
              </article>
            ))}
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
