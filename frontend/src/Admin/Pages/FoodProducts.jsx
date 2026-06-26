import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { Eye, Edit2, Trash2, LayoutGrid, List, Search } from 'lucide-react';

const FoodProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sourceParam = new URLSearchParams(location.search).get('source');
  const [foods, setFoods] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState(sourceParam === 'chef_products' ? 'foodProducts' : 'food');
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalChecklist, setApprovalChecklist] = useState({ taste: false, quality: false, packaging: false });

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const res = await api.get('/admin/homechefs');
        setChefs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load chefs for filter', err);
      }
    };
    fetchChefs();
  }, []);

  const handleChefChange = (selectedChefId) => {
    const params = new URLSearchParams(location.search);
    if (selectedChefId && selectedChefId !== 'All') {
      params.set('chef_id', selectedChefId);
      params.delete('chef_user_id');
    } else {
      params.delete('chef_id');
      params.delete('chef_user_id');
    }
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const switchTab = (tab) => {
    const params = new URLSearchParams(location.search);
    if (tab === 'foodProducts') {
      params.set('source', 'chef_products');
    } else {
      params.delete('source');
    }
    navigate(`${location.pathname}?${params.toString()}`);
    setActiveTab(tab);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveTab(params.get('source') === 'chef_products' ? 'foodProducts' : 'food');
  }, [location.search]);

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(location.search);
      const query = {};
      if (params.get('chef_id')) query.chef_id = params.get('chef_id');
      if (params.get('chef_user_id')) query.chef_user_id = params.get('chef_user_id');
      if (params.get('category')) query.category = params.get('category');
      if (params.get('status')) query.status = params.get('status');

      const endpoint = activeTab === 'food' ? '/chef-foods' : '/products';
      if (activeTab === 'foodProducts') {
        query.source = 'chef_products';
      }

      const res = await api.get(endpoint, { params: query });
      setFoods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load foods', err);
      toast.error('Failed to load food products');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [location.search, activeTab]);

  useEffect(() => {
    const loadFoods = async () => {
      await fetchFoods();
    };

    loadFoods();
  }, [fetchFoods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((item) => {
      const matchesSearch = search
        ? [item.name, item.product_code, item.category, item.cuisine, item.product_type, item.chef_name, item.chef_phone, item.created_by, item.franchise_name]
            .filter(Boolean)
            .some((value) => value.toString().toLowerCase().includes(search.toLowerCase()))
        : true;
      let matchesStatus = true;
      if (statusFilter === 'Approved') {
        matchesStatus = item.status === 'Active' || item.status === 'Approved';
      } else if (statusFilter === 'Not Approved') {
        matchesStatus = item.status !== 'Active' && item.status !== 'Approved';
      } else if (statusFilter !== 'All') {
        matchesStatus = item.status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [foods, search, statusFilter]);

  const summary = useMemo(() => {
    const total = foods.length;
    const active = foods.filter((item) => item.status === 'Active' || item.status === 'Approved').length;
    const inactive = foods.filter((item) => ['Inactive', 'Suspended', 'Rejected'].includes(item.status)).length;
    return { total, active, inactive };
  }, [foods]);

  const statusOptions = ['All', 'Approved', 'Not Approved', 'Active', 'Inactive', 'Pending', 'Suspended', 'Rejected'];

  const getKitchenName = (item) => item.chef_name || item.kitchen_name || item.created_by || item.franchise_name || 'N/A';
  const getTypeDisplay = (item) => item.cuisine || item.product_type || item.category || '-';
  const getMobile = (item) => item.chef_phone || item.mobile || item.created_by_phone || '-';
  const getFoodDescription = (item) => item.description || item.category || item.product_type || 'No description';

  const handleStatusUpdate = async (item, newStatus) => {
    try {
      const endpoint = activeTab === 'food' ? `/chef-foods/${item.id}` : `/products/${item.id}`;
      await api.put(endpoint, { status: newStatus });
      toast.success(`Food status updated to ${newStatus}`);
      fetchFoods();
    } catch (err) {
      console.error('Failed to update food status', err);
      toast.error('Failed to update food status');
    }
  };

  const openApprovalModal = (item) => {
    setApprovalModalItem(item);
    setApprovalChecklist({ taste: false, quality: false, packaging: false });
  };

  const closeApprovalModal = () => {
    setApprovalModalItem(null);
    setApprovalChecklist({ taste: false, quality: false, packaging: false });
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!approvalModalItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [approvalModalItem]);

  const handleChecklistChange = (key) => {
    setApprovalChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canApprove = Object.values(approvalChecklist).every(Boolean);

  const handleApproveFromModal = async () => {
    if (!approvalModalItem) return;
    if (!canApprove) return;

    await handleStatusUpdate(approvalModalItem, 'Active');
    closeApprovalModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const endpoint = activeTab === 'food' ? `/chef-foods/${id}` : `/products/${id}`;
      await api.delete(endpoint);
      toast.success('Item deleted');
      fetchFoods();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const statusBadge = (status) => {
    if (status === 'Active' || status === 'Approved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-950/10 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-3xl bg-violet-600/20 p-3 text-violet-300">
              <div className="w-10 h-10 rounded-3xl bg-violet-500/10 flex items-center justify-center">🥘</div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Total Foods</span>
          </div>
          <p className="mt-6 text-5xl font-black tracking-tight">{summary.total}</p>
          <p className="mt-2 text-sm text-slate-400">All chef food items currently loaded.</p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-950/10 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-3xl bg-emerald-600/20 p-3 text-emerald-200">
              <div className="w-10 h-10 rounded-3xl bg-emerald-500/10 flex items-center justify-center">✅</div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Active Foods</span>
          </div>
          <p className="mt-6 text-5xl font-black tracking-tight">{summary.active}</p>
          <p className="mt-2 text-sm text-slate-400">Active food items ready for sale.</p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-950/10 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-3xl bg-rose-600/20 p-3 text-rose-200">
              <div className="w-10 h-10 rounded-3xl bg-rose-500/10 flex items-center justify-center">⛔</div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Inactive / Suspended</span>
          </div>
          <p className="mt-6 text-5xl font-black tracking-tight">{summary.inactive}</p>
          <p className="mt-2 text-sm text-slate-400">Food items currently inactive or blocked.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 superadmin-panel p-4 rounded-xl">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, mobile or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          {chefs.length > 0 && (
            <select
              value={new URLSearchParams(location.search).get('chef_id') || 'All'}
              onChange={(e) => handleChefChange(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-600 focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
            >
              <option value="All">All Chefs</option>
              {chefs.map((chef) => (
                <option key={chef.chef_id || chef.id} value={chef.chef_id || chef.id}>
                  {chef.name || 'Unnamed Chef'}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-600 focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All Statuses' : option}
              </option>
            ))}
          </select>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`} title="Table View">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("card")} className={`p-2 rounded-lg transition ${viewMode === "card" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`} title="Card View">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-full bg-slate-100 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => switchTab('food')}
            className={`px-5 py-3 rounded-full font-bold text-sm transition ${activeTab === 'food' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
          >
            Food
          </button>
          <button
            type="button"
            onClick={() => switchTab('foodProducts')}
            className={`px-5 py-3 rounded-full font-bold text-sm transition ${activeTab === 'foodProducts' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
          >
            Food Products
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {activeTab === 'food'
            ? 'Showing chef food items from chef_food_table.'
            : 'Showing chef products from chef_products table.'}
        </p>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-2xl overflow-hidden superadmin-card animate-in fade-in duration-200">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[960px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">S.No</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">Food Info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">Kitchen Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">Cuisine</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">Mobile</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.33em] text-slate-300 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">Loading food products...</td>
                  </tr>
                ) : filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">No food products found.</td>
                  </tr>
                ) : (
                  filteredFoods.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-slate-900">{item.name || item.product_code || 'Unnamed Food'}</div>
                        <div className="text-xs text-slate-500 mt-1">{getFoodDescription(item)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{getKitchenName(item)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{getTypeDisplay(item)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{getMobile(item)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusBadge(item.status)}`}>
                          {item.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                          {item.status !== 'Active' ? (
                            <button
                              type="button"
                              onClick={() => openApprovalModal(item)}
                              className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-100 transition"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item, 'Inactive')}
                              className="px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/food-products/${item.id}${activeTab === 'foodProducts' ? '?source=chef_products' : ''}`)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition"
                          ><Eye className="w-4 h-4" /></button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/food-products/edit/${item.id}${activeTab === 'foodProducts' ? '?source=chef_products' : ''}`)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition"
                          ><Edit2 className="w-4 h-4" /></button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                          ><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-3xl bg-white border border-slate-200 p-10 text-center text-slate-400">Loading food products...</div>
          ) : filteredFoods.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-white border border-slate-200 p-10 text-center text-slate-400">No food products found.</div>
          ) : (
            filteredFoods.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
                <div className="bg-slate-950 px-5 py-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.category || 'Food Product'}</p>
                      <h3 className="mt-2 text-xl font-black text-white">{item.name || 'Unnamed Food'}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusBadge(item.status)}`}>
                      {item.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <p className="text-sm text-slate-600">{item.description || 'No description available.'}</p>
                  <div className="grid gap-2 text-sm text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Kitchen</span>
                      <span>{item.chef_name || item.kitchen_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Cuisine</span>
                      <span>{item.cuisine || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">Phone</span>
                      <span>{item.chef_phone || item.mobile || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Price</p>
                      <p className="text-lg font-black text-slate-900">₹{item.final_price ?? item.mrp ?? '0.00'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.status !== 'Active' ? (
                        <button
                          type="button"
                          onClick={() => openApprovalModal(item)}
                          className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(item, 'Inactive')}
                          className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-700"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/food-products/${item.id}${activeTab === 'foodProducts' ? '?source=chef_products' : ''}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/food-products/edit/${item.id}${activeTab === 'foodProducts' ? '?source=chef_products' : ''}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {approvalModalItem && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0d1118] shadow-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Approve Food Item</h2>
                <p className="mt-2 text-sm text-slate-400">Select the required checks before approving this inactive product.</p>
              </div>
              <button onClick={closeApprovalModal} className="rounded-2xl bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 transition">Close</button>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-950/80 border border-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Food</p>
              <h3 className="mt-2 text-xl font-black text-white">{approvalModalItem.name || 'Unnamed Food'}</h3>
              <p className="mt-1 text-sm text-slate-500">{approvalModalItem.category || 'No category specified'}</p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-5">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Approval checklist</p>
                <div className="mt-4 space-y-3">
                  {['taste', 'quality', 'packaging'].map((key) => (
                    <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11151f] px-4 py-3 transition hover:border-emerald-500/40">
                      <input
                        type="checkbox"
                        checked={approvalChecklist[key]}
                        onChange={() => handleChecklistChange(key)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className="text-sm font-bold text-white">{key === 'taste' ? 'Taste' : key === 'quality' ? 'Quality' : 'Packaging'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-5">
                <p className="text-sm text-slate-400">Only when all checklist items are ticked will the approve button become available.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleApproveFromModal}
                  disabled={!canApprove}
                  className={`w-full sm:w-auto rounded-3xl px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition ${canApprove ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                >
                  Approve Product
                </button>
                <button
                  type="button"
                  onClick={closeApprovalModal}
                  className="w-full sm:w-auto rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default FoodProducts;
