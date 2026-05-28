import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const FoodProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAddPage = location.pathname.endsWith('/add');
  const isEditPage = location.pathname.includes('/edit/');
  const isDetailsPage = !isAddPage && !isEditPage;

  const parseImageList = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed) return [parsed];
      } catch {
        return [images].filter(Boolean);
      }
    }
    return [];
  };

  const getFoodImages = (foodItem) => {
    const list = parseImageList(foodItem?.images);
    if (list.length > 0) return list;
    if (foodItem?.image) return [foodItem.image];
    return [];
  };

  useEffect(() => {
    if (!isAddPage && id) {
      const loadFood = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/chef-foods/${id}`);
          setFood(res.data);
        } catch (err) {
          console.error('Failed to load food product details', err);
          toast.error('Failed to load food product details');
          setFood(null);
        } finally {
          setLoading(false);
        }
      };

      void loadFood();
    }
  }, [id, isAddPage]);

  const title = isAddPage
    ? 'Add Food Product'
    : isEditPage
    ? 'Edit Food Product'
    : 'Food Product Details';

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/admin/food-products')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Food Products
            </button>
          </div>
          <h2 className="text-3xl font-black text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            {isAddPage
              ? 'Use this section to start adding a chef food product. This admin route is currently a safe placeholder to avoid a broken page.'
              : isEditPage
              ? 'Update the chef food item information and save your changes.'
              : 'Inspect the details for this chef food product.'}
          </p>
        </div>
        {isDetailsPage && food && (
          <button
            type="button"
            onClick={() => navigate(`/admin/food-products/edit/${id}`)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-3 text-sm font-black uppercase tracking-[0.24em] text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
          >
            <Edit2 className="w-4 h-4" /> Edit Food
          </button>
        )}
      </div>

      {isAddPage ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <p className="text-slate-600">
            Admin creation of chef food products is currently unavailable in this panel. Please use the Home Chef portal to add and manage food product listings.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <p className="text-slate-500">Loading food product details...</p>
        </div>
      ) : !food ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <p className="text-slate-500">Food product details could not be loaded.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Food Name</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{food.name || 'Unnamed item'}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Category</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{food.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Cuisine</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{food.cuisine || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Price</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">₹{food.final_price ?? food.mrp ?? '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{food.status || 'Unknown'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Description</p>
                <p className="text-sm leading-7 text-slate-700">{food.description || 'No description available.'}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Chef Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{food.chef_name || food.kitchen_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Chef Phone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{food.chef_phone || food.mobile || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Ingredients</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{(Array.isArray(food.ingredients) ? food.ingredients.join(', ') : food.ingredients) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Instructions</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{Array.isArray(food.instructions) ? food.instructions.join(' ') : food.instructions || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl shadow-slate-950/10">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                <img
                  src={getFoodImages(food)[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(food.name || 'Food')}&background=0d3c6f&color=fff&size=512`}
                  alt={food.name || 'Food image'}
                  className="h-56 w-full object-cover"
                />
              </div>
              {getFoodImages(food).length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {getFoodImages(food).slice(0, 3).map((src, idx) => (
                    <div key={idx} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                      <img src={src} alt={`${food.name || 'Food'} ${idx + 1}`} className="h-20 w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Food ID</p>
                <p className="mt-2 font-black text-white/90">{food.id}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Chef ID</p>
                <p className="mt-2 font-semibold text-white/80">{food.chef_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Franchise</p>
                <p className="mt-2 font-semibold text-white/80">{food.franchise_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Created</p>
                <p className="mt-2 font-semibold text-white/80">{food.created_at ? new Date(food.created_at).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodProductDetails;
