import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import SubscriptionPaymentModal from "../../Components/SubscriptionPaymentModal";
import { Landmark, MapPin, UserCheck, Clock, List, KeyRound, Copy, ChevronLeft, ShieldAlert, BadgeCheck, Phone, Mail, Trash2, Edit3, ShieldCheck, ShoppingCart, Package, Utensils, Star, PlusCircle, FileText } from "lucide-react";

const HomeChefDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState('chef');
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [products, setProducts] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const copy = (text) => { navigator.clipboard.writeText(text || ''); toast.success('Copied!'); };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatAmount = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const getDocLink = (filename) => filename ? `${import.meta.env.VITE_API_URL}/../uploads/homechefs/${filename}` : null;

  const getChefOrderAmount = (order) => {
    if (!order) return formatAmount(0);
    if (order.chef_total_amount != null) return formatAmount(order.chef_total_amount);
    if (Array.isArray(order.items)) {
      const total = order.items.reduce((s, it) => {
        const price = parseFloat(it.price || it.final_price || it.mrp || 0) || 0;
        const qty = Number(it.quantity) || 1;
        return s + price * qty;
      }, 0);
      return formatAmount(total);
    }
    return formatAmount(order.total_amount);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/homechefs/${id}`);
        setChef(res.data);
        const chefId = res.data?.chef_id || res.data?.id;
        const [foodsRes, ordersRes, productsRes] = await Promise.all([
          api.get('/chef-foods', { params: { chef_id: chefId } }).catch(() => ({ data: [] })),
          api.get('/user-food-orders', { params: { chef_id: chefId } }).catch(() => ({ data: [] })),
          api.get('/products', { params: { chef_id: chefId } }).catch(() => ({ data: [] })),
        ]);
        setFoods(Array.isArray(foodsRes.data) ? foodsRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []));
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load chef details');
        navigate('/admin/homechefs');
      } finally { setLoading(false); }
    };
    if (id) fetch();
  }, [id, navigate]);

  const fetchFoods = useCallback(async () => {
    if (!chef) return;
    setLoadingFoods(true);
    try {
      const res = await api.get('/chef-foods', { params: { chef_id: chef.chef_id || chef.id } });
      setFoods(Array.isArray(res.data) ? res.data : []);
    } catch (e) { setFoods([]); }
    finally { setLoadingFoods(false); }
  }, [chef]);

  const fetchOrders = useCallback(async () => {
    if (!chef) return;
    setLoadingOrders(true);
    try {
      const res = await api.get('/user-food-orders', { params: { chef_id: chef.chef_id || chef.id } });
      setOrders(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.orders) ? res.data.orders : []));
    } catch (e) { setOrders([]); }
    finally { setLoadingOrders(false); }
  }, [chef]);

  useEffect(() => {
    if (activeDetailTab === 'foods') fetchFoods();
    if (activeDetailTab === 'orders') fetchOrders();
  }, [activeDetailTab, fetchFoods, fetchOrders]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#05120f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/60 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-300 uppercase tracking-widest animate-pulse">Loading Details...</p>
      </div>
    </div>
  );

  if (!chef) return null;

  return (
    <div className="min-h-screen bg-[#05120f] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-8">

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#091d18] via-[#082a24] to-[#0b1d2f] p-6 sm:p-8 lg:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden">
          <div className="pointer-events-none absolute -top-10 left-1/2 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-4 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/admin/homechefs')}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-slate-100 shadow-sm transition-all hover:bg-white/15"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home Chefs
              </button>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">{chef.name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Comprehensive chef overview — orders, products and verification in one polished admin workspace.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-100 border border-emerald-500/20">
                    <BadgeCheck className="h-4 w-4" />
                    {chef.rating ?? 'N/A'} Rating
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-slate-100 border border-white/10">
                    <MapPin className="h-4 w-4" />
                    {chef.city}, {chef.state}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
              <button
                onClick={() => { navigate('/admin/homechefs'); toast('Open the list to edit.'); }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-black/20 transition-all hover:bg-white/15 active:scale-95"
              >
                <Edit3 className="h-4 w-4" /> Edit Details
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('Delete this home chef?')) return;
                  try { await api.delete(`/admin/homechefs/${chef.id}`); toast.success('Chef removed.'); navigate('/admin/homechefs'); }
                  catch (e) { console.error(e); toast.error('Failed to delete chef.'); }
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-95"
              >
                <Trash2 className="h-4 w-4" /> Delete Chef
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { label: 'Total Foods', value: foods.length, icon: Utensils, accent: 'bg-emerald-100 text-emerald-600', ring: 'bg-emerald-500/20', description: 'Active food items' },
            { label: 'Products', value: products.length, icon: Package, accent: 'bg-sky-100 text-sky-600', ring: 'bg-sky-400/20', description: 'Listed products' },
            { label: 'Total Orders', value: orders.length, icon: ShoppingCart, accent: 'bg-violet-100 text-violet-600', ring: 'bg-violet-500/20', description: 'Orders placed' }
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

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:w-[300px] flex-shrink-0">
            <div className="sticky top-8 space-y-3 rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-4 text-sm font-black uppercase tracking-[0.24em] text-slate-300">Navigation</div>
              {[
                { id: 'chef', icon: Landmark, label: 'Chef & Profile' },
                { id: 'foods', icon: List, label: 'Foods' },
                { id: 'products', icon: Package, label: 'Products' },
                { id: 'orders', icon: ShoppingCart, label: 'Orders' },
                { id: 'documents', icon: KeyRound, label: 'Documents' },
                { id: 'credentials', icon: KeyRound, label: 'Credentials' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDetailTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveDetailTab(tab.id)} className={`group flex w-full items-center justify-start gap-4 rounded-[1.75rem] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-left leading-tight transition-all ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_20px_60px_rgba(16,185,129,0.22)]' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="whitespace-normal">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)] min-h-[500px] text-slate-100">
              {/* content panels rendered earlier */}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Purchase Modal (kept for parity) */}
      <SubscriptionPaymentModal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} franchiseId={chef.id} />
    </div>
  );
};

export default HomeChefDetail;
