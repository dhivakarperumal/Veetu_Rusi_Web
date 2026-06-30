import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiRefreshCw, FiTag, FiCheckCircle, FiXCircle, FiList, FiGrid } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Select from "react-select";
import api from "../../api";
import Loader from "../../Components/CommenComponents/Loader";

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount_amount: "",
    min_order_value: "0",
    start_date: "",
    expiry_date: "",
    usage_limit_global: "",
    usage_limit_per_customer: "1",
    status: "active",
    coupon_scope: "all",
    applicable_home_chef_ids: [],
    applicable_product_ids: [],
    applicable_category_ids: [],
    applicable_subcategory_ids: []
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coupons');
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [chefRes, prodRes, catRes] = await Promise.all([
        api.get('/admin/homechefs').catch(() => ({ data: [] })),
        api.get('/chef-foods').catch(() => ({ data: [] })),
        api.get('/home-chef-categories').catch(() => ({ data: [] }))
      ]);

      const allChefs = Array.isArray(chefRes.data) ? chefRes.data : [];
      const chefList = allChefs.map(c => {
        const phone = c.phone || c.mobile || c.chef_phone || '';
        const name = c.name || c.store_name || `Chef ${c.id}`;
        return { value: c.id, label: phone ? `${name} (${phone})` : name };
      });
      setChefs(chefList);

      const allFoods = Array.isArray(prodRes.data) ? prodRes.data : [];
      const prodList = allFoods.map(p => {
        const phone = p.chef_phone || p.mobile || p.created_by_phone || '';
        const chefName = p.chef_name || p.kitchen_name || p.created_by || p.franchise_name || `Chef ID: ${p.chef_id || 'Unknown'}`;
        const productName = p.name || p.food_name || 'Product';
        return { 
          value: p.id, 
          label: `${productName} (${chefName}${phone ? ` - ${phone}` : ''})` 
        };
      });
      setProducts(prodList);

      const allCategories = Array.isArray(catRes.data) ? catRes.data : [];
      const catList = allCategories.map(c => ({ value: c.id, label: c.c_name || c.name || `Category ${c.id}` }));
      setCategories(catList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchOptions();
  }, []);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setCurrentCoupon(coupon);
      setFormData({
        ...coupon,
        start_date: new Date(coupon.start_date).toISOString().slice(0, 16),
        expiry_date: new Date(coupon.expiry_date).toISOString().slice(0, 16),
      });
    } else {
      setCurrentCoupon(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        max_discount_amount: "",
        min_order_value: "0",
        start_date: "",
        expiry_date: "",
        usage_limit_global: "",
        usage_limit_per_customer: "1",
        status: "active",
        coupon_scope: "all",
        applicable_home_chef_ids: [],
        applicable_product_ids: [],
        applicable_category_ids: [],
        applicable_subcategory_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCoupon(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOptions, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedOptions ? selectedOptions.map(opt => opt.value) : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date.replace('T', ' ') + ':00',
        expiry_date: formData.expiry_date.replace('T', ' ') + ':00',
      };

      if (currentCoupon) {
        const { data } = await api.put(`/coupons/${currentCoupon.id}`, payload);
        if (data.success) toast.success('Coupon updated successfully');
      } else {
        const { data } = await api.post('/coupons', payload);
        if (data.success) toast.success('Coupon created successfully');
      }
      fetchCoupons();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        const { data } = await api.delete(`/coupons/${id}`);
        if (data.success) {
          toast.success("Coupon deleted successfully");
          fetchCoupons();
        }
      } catch (err) {
        toast.error("Failed to delete coupon");
      }
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  const totalCount = coupons.length;
  const activeCount = coupons.filter(c => c.status === 'active').length;
  const inactiveCount = coupons.filter(c => c.status === 'inactive').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Coupons Management</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">Premium dashboard for managing discount codes, validity, and usage limits.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" /> Add New Coupon
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 border-l-4 border-l-blue-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50 flex-shrink-0">
            <FiTag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Total Coupons</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{totalCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 flex-shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Coupons</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{activeCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 border-l-4 border-l-rose-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100/50 flex-shrink-0">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Inactive Coupons</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{inactiveCount}</h4>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Refresh */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 p-5 rounded-[1.75rem] shadow-2xl shadow-slate-950/30">
        <div className="relative flex-1 max-w-xl w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-medium text-slate-100 text-sm focus:bg-slate-900 focus:border-blue-500/70 transition-all placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 self-end xl:self-auto">
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 rounded-xl transition ${viewMode === "table" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-100"}`}
              title="Table View"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-3 rounded-xl transition ${viewMode === "card" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-100"}`}
              title="Card View"
            >
              <FiGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={fetchCoupons} className="p-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition" title="Refresh">
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === "table" ? (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-700">
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Code</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Name</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Discount</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Validity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Usage</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Scope</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                    No coupons found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm border border-slate-800">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{coupon.name}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 max-w-[200px] truncate">{coupon.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-blue-600 text-sm">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      </div>
                      {coupon.max_discount_amount && <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Up to ₹{coupon.max_discount_amount}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-600">Start: {new Date(coupon.start_date).toLocaleDateString()}</div>
                      <div className="text-xs font-semibold text-slate-600 mt-1">End: {new Date(coupon.expiry_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700">{coupon.usage_count} {coupon.usage_limit_global ? `/ ${coupon.usage_limit_global}` : 'used'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700 capitalize">
                        {coupon.coupon_scope ? coupon.coupon_scope.replace(/_/g, ' ') : 'All'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${coupon.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition mr-2">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredCoupons.length === 0 ? (
            <div className="col-span-full p-8 bg-white rounded-2xl text-center text-slate-500 font-semibold shadow-sm border border-slate-100">
              No coupons found. Create one to get started.
            </div>
          ) : (
            filteredCoupons.map((coupon) => (
              <div key={coupon.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-flex px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm border border-slate-800 mb-3">
                      {coupon.code}
                    </span>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{coupon.name}</h3>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 line-clamp-2">{coupon.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border flex-shrink-0 ${coupon.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {coupon.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discount</p>
                    <div className="font-black text-blue-600">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </div>
                    {coupon.max_discount_amount && <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Up to ₹{coupon.max_discount_amount}</div>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scope</p>
                    <div className="font-bold text-slate-700 text-sm capitalize">{coupon.coupon_scope ? coupon.coupon_scope.replace(/_/g, ' ') : 'All'}</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usage</p>
                    <div className="font-bold text-slate-700 text-sm">{coupon.usage_count} {coupon.usage_limit_global ? `/ ${coupon.usage_limit_global}` : ''}</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                    <div className="font-bold text-slate-700 text-sm">{new Date(coupon.expiry_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-2">
                  <button onClick={() => handleOpenModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative z-[10000] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="bg-blue-600 p-8 text-white relative flex-shrink-0">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-[900] tracking-tight uppercase">{currentCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
                  <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">Manage discount settings and limits</p>
                </div>
                <button type="button" onClick={handleCloseModal} className="p-3 bg-black/10 hover:bg-black/20 rounded-2xl transition-all text-xl font-bold">
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <form id="couponForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Coupon Code *</label>
                    <input required type="text" name="code" value={formData.code} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" placeholder="e.g. SUMMER50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Coupon Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" placeholder="e.g. Summer Special Sale" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 transition-all font-black text-black text-sm resize-none" rows="2" placeholder="Brief description of the coupon..."></textarea>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Discount Type *</label>
                    <select required name="discount_type" value={formData.discount_type} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Discount Value *</label>
                    <input required type="number" step="0.01" name="discount_value" value={formData.discount_value} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" placeholder="e.g. 50" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Max Discount Amount (₹)</label>
                    <input type="number" step="0.01" name="max_discount_amount" value={formData.max_discount_amount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" placeholder="Leave blank for no limit" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Min Order Value (₹)</label>
                    <input type="number" step="0.01" name="min_order_value" value={formData.min_order_value} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Start Date & Time *</label>
                    <input required type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Expiry Date & Time *</label>
                    <input required type="datetime-local" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Total Usage Limit (Global)</label>
                    <input type="number" name="usage_limit_global" value={formData.usage_limit_global} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" placeholder="Leave blank for unlimited" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Usage Limit Per Customer</label>
                    <input type="number" name="usage_limit_per_customer" value={formData.usage_limit_per_customer} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm" min="1" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 p-6 border-2 border-dashed border-blue-100 rounded-[2rem] bg-blue-50/30 shadow-sm">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Coupon Applies To *</label>
                    <select name="coupon_scope" value={formData.coupon_scope} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-black text-black text-sm mb-4 shadow-sm">
                      <option value="all">All Products (Global)</option>
                      <option value="first_order_only">First Order Only</option>
                      <option value="new_customers_only">New Customers Only</option>
                      <option value="specific_home_chef">Specific Home Chef(s)</option>
                      <option value="specific_products">Specific Product(s)</option>
                      <option value="specific_categories">Specific Category(s)</option>
                    </select>

                    {formData.coupon_scope === 'specific_home_chef' && (
                      <div className="mb-4 animate-in fade-in zoom-in-95 duration-300">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Select Home Chefs</label>
                        <Select 
                          isMulti 
                          options={chefs} 
                          value={chefs.filter(c => formData.applicable_home_chef_ids.includes(c.value))}
                          onChange={(opts) => handleSelectChange(opts, 'applicable_home_chef_ids')}
                          className="react-select-container text-black"
                          classNamePrefix="react-select"
                          placeholder="Search and select chefs..."
                          styles={{
                            option: (provided) => ({ ...provided, color: '#000' }),
                            singleValue: (provided) => ({ ...provided, color: '#000' }),
                            multiValueLabel: (provided) => ({ ...provided, color: '#000' })
                          }}
                        />
                      </div>
                    )}

                    {formData.coupon_scope === 'specific_products' && (
                      <div className="mb-4 animate-in fade-in zoom-in-95 duration-300">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Select Products</label>
                        <Select 
                          isMulti 
                          options={products} 
                          value={products.filter(p => formData.applicable_product_ids.includes(p.value))}
                          onChange={(opts) => handleSelectChange(opts, 'applicable_product_ids')}
                          className="react-select-container text-black"
                          classNamePrefix="react-select"
                          placeholder="Search and select products..."
                          styles={{
                            option: (provided) => ({ ...provided, color: '#000' }),
                            singleValue: (provided) => ({ ...provided, color: '#000' }),
                            multiValueLabel: (provided) => ({ ...provided, color: '#000' })
                          }}
                        />
                      </div>
                    )}

                    {formData.coupon_scope === 'specific_categories' && (
                      <div className="mb-4 animate-in fade-in zoom-in-95 duration-300">
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Select Categories</label>
                        <Select 
                          isMulti 
                          options={categories} 
                          value={categories.filter(c => formData.applicable_category_ids.includes(c.value))}
                          onChange={(opts) => handleSelectChange(opts, 'applicable_category_ids')}
                          className="react-select-container text-black"
                          classNamePrefix="react-select"
                          placeholder="Search and select categories..."
                          styles={{
                            option: (provided) => ({ ...provided, color: '#000' }),
                            singleValue: (provided) => ({ ...provided, color: '#000' }),
                            multiValueLabel: (provided) => ({ ...provided, color: '#000' })
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-8 flex justify-end gap-3 bg-white">
              <button type="button" onClick={handleCloseModal} className="px-8 py-3.5 rounded-2xl font-[900] text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
              <button form="couponForm" type="submit" className="px-8 py-3.5 rounded-2xl font-[900] text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all uppercase tracking-widest text-xs flex items-center gap-2">Save Coupon</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Coupons;
