import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Home,
  Info,
  ShoppingBag,
  PhoneCall,
  Sparkles,
  Shirt,
  Gem
} from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import PageContainer from "./PageContainer";

import api from "../.././api";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [homeChef, setHomeChef] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setHomeChef(res.data.homeChef);
      } catch (err) {
        console.error(err);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!homeChef?.created_by) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");

        const myCategories = res.data.filter(
          (cat) => cat.created_by_user_id === homeChef.created_by
        );

        setCategories(myCategories);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, [homeChef]);

  return (
    <footer className="bg-gradient-to-r from-primary via-secondary to-primary-dark text-white mt-20">

      <PageContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-12">

          {/* Section 1 */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Veetu Rusi"
                className="w-12 h-12 rounded-lg bg-white p-1"
              />

              <div>
                <h2 className="text-xl font-bold">Veetu Rusi</h2>
                <p className="text-xs opacity-80">Authentic Home-Style Restaurant</p>
              </div>
            </Link>

            <p className="text-sm opacity-90 leading-relaxed">
              Experience the authentic taste of traditional South Indian cuisine.
              Fresh ingredients, home-style recipes, and unforgettable flavors served
              with love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>

            <ul className="space-y-3 text-sm">

              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 hover:translate-x-1 transition"
                >
                  <Home size={16} />
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-2 hover:translate-x-1 transition"
                >
                  <Info size={16} />
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/shop"
                  className="flex items-center gap-2 hover:translate-x-1 transition"
                >
                  <ShoppingBag size={16} />
                  Shop
                </Link>
              </li>

              <li>
                <Link
                  to="/contactus"
                  className="flex items-center gap-2 hover:translate-x-1 transition"
                >
                  <PhoneCall size={16} />
                  Contact Us
                </Link>
              </li>

            </ul>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Categories</h2>

            <ul className="space-y-3 text-sm">

              {categories.length > 0 ? (
                categories.slice(0,4).map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center gap-2 hover:translate-x-1 transition"
                  >
                    <Utensils size={16} />
                    {cat.name}
                  </li>
                ))
              ) : (
                <li className="text-white/70">
                  No Categories Available
                </li>
              )}

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>

            <div className="space-y-3 text-sm">

              <p className="flex items-center gap-2 transition">
                <Phone size={16} />
                +91 98765 43210
              </p>

              <p className="flex items-center gap-2 transition">
                <Mail size={16} />
                support@mystore.com
              </p>

              <p className="flex items-center gap-2 transition">
                <MapPin size={16} />
                Chennai, India
              </p>

            </div>

            {/* Social Icons */}
            <div className="flex gap-4 mt-5">

              <FaFacebook className="cursor-pointer hover:scale-125 transition duration-300" />

              <FaInstagram className="cursor-pointer hover:scale-125 transition duration-300" />

              <Mail className="cursor-pointer hover:scale-125 transition duration-300" />

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white/30 py-4 text-center text-sm">
          © {new Date().getFullYear()} My Store. All Rights Reserved.
        </div>

      </PageContainer>
    </footer>
  );
};

export default Footer;