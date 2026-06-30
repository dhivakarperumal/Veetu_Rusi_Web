import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiRefreshCw } from "react-icons/fi";
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
      const chefList = allChefs.map(c => ({ value: c.id, label: c.name || c.store_name || `Chef ${c.id}` }));
      setChefs(chefList);

      const allFoods = Array.isArray(prodRes.data) ? prodRes.data : [];
      const prodList = allFoods.map(p => ({ value: p.id, label: `${p.name || p.food_name || 'Product'} (Chef ID: ${p.chef_id || 'Unknown'})` }));
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coupons Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <FiPlus /> Add New Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button onClick={fetchCoupons} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <FiRefreshCw />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Discount</th>
                <th className="p-4 font-semibold">Validity</th>
                <th className="p-4 font-semibold">Usage</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No coupons found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{coupon.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{coupon.description}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-blue-600">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      </div>
                      {coupon.max_discount_amount && <div className="text-xs text-gray-500">Up to ₹{coupon.max_discount_amount}</div>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">Start: {new Date(coupon.start_date).toLocaleDateString()}</div>
                      <div className="text-sm">End: {new Date(coupon.expiry_date).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{coupon.usage_count} {coupon.usage_limit_global ? `/ ${coupon.usage_limit_global}` : 'used'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${coupon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition mr-2">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{currentCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800"><FiTrash2 className="hidden" /> &times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="couponForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Code *</label>
                    <input required type="text" name="code" value={formData.code} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. SUMMER50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Summer Special Sale" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" rows="2" placeholder="Brief description of the coupon..."></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type *</label>
                    <select required name="discount_type" value={formData.discount_type} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Value *</label>
                    <input required type="number" step="0.01" name="discount_value" value={formData.discount_value} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 50" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Discount Amount (₹)</label>
                    <input type="number" step="0.01" name="max_discount_amount" value={formData.max_discount_amount} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Leave blank for no limit" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min Order Value (₹)</label>
                    <input type="number" step="0.01" name="min_order_value" value={formData.min_order_value} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time *</label>
                    <input required type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date & Time *</label>
                    <input required type="datetime-local" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Usage Limit (Global)</label>
                    <input type="number" name="usage_limit_global" value={formData.usage_limit_global} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Leave blank for unlimited" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Limit Per Customer</label>
                    <input type="number" name="usage_limit_per_customer" value={formData.usage_limit_per_customer} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" min="1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 p-4 border rounded-xl bg-gray-50/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Applies To *</label>
                    <select name="coupon_scope" value={formData.coupon_scope} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-4">
                      <option value="all">All Products (Global)</option>
                      <option value="first_order_only">First Order Only</option>
                      <option value="new_customers_only">New Customers Only</option>
                      <option value="specific_home_chef">Specific Home Chef(s)</option>
                      <option value="specific_products">Specific Product(s)</option>
                      <option value="specific_categories">Specific Category(s)</option>
                    </select>

                    {formData.coupon_scope === 'specific_home_chef' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Home Chefs</label>
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
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Products</label>
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
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Categories</label>
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
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 bg-white border hover:bg-gray-50 transition">Cancel</button>
              <button form="couponForm" type="submit" className="px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition">Save Coupon</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
