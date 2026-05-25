import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Plus, Edit2, Trash2, CheckCircle, X, Search, Clock, Activity, IndianRupee } from 'lucide-react';
import { createPortal } from 'react-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SubscriptionPlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [form, setForm] = useState({
    id: '',
    name: '',
    amount: '',
    currency: 'INR',
    durationDays: '',
    status: 'Active'
  });

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        toast.error('Failed to fetch subscription plans');
      }
    } catch (err) {
      toast.error('Network error while fetching plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({ ...plan });
    } else {
      setEditingPlan(null);
      setForm({
        id: `plan_${Date.now()}`,
        name: '',
        amount: '',
        currency: 'INR',
        durationDays: '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editingPlan ? 'PUT' : 'POST';
    const url = editingPlan 
      ? `${API_BASE_URL}/subscriptions/admin/plans/${editingPlan.id}`
      : `${API_BASE_URL}/subscriptions/admin/plans`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Plan saved successfully');
        fetchPlans();
        setIsModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to save plan');
      }
    } catch (err) {
      toast.error('Error saving plan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan? It's recommended to mark it as 'Inactive' instead if users are currently using it.")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete plan');
      }
    } catch (err) {
      toast.error('Error deleting plan');
    }
  };

  const handleToggleStatus = async (plan) => {
    const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...plan, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Plan marked as ${newStatus}`);
        fetchPlans();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const activePlans = plans.filter(p => p.status === 'Active').length;

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Subscription Plans</h2>
          <p className="text-slate-500 font-medium mt-1">Manage pricing, durations, and active plans for franchises.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D22]/30 hover:shadow-[#1B4D22]/50 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 border-l-4 border-l-[#1B4D22] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1B4D22] shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Plans</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{plans.length}</h4>
          </div>
        </div>
        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Plans</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{activePlans}</h4>
          </div>
        </div>
        <div className="bg-white border border-slate-100 border-l-4 border-l-slate-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div className="flex-1 w-full relative">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Quick Search</p>
            <input 
              type="text" 
              placeholder="Search plans..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-[2rem] border-2 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl overflow-hidden flex flex-col ${
                plan.status === 'Active' ? 'border-transparent hover:border-emerald-100' : 'border-slate-100 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className={`p-6 pb-4 ${plan.status === 'Active' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    plan.status === 'Active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {plan.status}
                  </span>
                  {plan.durationDays >= 365 && plan.status === 'Active' && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 shadow-sm">
                      Best Value
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                <code className={`text-[10px] mt-1 block font-mono ${plan.status === 'Active' ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {plan.id}
                </code>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-slate-800">
                    {plan.currency === 'INR' ? '₹' : plan.currency}{Number(plan.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    / {plan.durationDays} Days
                  </span>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Valid for {plan.durationDays} Days</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Full Access to Franchise Panel</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={() => handleToggleStatus(plan)}
                    className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    {plan.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleOpenModal(plan)}
                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    title="Edit Plan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredPlans.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-3xl">
              <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Plans Found</h3>
              <p className="text-sm text-slate-400 mt-1">Create a new subscription plan to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1B4D22] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                <p className="text-xs text-emerald-300 font-bold mt-1">Configure plan pricing and validity</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 bg-slate-50">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Plan ID (Unique)</label>
                <input 
                  type="text" 
                  required 
                  disabled={!!editingPlan}
                  value={form.id} 
                  onChange={e => setForm({...form, id: e.target.value})} 
                  placeholder="e.g. plan_monthly"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#1B4D22] focus:ring-2 focus:ring-[#1B4D22]/20 transition-all disabled:bg-slate-100 disabled:text-slate-400" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Plan Name</label>
                <input 
                  type="text" 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. Monthly Standard"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#1B4D22] focus:ring-2 focus:ring-[#1B4D22]/20 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      required 
                      min="0"
                      step="0.01"
                      value={form.amount} 
                      onChange={e => setForm({...form, amount: e.target.value})} 
                      placeholder="1999"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold outline-none focus:border-[#1B4D22] focus:ring-2 focus:ring-[#1B4D22]/20 transition-all" 
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Duration (Days)</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={form.durationDays} 
                      onChange={e => setForm({...form, durationDays: e.target.value})} 
                      placeholder="30"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold outline-none focus:border-[#1B4D22] focus:ring-2 focus:ring-[#1B4D22]/20 transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Status</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#1B4D22] focus:ring-2 focus:ring-[#1B4D22]/20 transition-all cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1B4D22] hover:bg-[#153b1a] rounded-xl shadow-lg shadow-[#1B4D22]/30 hover:-translate-y-0.5 transition-all"
              >
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      , document.body)}
    </div>
  );
};

export default SubscriptionPlansManagement;
