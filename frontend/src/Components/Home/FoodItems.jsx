import React, { useEffect, useState, useContext } from "react";
import { FiPlus, FiHeart } from "react-icons/fi";
import api from "../../api";
import Heading from "../Heading";
import QuickViewModal from "../Products/QuickModel";
import PageContainer from "../CommenComponents/PageContainer";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { AuthContext } from "../../PrivateRouter/AuthContext";

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
  const { toggleWishlist, wishlist } = useContext(StoreContext);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const goToDetails = (food) => {
    navigate(`/products/${food.id}`);
  };

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

  // Get the actual selling price from available fields
  const getSellingPrice = (food) => {
    if (food.final_price && parseFloat(food.final_price) > 0) return parseFloat(food.final_price);
    if (food.offer && parseFloat(food.offer) > 0 && food.mrp) {
      return parseFloat(food.mrp) - (parseFloat(food.mrp) * parseFloat(food.offer)) / 100;
    }
    return parseFloat(food.mrp || 0);
  };

  const hasDiscount = (food) => {
    const selling = getSellingPrice(food);
    const mrp = parseFloat(food.mrp || 0);
    return mrp > 0 && selling < mrp;
  };


  const fetchFoods = async () => {
    const hasLocation = Boolean(user?.latitude && user?.longitude);

    try {
      setLoading(true);

      const [foodsRes, productsRes] = await Promise.all([
        api.get("/chef-foods"),
        api.get("/products", {
          params: { source: "chef_products" },
        }),
      ]);

      const foods = Array.isArray(foodsRes.data) ? foodsRes.data : [];
      const products = Array.isArray(productsRes.data)
        ? productsRes.data
        : [];

      const allItems = [...foods, ...products];

      const filtered = allItems.filter((item) => {
        if (item.status?.toLowerCase() !== "active") {
          return false;
        }

        if (!hasLocation || !item.latitude || !item.longitude) {
          return true;
        }

        const distance = parseFloat(
          calculateDistance(
            parseFloat(user.latitude),
            parseFloat(user.longitude),
            parseFloat(item.latitude),
            parseFloat(item.longitude)
          )
        );

        const radius = parseFloat(item.delivery_radius || 0);
        return distance <= radius;
      });

      setFoods(filtered);
    } catch (err) {
      console.error(err);
      setError("Unable to load items.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchFoods();
  }, [user]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371;

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(2);
  };

  if (!loading && !hasLocation) {
    return (
      <section className="bg-slate-50 py-16">
        <PageContainer>
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white shadow-sm p-10 text-center">
            <p className="text-sm text-slate-500">You still haven't fetched your location.</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Please fetch your location to see nearby home chef products.</h2>
            <p className="mt-3 text-sm text-slate-500">Once your location is fetched, nearby products from home chefs will appear here.</p>
          </div>
        </PageContainer>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 py-16">
      <PageContainer>
        <div className="mb-10">
          <Heading
            title="Food Items"
            subtitle="Explore chef-crafted dishes from our kitchen with rich details and premium presentation."
          />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-5 xl:grid-cols-5">
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
            <p className="text-lg font-black text-slate-800">No Food Items Available.</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for fresh chef creations.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5 ">
            {foods.map((food) => (
              <article
                key={food.id}
                className="group  bg-white rounded-3xl overflow-hidden  shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-70 overflow-hidden">
                  <img
                    src={getFoodImage(food)}
                    alt={food.name}
                    onClick={() => goToDetails(food)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                  />

                  {/* Chef Badge */}
                  <div className="absolute top-3 left-3 bg-green-900/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
                    <p className="text-xs font-medium text-white">
                      👨‍🍳 {food.chef_name || "Chef"}
                    </p>
                  </div>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(food); }}
                    className={`absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-300 ${wishlist.some(w => w.product_id === food.id || w.id === food.id)
                      ? "text-red-500 scale-110"
                      : "text-gray-500 hover:text-red-500 hover:scale-110"
                      }`}
                  >
                    <FiHeart
                      size={18}
                      className={wishlist.some(w => w.product_id === food.id || w.id === food.id) ? "fill-current" : ""}
                    />
                  </button>

                  {/* Category Tag Badge */}
                  {(food.category || food.chef_category || food.product_type) && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xl backdrop-blur-md border ${(food.product_type?.toLowerCase() === 'food' || food.category?.toLowerCase() === 'food' || !food.product_type)
                        ? "bg-orange-500/90 text-white border-orange-400/50"
                        : "bg-emerald-500/90 text-white border-emerald-400/50"
                        }`}>
                        {food.product_type || food.category || food.chef_category}
                      </span>
                    </div>
                  )}

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
                    <div onClick={() => goToDetails(food)} className="flex-1 min-w-0 cursor-pointer">
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
                    {hasDiscount(food) && (
                      <span className="text-slate-400 line-through font-medium text-sm">
                        ₹{formatPrice(food.mrp)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-emerald-600">
                      ₹{formatPrice(getSellingPrice(food))}
                    </span>
                    {hasDiscount(food) && food.offer > 0 && (
                      <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                        {food.offer}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageContainer>

      {showQuickView && selectedFood && (
        <QuickViewModal product={selectedFood} onClose={closeQuickView} />
      )}
    </section>
  );
};

export default FoodItems;
