import React, { useEffect, useContext } from "react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { FiMapPin, FiX } from "react-icons/fi";
import useFetchLocation from "../../hooks/useFetchLocation";

const LocationPopup = () => {
  const { user, locationPopupOpen, setLocationPopupOpen } = useContext(AuthContext);
  const { fetchingLocation, fetchLocation } = useFetchLocation();

  useEffect(() => {
    // Only show if user is logged in, has role 'user', and doesn't have a pincode
    if (user && user.role === "user" && (!user.pincode || !user.latitude)) {
      setLocationPopupOpen(true);
    }
  }, [user, setLocationPopupOpen]);

  const getLocation = () => {
    fetchLocation(() => {
      setLocationPopupOpen(false);
    });
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
            disabled={fetchingLocation}
            className="w-full py-3 px-4 bg-primary hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {fetchingLocation ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Fetching Location...</span>
              </>
            ) : (
              <>
                <FiMapPin />
                <span>Get Current Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPopup;
