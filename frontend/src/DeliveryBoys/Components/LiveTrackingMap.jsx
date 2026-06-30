import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Icons
const chefIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LiveTrackingMap = ({ chefLat, chefLng, customerLat, customerLng }) => {
  const defaultCenter = [20.5937, 78.9629]; // Default India center
  const [center, setCenter] = useState(defaultCenter);
  const [bounds, setBounds] = useState(null);
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);

  useEffect(() => {
    let watchId;
    if ("geolocation" in navigator) {
      // Get initial position quickly
      navigator.geolocation.getCurrentPosition((position) => {
        setDeliveryLat(position.coords.latitude);
        setDeliveryLng(position.coords.longitude);
      });
      // Watch for location changes
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setDeliveryLat(position.coords.latitude);
          setDeliveryLng(position.coords.longitude);
        },
        (err) => console.warn("Failed to watch location", err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    const points = [];
    if (chefLat && chefLng) points.push([parseFloat(chefLat), parseFloat(chefLng)]);
    if (customerLat && customerLng) points.push([parseFloat(customerLat), parseFloat(customerLng)]);
    if (deliveryLat && deliveryLng) points.push([parseFloat(deliveryLat), parseFloat(deliveryLng)]);
    
    if (points.length > 0) {
      // Calculate center based on available points
      const lats = points.map(p => p[0]);
      const lngs = points.map(p => p[1]);
      const centerLat = lats.reduce((a, b) => a + b, 0) / points.length;
      const centerLng = lngs.reduce((a, b) => a + b, 0) / points.length;
      setCenter([centerLat, centerLng]);
      
      // Calculate bounds if more than 1 point
      if (points.length > 1) {
        setBounds(L.latLngBounds(points));
      }
    }
  }, [chefLat, chefLng, customerLat, customerLng, deliveryLat, deliveryLng]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden shadow-lg border border-slate-200">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {chefLat && chefLng && (
          <Marker position={[parseFloat(chefLat), parseFloat(chefLng)]} icon={chefIcon}>
            <Popup><strong>Home Chef (Pickup)</strong></Popup>
          </Marker>
        )}

        {customerLat && customerLng && (
          <Marker position={[parseFloat(customerLat), parseFloat(customerLng)]} icon={customerIcon}>
            <Popup><strong>Customer (Drop-off)</strong></Popup>
          </Marker>
        )}

        {deliveryLat && deliveryLng && (
          <Marker position={[parseFloat(deliveryLat), parseFloat(deliveryLng)]} icon={deliveryIcon}>
            <Popup><strong>You (Delivery Partner)</strong></Popup>
          </Marker>
        )}
        
        {/* Simple Polyline representing the route */}
        {chefLat && chefLng && customerLat && customerLng && (
           <Polyline 
             positions={[
                [parseFloat(chefLat), parseFloat(chefLng)], 
                [parseFloat(customerLat), parseFloat(customerLng)]
             ]} 
             color="indigo" 
             weight={4} 
             opacity={0.6} 
             dashArray="10, 10" 
           />
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
