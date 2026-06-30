import React, { useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Components/CommenComponents/Navbar";
import Header from "./Components/CommenComponents/Header";
import Footer from "./Components/CommenComponents/Footer";

import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./Components/CommenComponents/ScrollToTop";
import ScrollNavigator from "./Components/CommenComponents/ScrollNavigator";
import Loader from "./Components/CommenComponents/Loader";
import LocationPopup from "./Components/CommenComponents/LocationPopup";
import FloatingChatbot from "./Components/Chatbot/FloatingChatbot";
import "./Components/Chatbot/chatbot.css";

function App() {
   const [loading, setLoading] = useState(false);

  if (loading) {
    return <Loader />;
  }

  return (
    <section>
      <Header />
      <Navbar />
      <ScrollToTop/>
      <ScrollNavigator/>
      <LocationPopup />
      <Outlet />
      <Footer />
      <FloatingChatbot />
    </section>
  );
}

export default App;