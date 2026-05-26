import React, { useEffect, useState } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiList, FiGrid } from "react-icons/fi";
import toast from "react-hot-toast";

const initialForm = {
  title: "",
  description: "",
  category: "",
  status: "Active",
  ingredients: [],
  instructions: "",
};

const RecipeDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [ingredient, setIngredient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const chefUserId = user?.user_id || user?.id;

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        if (!chefUserId) return;
        const res = await api.get("/chef/recipes", { params: { chef_user_id: chefUserId } });
        setRecipes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load recipes:", err);
        toast.error("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [chefUserId]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingRecipeId(null);
    setIngredient("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addIngredient = () => {
    if (!ingredient.trim()) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient.trim()],
    }));
    setIngredient("");
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index),
    }));
  };

  const handleEdit = (recipe) => {
    setEditingRecipeId(recipe.id);
    setFormData({
      title: recipe.title || "",
      description: recipe.description || "",
      category: recipe.category || "",
      status: recipe.status || "Active",
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recipe? This action cannot be undone.")) return;
    try {
      await api.delete(`/chef/recipes/${id}`);
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      toast.success("Recipe deleted successfully");
    } catch (err) {
      console.error("Delete recipe error:", err);
      toast.error(err.response?.data?.message || "Failed to delete recipe");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.ingredients.length === 0) {
      toast.error("Please add a title and at least one ingredient");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: formData.status,
      ingredients: formData.ingredients,
      instructions: formData.instructions,
      chef_user_id: chefUserId,
    };

    try {
      if (editingRecipeId) {
        await api.put(`/chef/recipes/${editingRecipeId}`, payload);
        setRecipes((prev) => prev.map((recipe) => recipe.id === editingRecipeId ? { ...recipe, ...payload } : recipe));
        toast.success("Recipe updated successfully");
      } else {
        const res = await api.post("/chef/recipes", payload);
        setRecipes((prev) => [
          {
            id: res.data.id,
            ...payload,
            recipe_code: res.data.recipe_code,
          },
          ...prev,
        ]);
        toast.success("Recipe created successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Recipe save error:", err);
      toast.error(err.response?.data?.message || "Failed to save recipe");
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      recipe.title?.toLowerCase().includes(query) ||
      recipe.category?.toLowerCase().includes(query) ||
      recipe.recipe_code?.toLowerCase().includes(query)
    );
  });

  const totalRecipes = recipes.length;
  const activeRecipes = recipes.filter((recipe) => recipe.status === "Active").length;
  const inactiveRecipes = totalRecipes - activeRecipes;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Recipe Details</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your recipe details and save them to the backend.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95"
        >
          <FiPlus className="w-4 h-4" /> {editingRecipeId ? "New Recipe" : "Add Recipe"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Total Recipes</p>
          <h2 className="mt-4 text-4xl font-black text-slate-900">{totalRecipes}</h2>
          <p className="mt-2 text-sm text-slate-500">Recipes available in backend</p>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Active</p>
          <h2 className="mt-4 text-4xl font-black text-slate-900">{activeRecipes}</h2>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Inactive</p>
          <h2 className="mt-4 text-4xl font-black text-slate-900">{inactiveRecipes}</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Recipe Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Paneer Tikka Masala"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Indian, Dessert, Snack"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Short recipe summary"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Ingredients *</label>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="text"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                placeholder="Add ingredient"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4D22] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153b1a]"
              >
                <FiPlus /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.ingredients.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows="5"
              placeholder="Step by step preparation instructions"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black uppercase tracking-[0.15em] text-white transition hover:bg-emerald-700"
            >
              <FiPlus /> {editingRecipeId ? "Update Recipe" : "Save Recipe"}
            </button>
            {editingRecipeId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Your Recipes</h2>
            <p className="text-sm text-slate-500 mt-1">View and manage all saved recipe details.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipes..."
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-full p-2 text-slate-600 transition ${viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-white"}`}
              >
                <FiList />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-full p-2 text-slate-600 transition ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-white"}`}
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading recipes...</div>
        ) : filteredRecipes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">No recipes found.</div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{recipe.category || "General"}</p>
                    <h3 className="mt-3 text-lg font-black text-slate-900">{recipe.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{recipe.description || "No description provided."}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(recipe)}
                      className="rounded-2xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(recipe.id)}
                      className="rounded-2xl bg-rose-100 p-2 text-rose-600 hover:bg-rose-200"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Status:</span> {recipe.status}</p>
                  <p><span className="font-semibold text-slate-900">Code:</span> {recipe.recipe_code || "--"}</p>
                  <p><span className="font-semibold text-slate-900">Ingredients:</span> {recipe.ingredients?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Recipe</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Ingredients</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{recipe.title}</div>
                      <div className="text-xs text-slate-500">{recipe.description || "No description"}</div>
                    </td>
                    <td className="px-4 py-4">{recipe.category || "General"}</td>
                    <td className="px-4 py-4">{recipe.status}</td>
                    <td className="px-4 py-4">{recipe.ingredients?.length || 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(recipe)}
                          className="rounded-2xl bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(recipe.id)}
                          className="rounded-2xl bg-rose-100 px-3 py-2 text-rose-600 hover:bg-rose-200"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetails;
