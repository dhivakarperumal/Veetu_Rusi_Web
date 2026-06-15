import React from "react";
import artisanImg from "../../../public/assets/about.jpg";
import PageContainer from "../CommenComponents/PageContainer";
import Heading from "../Heading";

const AboutBrand = () => {
  return (
    <section className="py-24">
        
      <PageContainer>
        <Heading
  title="About Us"
/>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-60 animate-subtle-float" />

            <img
              src={artisanImg}
              alt="Home Food"
              className="rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] relative z-10 w-full object-cover aspect-[4/5] sm:aspect-[3/2] md:aspect-square"
            />

            <div className="absolute -bottom-10 -right-6 md:-right-10 p-6 rounded-2xl shadow-xl z-20 max-w-[240px] bg-white/70 backdrop-blur-xl border border-white/30">
              <p className="font-playfair text-primary-dark text-xl font-bold mb-1">
                Taste of Home
              </p>

              <p className="font-outfit text-xs text-gray-500 leading-relaxed uppercase tracking-widest">
                Freshly cooked meals made with love, delivered with care.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <span className="font-outfit text-primary-dark font-bold uppercase tracking-widest text-sm">
              Bringing Homemade Goodness to Every Doorstep
            </span>

            <h2 className="font-playfair text-4xl md:text-6xl text-stone-900 leading-[1.1]">
              Freshly prepared <br />
              <em className="text-primary-light">
                lovingly served
              </em>
            </h2>

            <p className="font-outfit text-gray-600 leading-[1.8] text-lg max-w-xl">
              At Veetu Rusi, we believe food should taste just like home.
              Our mission is to connect customers with passionate home chefs
              who prepare fresh, authentic meals using quality ingredients
              and traditional recipes. Every order supports local culinary
              talent while delivering wholesome food straight to your doorstep.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-6">
              <div>
                <p className="font-playfair text-3xl font-bold text-primary-dark">
                  500+
                </p>
                <p className="font-outfit text-xs text-gray-400 uppercase tracking-widest mt-1">
                  Home Chefs
                </p>
              </div>

              <div>
                <p className="font-playfair text-3xl font-bold text-primary-dark">
                  10K+
                </p>
                <p className="font-outfit text-xs text-gray-400 uppercase tracking-widest mt-1">
                  Happy Customers
                </p>
              </div>
            </div>
          </div>

        </div>
      </PageContainer>
    </section>
  );
};

export default AboutBrand;