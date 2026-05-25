import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Landmark, MapPin, UserCheck, Clock, List, KeyRound, Copy } from "lucide-react";

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!franchise) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 bg-gradient-to-b from-slate-50 to-white min-h-screen p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/superadmin/franchises')} className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-xl transition shadow-sm active:scale-95">← Back to List</button>
          <h2 className="text-3xl font-black tracking-tight">{franchise.franchise_name}</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-3 py-2 rounded-lg">{franchise.commission_percentage}% Commission</span>
          <button onClick={() => { navigate('/superadmin/franchises'); toast('Open the list to edit.'); }} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-slate-50">Edit Details</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-rose-100">Delete Owner</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-6 shadow-lg shadow-emerald-100/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700/70">Home Chefs</p>
                  <p className="text-5xl font-black text-slate-900 mt-4">{linkedHomeChefCount}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-500 max-w-xs">Total linked home chefs for this franchise.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm border border-emerald-200">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-100 p-6 shadow-lg shadow-slate-200/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Delivery Partners</p>
                  <p className="text-5xl font-black text-slate-900 mt-4">{linkedDeliveryPartnerCount}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-500 max-w-xs">Total linked delivery partners for this franchise.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm border border-slate-200">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 border-r border-slate-100 pr-6">
          <button onClick={() => setActiveDetailTab('franchise')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'franchise' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Landmark className="w-4 h-4" /> FRANCHISE INFO
          </button>
          <button onClick={() => setActiveDetailTab('owner')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'owner' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <UserCheck className="w-4 h-4" /> OWNER PROFILE
          </button>
          <button onClick={() => setActiveDetailTab('homechefs')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'homechefs' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <List className="w-4 h-4" /> HOME CHEFS
          </button>
          <button onClick={() => setActiveDetailTab('deliverypartners')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'deliverypartners' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <MapPin className="w-4 h-4" /> DELIVERY PARTNERS
          </button>
          <button onClick={() => setActiveDetailTab('subscription')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'subscription' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Clock className="w-4 h-4" /> SUBSCRIPTION
          </button>
          <button onClick={() => setActiveDetailTab('credentials')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === 'credentials' ? 'bg-[#1B4D22] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <KeyRound className="w-4 h-4" /> CREDENTIALS & ACCESS
          </button>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-lg">
          {activeDetailTab === 'franchise' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Franchise Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Franchise Name</span>
                  <span className="text-sm font-bold text-slate-800">{franchise.franchise_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Commission Rate</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md mt-0.5">{franchise.commission_percentage}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Territory Location</span>
                  <div className="flex items-center gap-1.5 mt-0.5"><MapPin className="w-4 h-4 text-rose-500" /> <span className="text-sm font-bold text-slate-800">{franchise.city}, {franchise.state}</span></div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Registration Date</span>
                  <span className="text-sm font-bold text-slate-800">{new Date(franchise.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'owner' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Owner Profile Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Owner Name</span>
                  <span className="text-sm font-bold text-slate-800">{franchise.owner_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Email Address</span>
                  <span className="text-sm font-bold text-slate-800">{franchise.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Mobile Phone</span>
                  <span className="text-sm font-bold text-slate-800">{franchise.mobile}</span>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'credentials' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">System Credentials & Access</h3>
              {franchise.franch_user_id ? (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 flex-shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Access Role: Admin</p>
                      <code className="text-xs text-slate-500 font-mono mt-0.5 block truncate max-w-xs md:max-w-md">{franchise.franch_user_id}</code>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => copy(franchise.franch_user_id)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-sm"><Copy className="w-3.5 h-3.5" /> Copy UUID</button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center text-amber-600 border border-amber-200/50 flex-shrink-0">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-tight">Pending Activation & Approval</p>
                      <p className="text-xs text-amber-600/80 font-bold mt-0.5">This franchise does not have user login credentials set up yet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeDetailTab === 'subscription' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Subscription Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Status</p>
                  <p className="font-bold">{getSubscriptionLabel(franchise) === 'Trial' ? `Trial (${getTrialDaysLeft(franchise)} days left)` : getSubscriptionLabel(franchise)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Start Date</p>
                  <p className="font-bold">{formatDate(franchise.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Expiry Date</p>
                  <p className="font-bold">{formatDate(franchise.expiry_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Days Remaining</p>
                  <p className="font-bold">{getTrialDaysLeft(franchise)} days</p>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'homechefs' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Linked Home Chefs</h3>
              {linkedHomeChefs.length > 0 ? (
                <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-700 text-slate-100 text-[10px] uppercase tracking-[0.2em] font-black">
                        <th className="px-5 py-4 text-center">S.No</th>
                        <th className="px-5 py-4">Chef Name</th>
                        <th className="px-5 py-4">Mobile</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Chef Code</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {linkedHomeChefs.map((chef, index) => (
                        <tr key={chef.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-xs font-bold text-slate-500 text-center">{index + 1}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-sm font-bold text-slate-800">{chef.name || chef.owner_name || 'Unnamed Chef'}</div>
                            <div className="text-xs text-slate-500">{chef.city ? `${chef.city}, ${chef.state}` : '—'}</div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{chef.mobile || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]" title={chef.email}>{chef.email || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{chef.chef_unique_code || chef.chef_id || '—'}</td>
                          <td className="px-5 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${chef.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{chef.status || 'Pending'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600">No home chefs are currently linked to this franchise.</div>
              )}
            </div>
          )}

          {activeDetailTab === 'deliverypartners' && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Linked Delivery Partners</h3>
              {linkedDeliveryPartners.length > 0 ? (
                <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-700 text-slate-100 text-[10px] uppercase tracking-[0.2em] font-black">
                        <th className="px-5 py-4 text-center">S.No</th>
                        <th className="px-5 py-4">Partner Name</th>
                        <th className="px-5 py-4">Mobile</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Vehicle</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {linkedDeliveryPartners.map((partner, index) => (
                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-xs font-bold text-slate-500 text-center">{index + 1}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-sm font-bold text-slate-800">{partner.name || 'Unnamed Partner'}</div>
                            <div className="text-xs text-slate-500">{partner.city ? `${partner.city}, ${partner.state}` : '—'}</div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{partner.mobile || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]" title={partner.email}>{partner.email || '—'}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{partner.vehicle_number || partner.vehicle_type || '—'}</td>
                          <td className="px-5 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${partner.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{partner.status || 'Pending'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600">No delivery partners are currently linked to this franchise.</div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseDetails;
