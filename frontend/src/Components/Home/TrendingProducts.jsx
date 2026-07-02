import React, { useEffect, useState } from "react";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useContext } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import ProductCard from "../Products/ProductsCard";
import Heading from "../Heading";

import PageContainer from "../CommenComponents/PageContainer"
import { AuthContext } from "../../PrivateRouter/AuthContext";

const TrendingProducts = () => {
  const { user } = useContext(AuthContext);
  const { productsCache, setProductsCache, lastFetchTime, setLastFetchTime } = useContext(StoreContext);
  const initialProducts = Array.isArray(productsCache) ? [...productsCache].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
  const [products, setProducts] = useState(initialProducts);

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

  const fetchTrendingProducts = async () => {
    try {
      let data = productsCache;
      const hasLocation = Boolean(user?.latitude && user?.longitude);

      if (
        !data ||
        data.length === 0 ||
        !lastFetchTime ||
        Date.now() - lastFetchTime > 5 * 60 * 1000
      ) {
        const res = await api.get("/products", {
          params: { source: "chef_products" },
        });

        data = Array.isArray(res.data) ? res.data : [];

        setProductsCache(data);
        setLastFetchTime(Date.now());
      }

      const filtered = data.filter((product) => {
        if (product.status?.toLowerCase() !== "active") {
          return false;
        }

        if (!hasLocation || !product.latitude || !product.longitude) {
          return true;
        }

        const distance = parseFloat(
          calculateDistance(
            parseFloat(user.latitude),
            parseFloat(user.longitude),
            parseFloat(product.latitude),
            parseFloat(product.longitude)
          )
        );

        const radius = parseFloat(product.delivery_radius || 0);

        return distance <= radius;
      });

      filtered.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setProducts(filtered);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchTrendingProducts();
  }, [user]);

  if (products.length === 0) {
    return (
      <PageContainer>
        <div className="py-5">
          <Heading title="Trending Products" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="w-full h-80 bg-gray-100"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-5">
        {/* Title */}
        <Heading title="Trending Products" />

        {/* Swiper */}
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          loop={true}
          autoplay={{ delay: 3000 }}
          breakpoints={{
            320: { slidesPerView: 1 },
            480: { slidesPerView: 2 },
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
          }}
        >
          {Array.isArray(products) && products.map((product) => (
            <SwiperSlide key={product.id} className="flex justify-center pb-10">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </PageContainer>
  );
};

export default TrendingProducts;
