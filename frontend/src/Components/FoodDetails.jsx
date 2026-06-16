import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const FoodDetails = () => {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await api.get(`/chef-foods/${id}`);
        setFood(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

  if (loading) return <p>Loading...</p>;

  if (!food) return <p>Food not found</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <img
          src={food.images?.[0]}
          alt={food.name}
          className="w-full h-[500px] object-cover rounded-2xl"
        />

        <div>
          <h1 className="text-4xl font-bold">{food.name}</h1>

          <p className="text-gray-500 mt-2">
            {food.category}
          </p>

          <div className="mt-4">
            <span className="text-3xl font-bold text-green-700">
              ₹{food.final_price}
            </span>
          </div>

          <p className="mt-6 text-gray-700">
            {food.description}
          </p>

          <div className="mt-6">
            <h3 className="font-semibold">
              Chef: {food.chef_name}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetails;