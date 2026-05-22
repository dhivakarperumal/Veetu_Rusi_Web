import React, { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const DailyMenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });

  const [itemToAdd, setItemToAdd] = useState({ category: "", item: "" });

  const handleDateChange = (e) => {
    setFormData({ ...formData, date: e.target.value });
  };

  const addMenuItem = () => {
    if (!itemToAdd.item.trim()) {
      toast.error("Please enter item name");
      return;
    }
    const { category } = itemToAdd;
    setFormData({
      ...formData,
      [category]: [...formData[category], itemToAdd.item],
    });
    setItemToAdd({ category: "", item: "" });
    toast.success("Item added!");
  };

  const removeMenuItem = (category, index) => {
    const updated = formData[category].filter((_, i) => i !== index);
    setFormData({ ...formData, [category]: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }
    setMenus([...menus, { ...formData, id: Date.now() }]);
    toast.success("Menu saved for " + formData.date);
    setFormData({
      date: "",
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    });
  };

  const deleteMenu = (id) => {
    setMenus(menus.filter((m) => m.id !== id));
    toast.success("Menu deleted!");
  };

  const categoryLabel = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snacks",
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Daily Menu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plan your daily menu for breakfast, lunch, dinner, and snacks
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={handleDateChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Category
          </label>
          <select
            value={itemToAdd.category}
            onChange={(e) =>
              setItemToAdd({ ...itemToAdd, category: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a category</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>
        </div>

        {/* Add Item */}
        {itemToAdd.category && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Add {categoryLabel[itemToAdd.category]} Item
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={itemToAdd.item}
                onChange={(e) =>
                  setItemToAdd({ ...itemToAdd, item: e.target.value })
                }
                placeholder="e.g., Biryani with Raita"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addMenuItem}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Menu Items by Category */}
        {["breakfast", "lunch", "dinner", "snacks"].map((category) => (
          <div key={category}>
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              {categoryLabel[category]} Menu
            </h3>
            {formData[category].length === 0 ? (
              <p className="text-sm text-gray-500">No items added</p>
            ) : (
              <div className="space-y-2">
                {formData[category].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-gray-700">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeMenuItem(category, idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
        >
          Save Daily Menu
        </button>
      </form>

      {/* Menus List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Menus</h2>
        {menus.length === 0 ? (
          <p className="text-gray-500">No menus created yet.</p>
        ) : (
          <div className="grid gap-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-lg shadow p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      {new Date(menu.date).toLocaleDateString()}
                    </h3>
                  </div>
                  <button
                    onClick={() => deleteMenu(menu.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["breakfast", "lunch", "dinner", "snacks"].map((cat) => (
                    <div key={cat}>
                      <p className="text-xs font-bold text-gray-600 uppercase">
                        {categoryLabel[cat]}
                      </p>
                      <p className="text-sm text-slate-900 mt-1">
                        {menu[cat].length} items
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMenuManagement;
