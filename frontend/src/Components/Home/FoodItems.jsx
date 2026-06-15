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
          <div className="grid gap-6 sm:grid-cols-4 xl:grid-cols-4">
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
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 ">
            {foods.map((food) => (
              <article
                key={food.id}
                className="group  bg-white rounded-3xl overflow-hidden border border-green-800 border-0.4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-70 overflow-hidden">
                  <img
                    src={getFoodImage(food)}
                    alt={food.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Chef Badge */}
                  <div className="absolute top-3 left-3 bg-green-900/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
                    <p className="text-xs font-medium text-white">
                      👨‍🍳 {food.chef_name || "Chef"}
                    </p>
                  </div>

                  {/* Rating */}
                  {/* <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-bold text-slate-800">
                      {food.rating || "4.8"}
                    </span>
                  </div> */}

                  {/* Plus Button - Bottom Right */}
                  <button
                    onClick={() => openQuickView(food)}
                    className="absolute bottom-4 right-4 z-10 bg-green-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:bg-green-800 hover:scale-110 transition-all duration-300"
                  >
                    <FiPlus size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 text-lg truncate">
                        {food.name}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {food.category || food.chef_category || "Food Item"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      <span>⭐</span>
                      <span className="text-sm font-bold text-slate-800">
                        {food.rating || "4.8"}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-slate-400 line-through font-medium text-sm">
                      ₹{formatPrice(food.mrp)}
                    </span>

                    <span className="text-2xl font-black text-emerald-600">
                      ₹{formatPrice(
                        food.final_price ||
                        food.offer_price ||
                        food.mrp
                      )}
                    </span>
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
