import React, { useEffect, useState } from 'react';
import { useAuth } from '../../PrivateRouter/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiBox,
  FiPackage,
  FiGrid,
  FiList
} from 'react-icons/fi';

const MyProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (id) => navigate(`/chef/add-products/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully.');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const chefUserId = user?.user_id || user?.id;
        if (!chefUserId) return setProducts([]);
        
        // Fetch products directly from chef_products table using the new endpoint
        const res = await api.get(`/products/user/${chefUserId}`);
        
        // Handle both old format (array) and new format (object with data property)
        let allItems = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // If response contains all chef_products, no need to filter
        setProducts(allItems);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        toast.error('Failed to load your products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code?.includes(searchTerm) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = products.filter(p => p.status === 'Active').length;
  const lowStockCount = products.filter(p => p.status === 'Low Stock').length;
  const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Low Stock': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Out of Stock': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getProductImage = (product) => {
    try {
      // 1. Try images array (already parsed, JSON string, or double-stringified)
      if (product.images) {
        let imgs = product.images;
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch { imgs = null; }
        }
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch { imgs = null; }
        }
        if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
          return imgs[0];
        }
      }
      // 2. packaging_image fallback (chef_food_table)
      if (product.packaging_image) {
        return product.packaging_image;
      }
      // 3. variants fallback (legacy)
      if (product.variants?.length > 0 && product.variants[0]?.images) {
        let imgs = product.variants[0].images;
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch { imgs = null; }
        }
        if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
          return imgs[0];
        }
      }
    } catch (e) {
      console.error('Error parsing images:', e);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=10b981&color=fff&size=400`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading your products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">My Products</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
            Manage your listed products and inventory
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#0f1628] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-blue-700/40">
              <FiBox className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-blue-300/70 font-black uppercase tracking-[0.2em]">Total Products</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{products.length}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">Your listings</p>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">Active</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{activeCount}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">Available to sell</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
              <FiAlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">Low Stock</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{lowStockCount}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1\">Need refill soon</p>
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-rose-500/40 via-red-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#1a0a0a] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-4 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/40">
              <FiXCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-rose-300/70 font-black uppercase tracking-[0.2em]\">Out of Stock</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{outOfStockCount}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">Unavailable</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        filteredProducts.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-200">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=10b981&color=fff&size=400`; }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-1">
                              {product.product_code || `PRD-${product.id}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${getStatusStyle(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 group/stock">
                          <FiPackage className="text-gray-300 transition-colors" size={14} />
                          <span className="text-sm font-black text-slate-700 transition-colors">
                            {product.total_stock ?? 0}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">Units</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800">₹{parseFloat(product.final_price || product.offer_price || product.mrp || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 line-through font-bold">₹{parseFloat(product.mrp || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setViewingProduct(product)}
                            className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting}
                            className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
              <FiBox size={40} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Products Found</p>
            <p className="text-slate-300 font-bold text-[10px] mt-2 italic px-8">
              {searchTerm ? `"${searchTerm}" did not match any products.` : 'You have not added any products yet.'}
            </p>
          </div>
        )
      ) : (
        /* Grid View */
        filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'P')}&background=10b981&color=fff&size=400`; }}
                  />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md pointer-events-auto shadow-sm ${getStatusStyle(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 truncate">{product.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{product.category}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                    <span className="text-base font-black text-slate-800">₹{parseFloat(product.offer_price || product.mrp || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-black text-gray-400">Stock: {product.total_stock ?? 0}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewingProduct(product)}
                      className="flex-1 p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all text-center"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
              <FiBox size={40} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Products Found</p>
            <p className="text-slate-300 font-bold text-[10px] mt-2 italic px-8">
              {searchTerm ? `"${searchTerm}" did not match any products.` : 'You have not added any products yet.'}
            </p>
          </div>
        )
      )}



      {/* Product Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingProduct(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-20 overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            {/* Header with Image */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 aspect-video overflow-hidden">
              <img
                src={getProductImage(viewingProduct)}
                alt={viewingProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingProduct(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur transition-all z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-6 text-white">
                <h2 className="text-3xl font-black uppercase tracking-tight">{viewingProduct.name}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Code</p>
                  <p className="text-lg font-black text-slate-800">{viewingProduct.product_code || `PRD-${viewingProduct.id}`}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</p>
                  <p className="text-lg font-black text-slate-800">{viewingProduct.category || 'Uncategorized'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${getStatusStyle(viewingProduct.status)}`}>
                    {viewingProduct.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU</p>
                  <p className="text-lg font-black text-slate-800">{viewingProduct.sku || 'N/A'}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-100 pt-6 grid grid-cols-3 gap-4">
                <div className="space-y-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">MRP</p>
                  <p className="text-2xl font-black text-slate-800">₹{parseFloat(viewingProduct.mrp || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Offer Price</p>
                  <p className="text-2xl font-black text-slate-800">₹{parseFloat(viewingProduct.offer_price || viewingProduct.mrp || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Discount</p>
                  <p className="text-2xl font-black text-slate-800">
                    {viewingProduct.mrp && viewingProduct.offer_price 
                      ? Math.round(((viewingProduct.mrp - viewingProduct.offer_price) / viewingProduct.mrp) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Stock & Inventory */}
              <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Stock</p>
                  <p className="text-2xl font-black text-slate-800">{viewingProduct.total_stock || 0} Units</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Minimum Stock</p>
                  <p className="text-2xl font-black text-slate-800">{viewingProduct.minimum_stock || 0} Units</p>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div className="border-t border-gray-100 pt-6 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{viewingProduct.description}</p>
                </div>
              )}

              {/* Additional Details */}
              <div className="border-t border-gray-100 pt-6 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold">Created Date</p>
                    <p className="font-black text-slate-800 text-xs mt-1">{new Date(viewingProduct.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold">Last Updated</p>
                    <p className="font-black text-slate-800 text-xs mt-1">{new Date(viewingProduct.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 p-8 bg-gray-50 flex gap-3">
              <button
                onClick={() => setViewingProduct(null)}
                className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 text-slate-800 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG Helper Components
const FiCheckCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const FiAlertCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const FiXCircle = () => <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;

export default MyProducts;
