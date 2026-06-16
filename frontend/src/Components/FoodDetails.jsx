import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import api from "../api";
import { StoreContext } from "../PrivateRouter/StoreContext";

const FoodDetails = () => {
  const { id } = useParams();

  const { addToFoodCart, toggleWishlist, wishlist } =
    useContext(StoreContext);

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await api.get(`/chef-foods/${id}`);

        setFood(res.data);

        if (res.data.images?.length) {
          setSelectedImage(res.data.images[0]);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  if (loading) return <p>Loading...</p>;

  if (!food) return <p>Food not found</p>;

  const unitPrice =
    food.final_price ||
    food.offer_price ||
    food.mrp ||
    0;

  const isInWishlist = wishlist.some(
    (item) =>
      item.product_id === food.id ||
      item.id === food.id
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid lg:grid-cols-2 gap-10">

          {/* LEFT */}
          <div>
            <div className="overflow-hidden rounded-3xl border bg-white">
              <img
                src={selectedImage}
                alt={food.name}
                className="w-full h-[550px] object-cover"
              />
            </div>

            {food.images?.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto">
                {food.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt=""
                    onClick={() =>
                      setSelectedImage(img)
                    }
                    className={`w-24 h-24 rounded-xl object-cover cursor-pointer border-2 ${
                      selectedImage === img
                        ? "border-green-700"
                        : "border-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>

            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              👨‍🍳 {food.chef_name}
            </span>

            <h1 className="text-4xl font-black text-slate-900 mt-4">
              {food.name}
            </h1>

            <div className="flex gap-2 mt-4">
              <span className="bg-slate-100 px-4 py-2 rounded-full">
                {food.category}
              </span>

              {food.subcategory && (
                <span className="bg-slate-100 px-4 py-2 rounded-full">
                  {food.subcategory}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-4xl font-black text-green-700">
                ₹{unitPrice}
              </span>

              {food.mrp && (
                <span className="text-xl line-through text-slate-400">
                  ₹{food.mrp}
                </span>
              )}
            </div>

            {food.offer && (
              <div className="mt-3">
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">
                  {food.offer}% OFF
                </span>
              </div>
            )}

            {/* Quantity */}

            <div className="mt-8">
              <h3 className="font-bold mb-3">
                Quantity
              </h3>

              <div className="flex items-center gap-5">
                <button
                  onClick={() =>
                    quantity > 1 &&
                    setQuantity(quantity - 1)
                  }
                  className="w-10 h-10 rounded-full bg-gray-200"
                >
                  -
                </button>

                <span className="font-bold text-lg">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity(quantity + 1)
                  }
                  className="w-10 h-10 rounded-full bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}

            <div className="flex gap-4 mt-8">

              <button
                onClick={() =>
                  addToFoodCart(
                    food,
                    null,
                    null,
                    quantity
                  )
                }
                className="flex-1 bg-green-700 text-white py-4 rounded-2xl flex justify-center items-center gap-2"
              >
                <FiShoppingCart />
                Add To Cart
              </button>

              <button
                onClick={() =>
                  toggleWishlist(food)
                }
                className={`w-14 rounded-2xl border ${
                  isInWishlist
                    ? "text-red-500 border-red-500"
                    : ""
                }`}
              >
                <FiHeart />
              </button>
            </div>

          </div>
        </div>

        {/* Description */}

        <div className="bg-white rounded-3xl p-8 mt-10">
          <h2 className="text-2xl font-bold mb-4">
            Description
          </h2>

          <p className="text-slate-600 leading-8">
            {food.description ||
              "No description available"}
          </p>
        </div>

        {/* Additional Details */}

        <div className="bg-white rounded-3xl p-8 mt-6">
          <h2 className="text-2xl font-bold mb-6">
            Product Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold">
                Chef Name
              </p>
              <p>{food.chef_name}</p>
            </div>

            <div>
              <p className="font-semibold">
                Category
              </p>
              <p>{food.category}</p>
            </div>

            <div>
              <p className="font-semibold">
                Sub Category
              </p>
              <p>{food.subcategory || "-"}</p>
            </div>

            <div>
              <p className="font-semibold">
                Rating
              </p>
              <p>{food.rating || "4.8"} ⭐</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FoodDetails;