import React, { useState } from "react";
import { Plus, Clock, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const MealSlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    slotName: "",
    startTime: "",
    endTime: "",
    capacity: "",
    type: "lunch",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.slotName ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.capacity
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setSlots([...slots, { ...formData, id: Date.now(), booked: 0 }]);
    toast.success("Meal slot created!");
    setFormData({
      slotName: "",
      startTime: "",
      endTime: "",
      capacity: "",
      type: "lunch",
    });
  };

  const deleteSlot = (id) => {
    setSlots(slots.filter((s) => s.id !== id));
    toast.success("Slot deleted!");
  };

  const mealTypes = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snacks",
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Meal Slot Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage meal delivery slots
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Slot Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Slot Name *
            </label>
            <input
              type="text"
              name="slotName"
              value={formData.slotName}
              onChange={handleInputChange}
              placeholder="e.g., Morning Batch"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Meal Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(mealTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Capacity *
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              placeholder="e.g., 20"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
        >
          Create Slot
        </button>
      </form>

      {/* Slots List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Meal Slots</h2>
        {slots.length === 0 ? (
          <p className="text-gray-500">No slots created yet.</p>
        ) : (
          <div className="grid gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {slot.slotName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {mealTypes[slot.type]}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">
                      Time
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-slate-900">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-bold">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">
                      Capacity
                    </p>
                    <p className="font-bold text-slate-900 mt-1">
                      {slot.capacity} meals
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase">
                      Booked
                    </p>
                    <p className="font-bold text-green-600 mt-1">
                      {slot.booked} / {slot.capacity}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(slot.booked / slot.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealSlotManagement;
