import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Shop from "../Home/Shop";
import api from "../../api";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [categoryNameResolved, setCategoryNameResolved] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveCategoryName = async () => {
      try {
        setLoading(true);
        // Check if categoryName is a number (ID) or a name
        const isNumeric = /^\d+$/.test(categoryName);
        
        if (isNumeric) {
          // Fetch category by ID
          const res = await api.get("/home-chef-categories");
          const categories = Array.isArray(res.data) ? res.data : [];
          const category = categories.find(cat => cat.id == categoryName);
          if (category) {
            setCategoryNameResolved(category.c_name || category.name || categoryName);
          } else {
            setCategoryNameResolved(categoryName);
          }
        } else {
          // Already a name, use it as is
          setCategoryNameResolved(decodeURIComponent(categoryName));
        }
      } catch (err) {
        console.error("Error resolving category name:", err);
        // Fallback: use the categoryName as is
        setCategoryNameResolved(decodeURIComponent(categoryName));
      } finally {
        setLoading(false);
      }
    };

    resolveCategoryName();
  }, [categoryName]);

  if (loading) {
    return (
      <div className="px-4 md:px-10 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-[300px]" />
        ))}
      </div>
    );
  }

  return <Shop defaultCategory={categoryNameResolved} />;
};

export default CategoryPage;