import { useState, useContext } from "react";
import { AuthContext } from "../PrivateRouter/AuthContext";
import { StoreContext } from "../PrivateRouter/StoreContext";
import { toast } from "react-toastify";
import api from "../api";

export const useFetchLocation = () => {
  const { user, login } = useContext(AuthContext);
  const storeContext = useContext(StoreContext);
  const setLastChefFoodsFetchTime = storeContext?.setLastChefFoodsFetchTime;
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const fetchLocation = (onSuccess) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          let location_name = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          let pincode = "";
          let district = "";
          let area = "";

          // Reverse geocoding using OpenStreetMap Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();

            if (data && data.address) {
              pincode = data.address.postcode || "";
              location_name = data.display_name || location_name;
              district =
                data.address.state_district ||
                data.address.county ||
                data.address.city_district ||
                "";
              area =
                data.address.suburb ||
                data.address.neighbourhood ||
                data.address.town ||
                data.address.village ||
                data.address.city ||
                "";
            }
          } catch (geoErr) {
            console.warn("Reverse geocoding error:", geoErr);
          }

          const token = localStorage.getItem("token");
          const updatedUser = {
            ...(user || {}),
            latitude: lat.toString(),
            longitude: lon.toString(),
            location_name,
            pincode,
            district,
            area,
            role: user?.role || "user",
          };

          if (token) {
            try {
              const apiRes = await api.post("/auth/update-location", {
                latitude: lat.toString(),
                longitude: lon.toString(),
                location_name,
                pincode,
                district,
                area,
              });

              if (apiRes.data && apiRes.data.user) {
                login(apiRes.data.user, token);
              } else {
                login(updatedUser, token);
              }
            } catch (apiErr) {
              console.error("Backend update-location failed:", apiErr);
              login(updatedUser, token);
            }
          } else {
            login(updatedUser, null);
          }

          if (setLastChefFoodsFetchTime) {
            setLastChefFoodsFetchTime(null);
          }

          toast.success(`Location updated: ${area || pincode || "Current Location"}`);
          if (onSuccess) onSuccess(updatedUser);
        } catch (error) {
          console.error("Location error:", error);
          toast.error("Failed to fetch location details.");
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setFetchingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access in your browser settings.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location information is unavailable. Please try again.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out. Please try again.");
        } else {
          toast.error("Error fetching location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    fetchingLocation,
    fetchLocation,
  };
};

export default useFetchLocation;
