import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Landmark, MapPin, UserCheck, Clock, List, KeyRound, Copy, X, CheckCircle, ChevronLeft, ShieldAlert, BadgeCheck, Phone, Mail, Trash2, Edit3, ShieldCheck } from "lucide-react";

const FranchiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedHomeChefCount, setLinkedHomeChefCount] = useState(0);
  const [linkedDeliveryPartnerCount, setLinkedDeliveryPartnerCount] = useState(0);
  const [linkedHomeChefs, setLinkedHomeChefs] = useState([]);
  const [linkedDeliveryPartners, setLinkedDeliveryPartners] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState("franchise");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const copy = (text) => { navigator.clipboard.writeText(text || ''); toast.success('Copied!'); };

  const handleDelete = async () => {
    if (!window.confirm('Delete this franchise owner?')) return;
    try {
      await api.delete(`/superadmin/franchises/${franchise.id}`);
      toast.success('Franchise removed.');
      navigate('/superadmin/franchises');
    } catch (err) {
      toast.error('Failed to delete franchise.');
    }
  };

  const openPurchaseModal = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data);
      setSelectedPlan(res.data[0] || null);
      setShowPurchaseModal(true);
    } catch (err) {
      toast.error('Failed to load plans.');
    }
  };

  const startCheckout = async () => {
    if (!selectedPlan) return toast.error('Select a plan');
    try {
      const res = await api.post('/subscriptions/checkout', { franchiseId: franchise.id, planId: selectedPlan.id });
      const { order, plan, key_id } = res.data;

      if (order && key_id) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: key_id,
            amount: order.amount,
            currency: order.currency || plan.currency,
            name: franchise.franchise_name,
            description: plan.name,
            ...(order.id && !order.id.startsWith("TEST_") ? { order_id: order.id } : {}),
            handler: async function (response) {
              try {
                await api.post('/subscriptions/confirm', {
                  franchiseId: franchise.id,
                  planId: plan.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                toast.success('Subscription activated');
                setShowPurchaseModal(false);
                const r = await api.get('/superadmin/franchises');
                const found = r.data.find(f => String(f.id) === String(franchise.id));
                if (found) setFranchise(found);
              } catch (err) {
                toast.error('Payment verification failed');
              }
            },
            modal: { ondismiss: function() { toast('Payment cancelled'); } }
          };
          const rz = new window.Razorpay(options);
          rz.open();
        };
      } else {
        await api.post('/subscriptions/confirm', { franchiseId: franchise.id, planId: selectedPlan.id, razorpay_payment_id: 'TEST', razorpay_order_id: order.id });
        toast.success('Subscription activated (test)');
        setShowPurchaseModal(false);
        const r = await api.get('/superadmin/franchises');
        const found = r.data.find(f => String(f.id) === String(franchise.id));
        if (found) setFranchise(found);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Checkout failed');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSubscriptionLabel = (franchise) => {
    if (!franchise) return 'Unknown';
    if (franchise.status !== 'Active') return 'Inactive';
    if (!franchise.start_date || !franchise.expiry_date) return 'Active';

    const start = new Date(franchise.start_date);
    const expiry = new Date(franchise.expiry_date);
    const diffDays = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'Trial';
    return 'Active';
  };

  const getTrialDaysLeft = (franchise) => {
    if (!franchise || !franchise.start_date || !franchise.expiry_date) return 0;
    const now = new Date();
    const expiry = new Date(franchise.expiry_date);
    const diffMs = expiry - now;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/superadmin/franchises');
        const found = res.data.find(f => String(f.id) === String(id));
        if (!found) {
          toast.error('Franchise not found');
          navigate('/superadmin/franchises');
          return;
        }
        setFranchise(found);

        // fetch linked counts
        const [homeChefRes, deliveryRes] = await Promise.all([
          api.get('/superadmin/homechefs'),
          api.get('/superadmin/delivery-partners')
        ]);
        const matcher = item => item.created_by_user_id === found.franch_user_id;
        const homeChefs = homeChefRes.data.filter(matcher);
        const deliveryPartners = deliveryRes.data.filter(matcher);
        setLinkedHomeChefs(homeChefs);
        setLinkedDeliveryPartners(deliveryPartners);
        setLinkedHomeChefCount(homeChefs.length);
        setLinkedDeliveryPartnerCount(deliveryPartners.length);
      } catch (err) {
        toast.error('Failed to load franchise');
        navigate('/superadmin/franchises');
      } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest animate-pulse">Loading Details...</p>
      </div>
    </div>
  );
  if (!franchise) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans text-slate-800 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl mix-blend-overlay"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/superadmin/franchises')} 
              className="group flex w-max items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Franchises
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-5xl drop-shadow-sm">{franchise.franchise_name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-bold text-emerald-100 backdrop-blur-md border border-emerald-500/30">
                  <BadgeCheck className="h-4 w-4" />
                  {franchise.commission_percentage}% Commission
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-slate-100 backdrop-blur-md border border-white/10">
                  <MapPin className="h-4 w-4" />
                  {franchise.city}, {franchise.state}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { navigate('/superadmin/franchises'); toast('Open the list to edit.'); }} 
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 border border-white/10"
            >
              <Edit3 className="h-4 w-4" /> Edit Details
            </button>
            <button 
              onClick={handleDelete} 
              className="flex items-center gap-2 rounded-2xl bg-rose-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-95"
            >
              <Trash2 className="h-4 w-4" /> Delete Owner
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:shadow-md border border-slate-100">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total Home Chefs</p>
              <h3 className="mt-4 text-5xl font-black text-slate-800">{linkedHomeChefCount}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Actively linked to this franchise</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <UserCheck className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm transition-all hover:shadow-md border border-slate-100">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-150"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Delivery Partners</p>
              <h3 className="mt-4 text-5xl font-black text-slate-800">{linkedDeliveryPartnerCount}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Actively linked to this franchise</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
              <MapPin className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Tabs */}
      <div className="flex flex-col gap-8 lg:flex-row">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-8 flex flex-col gap-2 rounded-[2rem] bg-white p-4 shadow-sm border border-slate-100">
            {[
              { id: 'franchise', icon: Landmark, label: 'Franchise Info' },
              { id: 'owner', icon: UserCheck, label: 'Owner Profile' },
              { id: 'homechefs', icon: List, label: 'Home Chefs' },
              { id: 'deliverypartners', icon: MapPin, label: 'Delivery Partners' },
              { id: 'subscription', icon: Clock, label: 'Subscription' },
              { id: 'credentials', icon: KeyRound, label: 'Credentials & Access' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 min-w-0">
          <div className="rounded-[2rem] bg-white p-8 lg:p-10 shadow-sm border border-slate-100 min-h-[500px]">
            
            {/* FRANCHISE INFO */}
            {activeDetailTab === 'franchise' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Landmark className="h-5 w-5" /></div>
                  <h3 className="text-xl font-black text-slate-800">Franchise Information</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Franchise Name</span>
                    <p className="mt-2 text-lg font-black text-slate-800">{franchise.franchise_name}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Commission Rate</span>
                    <div className="mt-2 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-700">
                        {franchise.commission_percentage}% Share
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Territory Location</span>
                    <p className="mt-2 text-lg font-black text-slate-800 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-rose-500" /> {franchise.city}, {franchise.state}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Registration Date</span>
                    <p className="mt-2 text-lg font-black text-slate-800">{formatDate(franchise.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* OWNER PROFILE */}
            {activeDetailTab === 'owner' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><UserCheck className="h-5 w-5" /></div>
                  <h3 className="text-xl font-black text-slate-800">Owner Profile Details</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Owner Name</span>
                    <p className="mt-2 text-xl font-black text-slate-800">{franchise.owner_name}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                    <p className="mt-2 text-base font-bold text-slate-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" /> {franchise.email}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Mobile Phone</span>
                    <p className="mt-2 text-base font-bold text-slate-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> {franchise.mobile}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CREDENTIALS */}
            {activeDetailTab === 'credentials' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><KeyRound className="h-5 w-5" /></div>
                  <h3 className="text-xl font-black text-slate-800">System Credentials & Access</h3>
                </div>

                {franchise.franch_user_id ? (
                  <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
                    <div className="p-8">
                      <div className="flex items-start gap-5">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm border border-violet-100">
                          <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black uppercase tracking-widest text-violet-900/60">Access Role: Admin</h4>
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 border border-violet-100 shadow-sm">
                            <code className="text-sm font-bold text-slate-600 truncate mr-4">{franchise.franch_user_id}</code>
                            <button onClick={() => copy(franchise.franch_user_id)} className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-violet-100 px-4 py-2 text-xs font-bold uppercase text-violet-700 hover:bg-violet-200 transition-colors">
                              <Copy className="h-4 w-4" /> Copy ID
                            </button>
                          </div>
                          <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed">This unique identifier is used to map home chefs and delivery partners directly to this franchise account.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
                    <div className="p-8 flex items-start gap-5">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm border border-amber-100">
                        <ShieldAlert className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-amber-900">Pending Activation</h4>
                        <p className="mt-2 text-sm font-medium text-amber-700/80 leading-relaxed max-w-md">This franchise does not have user login credentials set up yet. Please complete the registration or approval process.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBSCRIPTION */}
            {activeDetailTab === 'subscription' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Clock className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-800">Subscription Status</h3>
                  </div>
                  <button onClick={openPurchaseModal} className="flex items-center gap-2 rounded-xl bg-[#0f2027] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all active:scale-95">
                    Manage Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</span>
                    <div className="mt-3">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-black uppercase tracking-wider ${getSubscriptionLabel(franchise) === 'Trial' ? 'bg-amber-100 text-amber-700' : getSubscriptionLabel(franchise) === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {getSubscriptionLabel(franchise) === 'Trial' ? `Trial Mode` : getSubscriptionLabel(franchise)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</span>
                    <p className="mt-3 text-lg font-black text-slate-800">{formatDate(franchise.start_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date</span>
                    <p className="mt-3 text-lg font-black text-slate-800">{formatDate(franchise.expiry_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Remaining</span>
                    <p className="mt-3 text-2xl font-black text-emerald-600">{getTrialDaysLeft(franchise)} <span className="text-sm text-slate-500 uppercase tracking-widest">Days</span></p>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <h4 className="text-xl font-black">Renew or Upgrade</h4>
                      <p className="mt-2 text-emerald-100 text-sm max-w-md leading-relaxed">Ensure continuous access to franchise management tools, real-time analytics, and partner assignment features.</p>
                    </div>
                    <button onClick={openPurchaseModal} className="flex-shrink-0 rounded-xl bg-white px-8 py-4 text-sm font-black uppercase tracking-wide text-emerald-700 shadow-xl hover:bg-emerald-50 transition-all active:scale-95">
                      View Pricing Plans
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* HOME CHEFS LIST */}
            {activeDetailTab === 'homechefs' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><List className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-800">Linked Home Chefs</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{linkedHomeChefs.length} Total</span>
                </div>

                {linkedHomeChefs.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Chef Details</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Code</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {linkedHomeChefs.map((chef) => (
                            <tr key={chef.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{chef.name || chef.owner_name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{chef.city ? `${chef.city}, ${chef.state}` : 'Location unknown'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-700">{chef.mobile || '—'}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{chef.email || '—'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-600">
                                  {chef.chef_unique_code || chef.chef_id || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${chef.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {chef.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                      <List className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700">No Chefs Linked</h4>
                    <p className="mt-1 text-sm text-slate-500 max-w-sm">There are no home chefs assigned to this franchise account yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* DELIVERY PARTNERS LIST */}
            {activeDetailTab === 'deliverypartners' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><MapPin className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-800">Linked Delivery Partners</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{linkedDeliveryPartners.length} Total</span>
                </div>

                {linkedDeliveryPartners.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Partner Details</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Vehicle</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {linkedDeliveryPartners.map((partner) => (
                            <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{partner.name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{partner.city ? `${partner.city}, ${partner.state}` : 'Location unknown'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-700">{partner.mobile || '—'}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{partner.email || '—'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-600">
                                  {partner.vehicle_number || partner.vehicle_type || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${partner.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {partner.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                      <MapPin className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700">No Partners Linked</h4>
                    <p className="mt-1 text-sm text-slate-500 max-w-sm">There are no delivery partners assigned to this franchise account yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Purchase Modal */}
      {showPurchaseModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-10 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black mb-2 tracking-tight drop-shadow-sm">Choose Subscription Plan</h3>
                  <p className="text-slate-300 font-medium flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-emerald-400" />
                    Activating for <span className="font-bold text-white">{franchise.franchise_name}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowPurchaseModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-10 bg-[#f8fafc] flex-1 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(p => {
                  const isSelected = selectedPlan && selectedPlan.id === p.id;
                  const isBestValue = p.durationDays >= 90;
                  return (
                    <label 
                      key={p.id} 
                      className={`relative p-6 lg:p-8 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-white flex flex-col h-full ${
                        isSelected 
                          ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/20' 
                          : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        className="hidden" 
                        checked={isSelected} 
                        onChange={() => setSelectedPlan(p)} 
                      />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-emerald-500' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-emerald-500 animate-in zoom-in"></div>}
                        </div>
                        {isBestValue && (
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                            Best Value
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-xl mb-2">{p.name}</h4>
                        <div className="flex items-baseline gap-1 mt-4 mb-6">
                          <span className="text-4xl font-black text-slate-900">₹{p.amount}</span>
                        </div>
                        
                        <div className="space-y-3 mt-auto pt-6 border-t border-slate-100">
                          <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> {p.durationDays} Days Access
                          </p>
                          <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Full Admin Dashboard
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 lg:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 items-center">
              <button 
                onClick={() => setShowPurchaseModal(false)} 
                className="w-full sm:w-auto px-8 py-4 text-sm font-bold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={startCheckout} 
                className="w-full sm:w-auto px-10 py-4 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Pay & Activate
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default FranchiseDetails;

