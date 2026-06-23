import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { FiMapPin, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api";

const LocationPopup = () => {
  const { user, login, locationPopupOpen, setLocationPopupOpen } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show if user is logged in, has role 'user', and doesn't have a pincode
    if (user && user.role === "user" && (!user.pincode || !user.latitude)) {
      setLocationPopupOpen(true);
    }
  }, [user, setLocationPopupOpen]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Reverse geocoding using Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();

          if (data && data.address) {
            const pincode = data.address.postcode || "";
            const location_name = data.display_name || "";

            // Call backend API to update location
            const apiRes = await api.post("/auth/update-location", {
              latitude: lat.toString(),
              longitude: lon.toString(),
              location_name,
              pincode,
            });

            // Update user in context
            if (apiRes.data && apiRes.data.user) {
              const token = localStorage.getItem("token"); // Reusing existing token
              login(apiRes.data.user, token);
            }

            toast.success(`Location set to ${pincode || "your current area"}`);
            setLocationPopupOpen(false);
          } else {
            toast.error("Could not determine your address details.");
          }
        } catch (error) {
          console.error("Location error:", error);
          toast.error("Failed to fetch location details.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access.");
        } else {
          toast.error("Error fetching location.");
        }
      }
    );
  };

  if (!locationPopupOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
        {/* Semi-mandatory close button */}
        <button
          onClick={() => setLocationPopupOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          <FiX size={20} />
        </button>

        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-primary rounded-full flex items-center justify-center mb-6">
            <FiMapPin size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your Location</h2>
          <p className="text-gray-500 mb-8 text-sm">
            Please allow access to your location so we can show you the best home chefs and restaurants near you.
          </p>

          <button
            onClick={getLocation}
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <FiMapPin />
                Get Current Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPopup;
