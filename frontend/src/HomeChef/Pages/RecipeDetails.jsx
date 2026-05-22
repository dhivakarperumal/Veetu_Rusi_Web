import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const RecipeDetails = () => {
  const [recipes, setRecipes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    ingredients: [],
    instructions: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    difficulty: "medium",
    tags: [],
  });

  const [ingredient, setIngredient] = useState("");
  const [tag, setTag] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addIngredient = () => {
    if (ingredient.trim()) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredient],
      });
      setIngredient("");
    }
  };

  const addTag = () => {
    if (tag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      setTag("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || formData.ingredients.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setRecipes([...recipes, { ...formData, id: Date.now() }]);
    toast.success("Recipe added successfully!");
    setFormData({
      name: "",
      ingredients: [],
      instructions: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      difficulty: "medium",
      tags: [],
    });
  };

  const deleteRecipe = (id) => {
    setRecipes(recipes.filter((r) => r.id !== id));
    toast.success("Recipe deleted!");
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Recipe Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your recipes and cooking instructions
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Recipe Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Paneer Tikka"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Difficulty Level
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Prep Time (mins)
            </label>
            <input
              type="number"
              name="prepTime"
              value={formData.prepTime}
              onChange={handleInputChange}
              placeholder="15"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Cook Time (mins)
            </label>
            <input
              type="number"
              name="cookTime"
              value={formData.cookTime}
              onChange={handleInputChange}
              placeholder="30"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Servings
            </label>
            <input
              type="number"
              name="servings"
              value={formData.servings}
              onChange={handleInputChange}
              placeholder="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Ingredients *
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder="Add ingredient..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            placeholder="Step by step instructions..."
            rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., Vegetarian, Spicy"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
        >
          Save Recipe
        </button>
      </form>

      {/* Recipes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-gray-500">No recipes added yet.</p>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {recipe.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Prep: {recipe.prepTime} mins | Cook: {recipe.cookTime} mins |
                    Serves: {recipe.servings}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecipe(recipe.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetails;
