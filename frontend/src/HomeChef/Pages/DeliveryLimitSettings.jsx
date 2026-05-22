import React, { useState } from "react";
import { MapPin, Save } from "lucide-react";
import toast from "react-hot-toast";

const DeliveryLimitSettings = () => {
  const [settings, setSettings] = useState({
    deliveryRadius: 5,
    deliveryCharge: 0,
    freeDeliveryAbove: 500,
    zones: [
      { name: "Zone A", radius: "0-2 km", charge: 30 },
      { name: "Zone B", radius: "2-5 km", charge: 50 },
    ],
  });

  const [editMode, setEditMode] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempSettings({
      ...tempSettings,
      [name]: name === "deliveryRadius" ? parseInt(value) : parseInt(value),
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(tempSettings);
    setEditMode(false);
    toast.success("Delivery settings updated!");
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Delivery Limit Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set delivery radius and manage delivery zones (5 KM limit)
        </p>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Delivery Configuration</h2>
          <button
            onClick={() => {
              setEditMode(!editMode);
              setTempSettings(settings);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Delivery Radius */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Maximum Delivery Radius (KM)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="deliveryRadius"
                  min="1"
                  max="5"
                  value={tempSettings.deliveryRadius}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {tempSettings.deliveryRadius}
                  </p>
                  <p className="text-xs text-gray-600">KM</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Maximum limit: 5 KM</p>
            </div>

            {/* Delivery Charge */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Default Delivery Charge (₹)
              </label>
              <input
                type="number"
                name="deliveryCharge"
                value={tempSettings.deliveryCharge}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Free Delivery Above */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                name="freeDeliveryAbove"
                value={tempSettings.freeDeliveryAbove}
                onChange={handleInputChange}
                placeholder="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Settings
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <p className="text-xs font-bold text-blue-600 uppercase">
                  Delivery Radius
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {settings.deliveryRadius} KM
                </p>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-6">
                <p className="text-xs font-bold text-green-600 uppercase">
                  Delivery Charge
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{settings.deliveryCharge}
                </p>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <p className="text-xs font-bold text-purple-600 uppercase">
                  Free Above
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  ₹{settings.freeDeliveryAbove}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Zones */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Delivery Zones</h2>

        <div className="space-y-4">
          {settings.zones.map((zone, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-900">{zone.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{zone.radius}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Delivery Charge</p>
                  <p className="text-2xl font-bold text-green-600">₹{zone.charge}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
        <h3 className="font-bold text-slate-900 mb-4">Important Guidelines</h3>
        <ul className="space-y-3 text-gray-700 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span>Maximum delivery radius is limited to 5 KM</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span>Set different rates for different delivery zones</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span>Offer free delivery for orders above minimum amount</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span>Delivery charges are automatically calculated based on customer location</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DeliveryLimitSettings;
