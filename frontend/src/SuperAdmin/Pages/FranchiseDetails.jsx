import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import SubscriptionPaymentModal from "../../Components/SubscriptionPaymentModal";
import { Landmark, MapPin, UserCheck, Clock, List, KeyRound, Copy, ChevronLeft, ShieldAlert, BadgeCheck, Phone, Mail, Trash2, Edit3, ShieldCheck, ShoppingCart, Package, Utensils } from "lucide-react";

const FranchiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedHomeChefCount, setLinkedHomeChefCount] = useState(0);
  const [linkedDeliveryPartnerCount, setLinkedDeliveryPartnerCount] = useState(0);
  const [linkedHomeChefs, setLinkedHomeChefs] = useState([]);
  const [linkedDeliveryPartners, setLinkedDeliveryPartners] = useState([]);
  const [linkedOrderCount, setLinkedOrderCount] = useState(0);
  const [linkedUserOrders, setLinkedUserOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [chefProducts, setChefProducts] = useState([]);
  const [loadingChefProducts, setLoadingChefProducts] = useState(false);
  const [chefProductsError, setChefProductsError] = useState(null);
  const [chefFoods, setChefFoods] = useState([]);
  const [loadingChefFoods, setLoadingChefFoods] = useState(false);
  const [chefFoodsError, setChefFoodsError] = useState(null);
  const [franchiseAdminOrders, setFranchiseAdminOrders] = useState([]);
  const [loadingFranchiseAdminOrders, setLoadingFranchiseAdminOrders] = useState(false);
  const [franchiseAdminOrdersError, setFranchiseAdminOrdersError] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("chefProducts");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [chefInnerTab, setChefInnerTab] = useState('foods');

  const copy = (text) => { navigator.clipboard.writeText(text || ''); toast.success('Copied!'); };

  const handleDelete = async () => {
    if (!window.confirm('Delete this franchise owner?')) return;
    try {
      await api.delete(`/superadmin/franchises/${franchise.id}`);
      toast.success('Franchise removed.');
      navigate('/superadmin/franchises');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete franchise.');
    }
  };

  const openPurchaseModal = () => {
    setShowPurchaseModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatAmount = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const getChefGroups = (items) => {
    if (!Array.isArray(items)) return [];

    const groups = items.reduce((acc, item) => {
      const key = item.chef_name || item.chef || item.created_by_name || item.chef_email || item.chef_phone || 'Unknown Chef';
      const name = item.chef_name || item.chef || item.created_by_name || 'Unknown Chef';
      const quantity = Number(item.quantity) || 1;
      const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;

      if (!acc[key]) {
        acc[key] = {
          name,
          total_quantity: 0,
          total_amount: 0,
          items: []
        };
      }

      acc[key].items.push(item);
      acc[key].total_quantity += quantity;
      acc[key].total_amount += price * quantity;

      return acc;
    }, {});

    return Object.values(groups).map((group) => ({
      ...group,
      total_amount: parseFloat(group.total_amount.toFixed(2))
    }));
  };

  const isBranchChefOrder = (order, chefIds, chefUserIds) => {
    const orderChefId = String(order.chef_id || '').trim();
    const orderChefUserId = String(order.chef_user_id || '').trim();
    if (orderChefId && chefIds.includes(orderChefId)) return true;
    if (orderChefUserId && chefUserIds.includes(orderChefUserId)) return true;

    if (!Array.isArray(order.items)) return false;
    return order.items.some((item) => {
      const itemChefId = String(item.chef_id || '').trim();
      const itemChefUserId = String(item.chef_user_id || '').trim();
      const itemCreatedByUserId = String(item.created_by_user_id || '').trim();
      return (
        (itemChefId && chefIds.includes(itemChefId)) ||
        (itemChefUserId && chefUserIds.includes(itemChefUserId)) ||
        (itemCreatedByUserId && chefUserIds.includes(itemCreatedByUserId))
      );
    });
  };

  const getChefOrderCount = (chef) => {
    if (!linkedUserOrders) return 0;
    const chefId = String(chef.chef_id || '').trim();
    const chefUserId = String(chef.user_id || '').trim();
    return linkedUserOrders.filter(order => isBranchChefOrder(order, chefId ? [chefId] : [], chefUserId ? [chefUserId] : [])).length;
  };

  const getDeliveryPartnerOrderCount = (partner) => {
    if (!linkedUserOrders) return 0;
    const partnerId = String(partner.delivery_partner_code || partner.id || '').trim();
    const partnerUserId = String(partner.user_id || '').trim();
    return linkedUserOrders.filter(order => {
       const orderDpId = String(order.delivery_partner || order.delivery_boy_id || '').trim();
       const orderDpUserId = String(order.delivery_partner_user_id || '').trim();
       return (orderDpId && orderDpId === partnerId) || (orderDpUserId && orderDpUserId === partnerUserId);
    }).length;
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
        const res = await api.get(`/superadmin/franchises/${id}`);
        setFranchise(res.data);

        // fetch linked counts
        const [homeChefRes, deliveryRes, ordersRes, userOrdersRes] = await Promise.all([
          api.get('/superadmin/homechefs'),
          api.get('/superadmin/delivery-partners'),
          api.get('/user-food-orders', { params: { franchise_user_id: res.data.franch_user_id, franchise_id: res.data.franchise_id } }),
          api.get('/user-food-orders', { params: { franchise_user_id: res.data.franch_user_id, franchise_id: res.data.franchise_id } })
        ]);
        console.log("Franchise data:", res.data);
        console.log("Delivery Partners data (first 2):", deliveryRes.data.slice(0, 2));

        const matcher = (item) => {
          const chefFranchiseUserId = String(item.franchise_user_id || '');
          const chefCreatedByUserId = String(item.created_by_user_id || item.created_by || '');
          const chefFranchiseId = String(item.franchise_id || '');
          const franchiseUserId = String(res.data.franch_user_id || '');
          const franchiseId = String(res.data.franchise_id || '');

          return (
            chefCreatedByUserId === franchiseUserId ||
            chefFranchiseUserId === franchiseUserId ||
            chefFranchiseId === franchiseId ||
            chefCreatedByUserId === franchiseId
          );
        };
        const homeChefs = homeChefRes.data.filter(matcher);
        const deliveryPartners = deliveryRes.data.filter(matcher);
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const allUserOrders = Array.isArray(userOrdersRes.data) ? userOrdersRes.data : [];
        const branchChefIds = homeChefs.map((chef) => String(chef.chef_id || '').trim()).filter(Boolean);
        const branchChefUserIds = homeChefs.map((chef) => String(chef.user_id || '').trim()).filter(Boolean);
        const branchOrders = orders.filter((order) => isBranchChefOrder(order, branchChefIds, branchChefUserIds));
        const userOrders = allUserOrders;
        setLinkedHomeChefs(homeChefs);
        setLinkedDeliveryPartners(deliveryPartners);
        setLinkedUserOrders(userOrders);
        setLinkedHomeChefCount(homeChefs.length);
        setLinkedDeliveryPartnerCount(deliveryPartners.length);
        setLinkedOrderCount(branchOrders.length);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load franchise');
        navigate('/superadmin/franchises');
      } finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const fetchProducts = useCallback(async () => {
    if (!franchise) return;
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const params = {
        status: 'Active'
      };
      if (franchise.franchise_id) params.franchise_id = franchise.franchise_id;
      if (franchise.franch_user_id) params.franchise_user_id = franchise.franch_user_id;
      const res = await api.get('/franchise-products', { params });
      const data = res.data;
      const allProducts = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];
      setProducts(allProducts.filter(p => {
        const s = String(p.status || '').toLowerCase();
        return s === 'approved' || s === 'active';
      }));
    } catch (error) {
      console.error(error);
      setProductsError('Failed to load chef products.');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [franchise]);

  const fetchChefProducts = useCallback(async () => {
    if (!franchise) return;
    setLoadingChefProducts(true);
    setChefProductsError(null);
    try {
      const params = {
        source: 'chef_products',
        status: 'Active'
      };
      if (franchise.franchise_id) params.franchise_id = franchise.franchise_id;
      if (franchise.franch_user_id) params.franchise_user_id = franchise.franch_user_id;
      const res = await api.get('/products', { params });
      const allProducts = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.products) ? res.data.products : [];
      setChefProducts(allProducts.filter(p => {
        const s = String(p.status || '').toLowerCase();
        return s === 'approved' || s === 'active';
      }));
    } catch (error) {
      console.error(error);
      setChefProductsError('Failed to load chef products.');
      setChefProducts([]);
    } finally {
      setLoadingChefProducts(false);
    }
  }, [franchise]);

  const fetchChefFoods = useCallback(async () => {
    if (!franchise) return;
    setLoadingChefFoods(true);
    setChefFoodsError(null);
    try {
      const params = {};
      if (franchise.franch_user_id) params.franchise_user_id = franchise.franch_user_id;
      if (franchise.franchise_id) params.franchise_id = franchise.franchise_id;
      const res = await api.get('/chef-foods', { params });
      const allFoods = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.foods) ? res.data.foods : [];
      setChefFoods(allFoods);
    } catch (error) {
      console.error(error);
      setChefFoodsError('Failed to load chef foods.');
      setChefFoods([]);
    } finally {
      setLoadingChefFoods(false);
    }
  }, [franchise]);

  const fetchFranchiseAdminOrders = useCallback(async () => {
    if (!franchise) return;
    setLoadingFranchiseAdminOrders(true);
    setFranchiseAdminOrdersError(null);
    try {
      const res = await api.get('/orders', { params: { franchise_user_id: franchise.franch_user_id } });
      const orders = Array.isArray(res.data) ? res.data : [];
      setFranchiseAdminOrders(orders);
    } catch (error) {
      console.error(error);
      setFranchiseAdminOrdersError('Failed to load franchise admin orders.');
      setFranchiseAdminOrders([]);
    } finally {
      setLoadingFranchiseAdminOrders(false);
    }
  }, [franchise]);

  useEffect(() => {
    if (activeDetailTab === 'chefProducts') {
      fetchChefFoods();
      fetchChefProducts();
    } else if (activeDetailTab === 'products') {
      fetchProducts();
    } else if (activeDetailTab === 'orders') {
      fetchFranchiseAdminOrders();
    }
  }, [activeDetailTab, fetchProducts, fetchChefProducts, fetchChefFoods, fetchFranchiseAdminOrders]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#05120f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/60 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-300 uppercase tracking-widest animate-pulse">Loading Details...</p>
      </div>
    </div>
  );
  if (!franchise) return null;

  return (
    <div className="min-h-screen bg-[#05120f] px-2 py-6">
      <div className="mx-auto max-w-[1600px] space-y-8">

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#091d18] via-[#082a24] to-[#0b1d2f] p-6 sm:p-8 lg:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden">
          <div className="pointer-events-none absolute -top-10 left-1/2 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-4 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/superadmin/franchises')}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-slate-100 shadow-sm transition-all hover:bg-white/15"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Franchises
              </button>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">{franchise.franchise_name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Premium franchise overview with revenue, orders, partners and subscription controls in one polished admin workspace.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-100 border border-emerald-500/20">
                    <BadgeCheck className="h-4 w-4" />
                    {franchise.commission_percentage}% Commission
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-slate-100 border border-white/10">
                    <MapPin className="h-4 w-4" />
                    {franchise.city}, {franchise.state}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
              <button
                onClick={() => { navigate('/superadmin/franchises'); toast('Open the list to edit.'); }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-black/20 transition-all hover:bg-white/15 active:scale-95"
              >
                <Edit3 className="h-4 w-4" /> Edit Details
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-95"
              >
                <Trash2 className="h-4 w-4" /> Delete Owner
              </button>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              label: 'Total Home Chefs', value: linkedHomeChefCount, icon: UserCheck,
              accent: 'bg-emerald-100 text-emerald-600', ring: 'bg-emerald-500/20', description: 'Actively linked to this franchise'
            },
            {
              label: 'Delivery Partners', value: linkedDeliveryPartnerCount, icon: MapPin,
              accent: 'bg-sky-100 text-sky-600', ring: 'bg-sky-400/20', description: 'Actively linked to this franchise'
            },
            {
              label: 'Total Orders', value: linkedOrderCount, icon: ShoppingCart,
              accent: 'bg-violet-100 text-violet-600', ring: 'bg-violet-500/20', description: 'Processed by this franchise'
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.44)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${card.ring} blur-3xl opacity-80 transition-transform duration-500 group-hover:scale-110`} />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{card.label}</p>
                    <h3 className="mt-4 text-5xl font-black text-white">{card.value}</h3>
                    <p className="mt-2 text-sm text-slate-400 font-medium">{card.description}</p>
                  </div>
                  <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${card.accent} shadow-inner`}>
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content & Tabs */}
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* Sidebar Nav */}
          <aside className="w-full lg:w-[300px] flex-shrink-0">
            <div className="sticky top-8 space-y-3 rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-4 text-sm font-black uppercase tracking-[0.24em] text-slate-300">
                Navigation
              </div>
              {[
                { id: 'franchise', icon: Landmark, label: 'Franchise & Owner' },
                { id: 'homechefs', icon: List, label: 'Home Chefs' },
                { id: 'deliverypartners', icon: MapPin, label: 'Delivery Partners' },
                // chef foods first for franchise admin view
                { id: 'chefProducts', icon: Utensils, label: 'Chef Food Products' },
                { id: 'products', icon: Package, label: 'Packing Products' },
                { id: 'orders', icon: ShoppingCart, label: 'Packing Orders' },
                { id: 'usersOrder', icon: ShoppingCart, label: 'User Orders' },
                { id: 'subscription', icon: Clock, label: 'Subscription' },
                { id: 'credentials', icon: KeyRound, label: 'Credentials & Access' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`group flex w-full items-center justify-start gap-4 rounded-[1.75rem] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-left leading-tight transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_20px_60px_rgba(16,185,129,0.22)]'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="whitespace-normal">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Tab Content Panels */}
          <div className="flex-1 min-w-0">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)] min-h-[500px] text-slate-100">
            
            {/* FRANCHISE & OWNER INFO */}
            {activeDetailTab === 'franchise' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-12">
                
                {/* Franchise Section */}
                <div>
                  <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200"><Landmark className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Franchise Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Franchise Name</span>
                      <p className="mt-2 text-lg font-black text-white">{franchise.franchise_name}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Commission Rate</span>
                      <div className="mt-2 flex items-center">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-sm font-black text-emerald-100 border border-emerald-500/20">
                          {franchise.commission_percentage}% Share
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Territory Location</span>
                      <p className="mt-2 text-lg font-black text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-rose-500" /> {franchise.city}, {franchise.state}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Registration Date</span>
                      <p className="mt-2 text-lg font-black text-white">{formatDate(franchise.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Section */}
                <div>
                  <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200"><UserCheck className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Owner Profile Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Owner Name</span>
                      <p className="mt-2 text-xl font-black text-white">{franchise.owner_name}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                      <p className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" /> {franchise.email}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Mobile Phone</span>
                      <p className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" /> {franchise.mobile}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CREDENTIALS */}
            {activeDetailTab === 'credentials' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200"><KeyRound className="h-5 w-5" /></div>
                  <h3 className="text-xl font-black text-slate-100">System Credentials & Access</h3>
                </div>

                {franchise.franch_user_id ? (
                  <div className="overflow-hidden rounded-[2rem] border border-violet-500/10 bg-gradient-to-br from-violet-950 via-slate-950 to-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div className="p-8">
                      <div className="flex items-start gap-5">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm border border-violet-100">
                          <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black uppercase tracking-widest text-violet-900/60">Access Role: Admin</h4>
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/90 p-4 border border-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
                            <code className="text-sm font-bold text-slate-200 truncate mr-4">{franchise.franch_user_id}</code>
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
                  <div className="overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div className="p-8 flex items-start gap-5">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-amber-500/20">
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
                <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Clock className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Subscription Status</h3>
                  </div>
                  <button onClick={openPurchaseModal} className="flex items-center gap-2 rounded-xl bg-[#0f2027] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all active:scale-95">
                    Manage Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</span>
                    <div className="mt-3">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-black uppercase tracking-wider ${getSubscriptionLabel(franchise) === 'Trial' ? 'bg-amber-100 text-amber-700' : getSubscriptionLabel(franchise) === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {getSubscriptionLabel(franchise) === 'Trial' ? `Trial Mode` : getSubscriptionLabel(franchise)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</span>
                    <p className="mt-3 text-lg font-black text-slate-100">{formatDate(franchise.start_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date</span>
                    <p className="mt-3 text-lg font-black text-slate-100">{formatDate(franchise.expiry_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Remaining</span>
                    <p className="mt-3 text-2xl font-black text-emerald-400">{getTrialDaysLeft(franchise)} <span className="text-sm text-slate-400 uppercase tracking-widest">Days</span></p>
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
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200"><List className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Linked Home Chefs</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{linkedHomeChefs.length} Total</span>
                </div>

                {linkedHomeChefs.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Chef Details</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Code</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Orders</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {linkedHomeChefs.map((chef) => (
                            <tr key={chef.id} className="hover:bg-slate-900/70 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-100">{chef.name || chef.owner_name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{chef.city ? `${chef.city}, ${chef.state}` : 'Location unknown'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-700">{chef.mobile || '—'}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{chef.email || '—'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-900/90 px-2 py-1 text-xs font-mono font-bold text-slate-300 border border-slate-800">
                                  {chef.chef_unique_code || chef.chef_id || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-bold text-slate-300">{getChefOrderCount(chef)}</span>
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
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                      <List className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">No Chefs Linked</h4>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">There are no home chefs assigned to this franchise account yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* OUR PRODUCTS LIST */}
            {activeDetailTab === 'products' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-200"><Package className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Packing Products</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{products.length} items</span>
                </div>

                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950/95 py-20 text-center">
                    <div className="h-12 w-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="rounded-[2rem] border border-rose-500/40 bg-rose-500/10 p-8 text-center text-rose-200">
                    <p className="font-bold">{productsError}</p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Product</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Category</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Price</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Status</th>

                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {products.map((product) => (
                            <tr key={product.id || product.catId || product.product_code} className="hover:bg-slate-900/70 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-2xl bg-slate-900 grid place-items-center text-slate-300 font-bold overflow-hidden border border-slate-700 shrink-0">
                                    {(product.product_image || product.image || product.image_url) ? (
                                        <img 
                                            src={product.product_image || product.image || product.image_url} 
                                            alt={product.name || 'Product'} 
                                            className="h-full w-full object-cover" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling && (e.target.nextSibling.style.display = 'grid');
                                            }}
                                        />
                                    ) : null}
                                    <span style={{ display: (product.product_image || product.image || product.image_url) ? 'none' : 'grid' }} className="h-full w-full place-items-center">
                                        {String(product.name || '').charAt(0).toUpperCase() || 'P'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-100">{product.name || product.catId || 'Unnamed Product'}</p>
                                    <p className="text-xs text-slate-400">{product.franchise_id ? 'Franchise item' : 'Catalog item'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{product.category || product.subcategory || 'N/A'}</td>
                              <td className="px-6 py-4 font-bold text-emerald-400">₹{product.mrp ?? product.price ?? '0'}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : product.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-slate-900/80 text-slate-300'}`}>
                                  {product.status || 'Unknown'}
                                </span>
                              </td>
                              
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">No products found</h4>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">This franchise does not have any products listed yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* CHEF FOOD PRODUCTS LIST */}
            {activeDetailTab === 'chefProducts' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200"><Utensils className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Chef Food Products</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{chefProducts.length} items</span>
                </div>

                <div className="mt-4 mb-6 flex gap-3">
                  <button
                    onClick={() => setChefInnerTab('foods')}
                    className={`rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wider ${chefInnerTab === 'foods' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300'}`}
                  >Foods</button>
                  <button
                    onClick={() => setChefInnerTab('foodProducts')}
                    className={`rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wider ${chefInnerTab === 'foodProducts' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300'}`}
                  >Food Products</button>
                </div>

                {chefInnerTab === 'foods' ? (
                  (loadingChefFoods ? (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950 py-20 text-center">
                      <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-4"></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading chef foods...</p>
                    </div>
                  ) : chefFoodsError ? (
                    <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                      <p className="font-bold">{chefFoodsError}</p>
                    </div>
                  ) : chefFoods.length > 0 ? (
                    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900">
                            <tr>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Food Name</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Category</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Chef</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Price</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 bg-slate-950">
                            {chefFoods.map((food) => (
                              <tr key={food.id || food.food_id} className="hover:bg-slate-900/70 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-slate-900 grid place-items-center text-slate-300 font-bold overflow-hidden border border-slate-700 shrink-0">
                                      {(food.food_image || food.image || food.image_url) ? (
                                          <img
                                              src={food.food_image || food.image || food.image_url}
                                              alt={food.name || 'Food'}
                                              className="h-full w-full object-cover"
                                              onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling && (e.target.nextSibling.style.display = 'grid');
                                              }}
                                          />
                                      ) : null}
                                      <span style={{ display: (food.food_image || food.image || food.image_url) ? 'none' : 'grid' }} className="h-full w-full place-items-center">
                                          {String(food.name || '').charAt(0).toUpperCase() || 'F'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-100">{food.name}</p>
                                      <p className="text-xs text-slate-400">{food.cuisine || food.dietary_tag || 'Home cooked'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{food.category || 'N/A'}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{food.chef_name || food.chef_id || 'Unknown'}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">₹{food.final_price ?? food.mrp ?? food.price ?? '0'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${food.status === 'Active' || food.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900/80 text-slate-300'}`}>
                                    {food.status || 'Unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                        <Utensils className="h-8 w-8 text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-100">No Chef Foods Found</h4>
                      <p className="mt-1 text-sm text-slate-400 max-w-sm">There are no home chef food items associated with this franchise yet.</p>
                    </div>
                  ))
                ) : (
                  // Food Products nested view — uses chefProducts (chef_products table)
                  (loadingChefProducts ? (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950 py-20 text-center">
                      <div className="h-12 w-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading chef products...</p>
                    </div>
                  ) : chefProductsError ? (
                    <div className="rounded-[2rem] border border-rose-500/40 bg-rose-500/10 p-8 text-center text-rose-200">
                      <p className="font-bold">{chefProductsError}</p>
                    </div>
                  ) : chefProducts.length > 0 ? (
                    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900">
                            <tr>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Product</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Category</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Chef</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Price</th>
                              <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Status</th>
                              
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 bg-slate-950">
                            {chefProducts.map((product) => (
                              <tr key={product.id || product.product_id || product.product_code} className="hover:bg-slate-900/70 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-slate-900 grid place-items-center text-slate-300 font-bold overflow-hidden border border-slate-700 shrink-0">
                                      {(product.product_image || product.image || product.image_url) ? (
                                          <img
                                              src={product.product_image || product.image || product.image_url}
                                              alt={product.name || 'Product'}
                                              className="h-full w-full object-cover"
                                              onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling && (e.target.nextSibling.style.display = 'grid');
                                              }}
                                          />
                                      ) : null}
                                      <span style={{ display: (product.product_image || product.image || product.image_url) ? 'none' : 'grid' }} className="h-full w-full place-items-center">
                                          {String(product.name || '').charAt(0).toUpperCase() || 'P'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-100">{product.name || 'Unnamed Product'}</p>
                                      <p className="text-xs text-slate-400">Chef Product</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{product.category || product.subcategory || 'N/A'}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{product.chef_name || product.created_by || 'Unknown'}</td>
                                <td className="px-6 py-4 font-bold text-emerald-400">₹{product.mrp ?? product.price ?? '0'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : product.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-slate-900/80 text-slate-300'}`}>
                                    {product.status || 'Unknown'}
                                  </span>
                                </td>
                                
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-100">No Chef Products Found</h4>
                      <p className="mt-1 text-sm text-slate-400 max-w-sm">There are no chef products associated with this franchise yet.</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* DELIVERY PARTNERS LIST */}
            {activeDetailTab === 'deliverypartners' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200"><MapPin className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Linked Delivery Partners</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{linkedDeliveryPartners.length} Total</span>
                </div>

                {linkedDeliveryPartners.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Partner Details</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Contact</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Code</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Deliveries</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {linkedDeliveryPartners.map((partner) => (
                            <tr key={partner.id} className="hover:bg-slate-900/70 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-100">{partner.name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{partner.city ? `${partner.city}, ${partner.state}` : 'Location unknown'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-700">{partner.mobile || '—'}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{partner.email || '—'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-900/90 px-2 py-1 text-xs font-mono font-bold text-slate-300 border border-slate-800">
                                  {partner.delivery_partner_code || partner.id || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-bold text-slate-300">{getDeliveryPartnerOrderCount(partner)}</span>
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
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                      <MapPin className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">No Delivery Partners Linked</h4>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">There are no delivery partners assigned to this franchise account yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* FRANCHISE ADMIN ORDERS LIST */}
            {activeDetailTab === 'orders' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300 mt-8">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200"><ShoppingCart className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">Packing Orders</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{franchiseAdminOrders.length} Total</span>
                </div>

                {loadingFranchiseAdminOrders ? (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-800 bg-slate-950 py-20 text-center">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading orders...</p>
                  </div>
                ) : franchiseAdminOrdersError ? (
                  <div className="rounded-[2rem] border border-rose-500/40 bg-rose-500/10 p-8 text-center text-rose-200">
                    <p className="font-bold">{franchiseAdminOrdersError}</p>
                  </div>
                ) : franchiseAdminOrders.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Order ID</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Customer</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Amount</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Payment Status</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Placed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {franchiseAdminOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-900/70 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-100">#{order.order_id || order.id}</td>
                              <td className="px-6 py-4 text-slate-600">{order.customer_name || order.ordered_by_name || 'Guest'}</td>
                              <td className="px-6 py-4 font-bold text-emerald-600">{formatAmount(order.total_amount)}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : order.status === 'Order Placed' ? 'bg-blue-100 text-blue-700' : order.status === 'Packing' ? 'bg-indigo-100 text-indigo-700' : order.status === 'Shipping' ? 'bg-amber-100 text-amber-700' : order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' : order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-900/80 text-slate-300'}`}>

                                  {order.status || 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : order.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : order.payment_status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-slate-900/80 text-slate-300'}`}>
                                  {order.payment_status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(order.ordered_date || order.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                      <ShoppingCart className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">No Franchise Admin Orders Found</h4>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">The franchise admin has not placed any orders yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* USERS ORDER LIST */}
            {activeDetailTab === 'usersOrder' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200"><ShoppingCart className="h-5 w-5" /></div>
                    <h3 className="text-xl font-black text-slate-100">User Orders (Personal)</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 border border-white/10">{linkedUserOrders.length} Total</span>
                </div>

                {linkedUserOrders.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Order</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Customer</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Chefs</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Item Breakdown</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Amount</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs text-center">Status</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-xs">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {linkedUserOrders.map((order) => {
                            const items = Array.isArray(order.items) ? order.items : [];
                            const chefGroups = getChefGroups(items);

                            return (
                              <tr key={order.id} className="hover:bg-slate-900/70 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-100">#{order.order_id || order.id}</td>
                                <td className="px-6 py-4 text-slate-600">{order.customer_name || order.ordered_by_name || 'Guest'}</td>
                                <td className="px-6 py-4 space-y-2">
                                  {chefGroups.length > 0 ? (
                                    chefGroups.map((group) => (
                                      <div key={group.name} className="rounded-2xl bg-slate-900/95 px-3 py-2">
                                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                                        <p className="text-xs text-slate-500">Qty {group.total_quantity} · {group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-500">No chef info</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 space-y-2">
                                  {chefGroups.length > 0 ? (
                                    chefGroups.map((group) => (
                                      <div key={`${group.name}-items`} className="rounded-2xl bg-slate-900/95 px-3 py-2">
                                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                                        <p className="text-xs text-slate-500">
                                          {group.items.map((item) => `${item.name || 'Item'} x${item.quantity || 1}`).join(', ')}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-500">No items</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-bold text-emerald-600">{formatAmount(order.total_amount)}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(order.created_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] mb-4">
                      <ShoppingCart className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">No Personal Orders Found</h4>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">This franchise owner has not placed any orders as a regular user yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Purchase Modal */}
      <SubscriptionPaymentModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        franchiseId={franchise.id}
      />
    </div>
  </div>
  );
};

export default FranchiseDetails;
