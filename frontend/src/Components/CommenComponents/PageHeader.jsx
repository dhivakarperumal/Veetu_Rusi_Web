import React from "react";
import { Link } from "react-router-dom";
import defaultBg from "/assets/foodheader.jpg";

const PageHeader = ({ title, background }) => {

  const bgImage = background || defaultBg;

  return (
    <div
      className="relative w-full h-[180px] sm:h-[200px] md:h-[210px] lg:h-[220px] flex items-center justify-center text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        // backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0"></div>

      {/* Content */}
      <div className="relative text-center px-4">

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {title}
        </h1>

        {/* Breadcrumb */}
        <div className="text-xs sm:text-sm md:text-base flex justify-center items-center gap-2">

          <Link
            to="/"
            className=" text-secondary hover:text-primary-light transition"
          >
            Home
          </Link>

          <span className="text-primary-dark">/</span>

          <span className="text-secondary">{title}</span>

        </div>

      </div>
    </div>
  );
};

export default PageHeader;