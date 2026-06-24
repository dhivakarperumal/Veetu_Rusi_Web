import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import SubscriptionPaymentModal from "../../Components/SubscriptionPaymentModal";
import { Landmark, MapPin, UserCheck, Clock, List, KeyRound, Copy, ChevronLeft, ShieldAlert, BadgeCheck, Phone, Mail, Trash2, Edit3, ShieldCheck, ShoppingCart, Package, Utensils, Star, PlusCircle, FileText, Eye } from "lucide-react";

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
              {activeDetailTab === 'chef' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-6">
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">Chef Information</h2>
                          <p className="text-sm text-slate-400">Profile and kitchen details for this home chef.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          { label: 'Name', value: chef.name },
                          { label: 'Mobile', value: chef.mobile },
                          { label: 'Email', value: chef.email },
                          { label: 'WhatsApp', value: chef.whatsapp_number },
                          { label: 'City', value: chef.city },
                          { label: 'State', value: chef.state },
                          { label: 'Pincode', value: chef.pincode },
                          { label: 'Cuisine', value: chef.cuisine_type },
                          { label: 'Kitchen', value: chef.kitchen_name },
                          { label: 'Specialty', value: chef.specialty_food },
                        ].map((item) => (
                          <div key={item.label} className="rounded-3xl bg-slate-950 p-4 border border-slate-800">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                            <p className="mt-2 text-sm font-black text-white">{item.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">Address & Status</h2>
                          <p className="text-sm text-slate-400">Chef location, verification, and active status.</p>
                        </div>
                      </div>
                      <div className="space-y-4 text-sm">
                        {[
                          { label: 'Address', value: chef.address },
                          { label: 'Verified', value: chef.verification_status },
                          { label: 'Subscription', value: chef.subscription_status || 'Unknown' },
                          { label: 'Chef ID', value: chef.chef_unique_code },
                          { label: 'Joined', value: formatDate(chef.created_at || chef.created_at_timestamp || chef.joined_at) },
                        ].map((item) => (
                          <div key={item.label} className="rounded-3xl bg-slate-950 p-4 border border-slate-800">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                            <p className="mt-2 text-sm font-black text-white">{item.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'foods' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white">Chef Foods</h2>
                      <p className="text-sm text-slate-400">Food items created by this home chef.</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-300">{foods.length} items</span>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 overflow-hidden">
                    {loadingFoods ? (
                      <div className="flex items-center justify-center p-16 text-slate-400">Loading foods…</div>
                    ) : foods.length === 0 ? (
                      <div className="p-16 text-center text-slate-400">No foods found for this chef.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-950/90 text-slate-500 uppercase text-[11px] tracking-[0.2em]">
                            <tr>
                              <th className="px-6 py-4">Food</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Price</th>
                              <th className="px-6 py-4">Dietary</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {foods.map((food) => (
                              <tr key={food.id || food.food_id || food._id} className="hover:bg-slate-900/80 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">{String(food.name || food.title || 'F').charAt(0)}</div>
                                    <div>
                                      <p className="font-semibold text-white">{food.name || food.title || 'Unnamed'}</p>
                                      <p className="text-xs text-slate-500">{food.cuisine || 'Home Cooked'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{food.category || food.food_category || '—'}</td>
                                <td className="px-6 py-4 font-black text-emerald-400">{formatAmount(food.final_price || food.price || food.mrp)}</td>
                                <td className="px-6 py-4 text-slate-400">{food.dietary_tag || food.dietary || '—'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${food.status === 'Active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                    {food.status || 'Unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'products' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white">Products</h2>
                      <p className="text-sm text-slate-400">Products assigned to this home chef.</p>
                    </div>
                    <button onClick={() => navigate(`/admin/products/add?chefId=${chef.id}`)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500 transition">
                      <PlusCircle className="h-4 w-4" /> Add Product
                    </button>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-6">
                    {products.length === 0 ? (
                      <div className="p-16 text-center text-slate-400">No products currently linked to this chef.</div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {products.map((product) => (
                          <div key={product.id || product.product_id || product._id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="font-black text-white">{product.name || product.title || 'Unnamed'}</h3>
                                <p className="text-sm text-slate-500">{product.category || 'Uncategorized'}</p>
                              </div>
                              <p className="font-black text-emerald-400">{formatAmount(product.price || product.final_price || product.mrp)}</p>
                            </div>
                            <p className="mt-3 text-sm text-slate-400">{product.description || 'No description available.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'orders' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white">Chef Orders</h2>
                      <p className="text-sm text-slate-400">Recent orders containing products from this chef.</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-300">{orders.length} orders</span>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 overflow-hidden">
                    {loadingOrders ? (
                      <div className="flex items-center justify-center p-16 text-slate-400">Loading orders…</div>
                    ) : orders.length === 0 ? (
                      <div className="p-16 text-center text-slate-400">No orders found for this chef.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-950/90 text-slate-500 uppercase text-[11px] tracking-[0.2em]">
                            <tr>
                              <th className="px-6 py-4">Order</th>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {orders.map((order) => (
                              <tr key={order.id || order.order_id || order._id} className="hover:bg-slate-900/80 transition-colors">
                                <td className="px-6 py-4 font-semibold text-white">{order.order_id || `#${order.id || order._id}`}</td>
                                <td className="px-6 py-4 text-slate-400">{order.customer_name || order.name || order.user_name || 'Customer'}</td>
                                <td className="px-6 py-4 font-black text-emerald-400">{getChefOrderAmount(order)}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                    {order.status || 'Unknown'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{formatDate(order.ordered_at || order.created_at || order.date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'documents' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white">Documents</h2>
                      <p className="text-sm text-slate-400">Uploaded verification documents for this chef.</p>
                    </div>
                    <button onClick={() => copy(chef.chef_unique_code || chef.id)} className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-black text-slate-100 hover:bg-slate-700 transition">
                      <Copy className="h-4 w-4" /> Copy Chef ID
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: 'Aadhaar Front', key: 'aadhaar_front_url' },
                      { label: 'Aadhaar Back', key: 'aadhaar_back_url' },
                      { label: 'PAN Card', key: 'pan_card_url' },
                      { label: 'FSSAI Certificate', key: 'fssai_certificate_url' },
                    ].map((doc) => {
                      const link = getDocLink(chef[doc.key]);
                      return (
                        <div key={doc.key} className="rounded-3xl border border-slate-800 bg-slate-950 p-5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-white">{doc.label}</p>
                            <p className="mt-2 text-xs text-slate-500">{chef[doc.key] ? 'Uploaded' : 'Not available'}</p>
                          </div>
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500 transition">
                              <Eye className="h-4 w-4" /> View
                            </a>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-800 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Missing</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeDetailTab === 'credentials' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">Credentials</h2>
                      <p className="text-sm text-slate-400">Important chef credentials and documents.</p>
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: 'Verification Status', value: chef.verification_status },
                      { label: 'Chef Unique Code', value: chef.chef_unique_code },
                      { label: 'Payment Status', value: chef.payment_status || 'Unknown' },
                      { label: 'GST Number', value: chef.gst_number },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl bg-slate-900 p-5 border border-slate-800">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-sm font-black text-white">{item.value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
