import React, { useEffect, useState } from "react";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { useContext } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import ProductCard from "../Products/ProductsCard";
import Heading from "../Heading";
import PageContainer from "../CommenComponents/PageContainer";

const SareeSwiper = () => {
  const { productsCache, setProductsCache, lastFetchTime, setLastFetchTime } = useContext(StoreContext);
  const [recentItems, setRecentItems] = useState([]);

  const fetchRecentItems = async () => {
    try {
      let data = productsCache;
      
      // If cache is empty or older than 5 minutes, fetch again
      if (!data || data.length === 0 || !lastFetchTime || (Date.now() - lastFetchTime > 5 * 60 * 1000)) {
        const res = await api.get("/products");
        data = Array.isArray(res.data) ? res.data : [];
        setProductsCache(data);
        setLastFetchTime(Date.now());
      }

      // Sort by newest first (assuming higher ID or newer created_at)
      const sorted = [...(data || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });

      // Show top 15 recent items
      setRecentItems(sorted.slice(0, 15));
    } catch (error) {
      console.error("Error fetching recent items:", error);
      setRecentItems([]);
    }
  };

  useEffect(() => {
    fetchRecentItems();
  }, []);

  if (recentItems.length === 0) {
    return (
      <PageContainer>
        <div className="py-5">
          <Heading title="Latest Foods & Products" />
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
        {/* SECTION TITLE */}
        <Heading title="Latest Foods & Products" />

        {/* SWIPER */}
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
          {recentItems.map((product) => (
            <SwiperSlide
              key={product.id}
              className="flex justify-center pb-10"
            >
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </PageContainer>
  );
};

export default SareeSwiper;
