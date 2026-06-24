import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, ShieldCheck, Phone, Mail, MapPin, CreditCard, FileText, Bike, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const DeliveryPartnerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const res = await api.get(`/admin/delivery-partners/${id}`);
        setPartner(res.data);
      } catch (err) {
        console.error('Failed to load delivery partner details', err);
        toast.error('Failed to load delivery partner details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPartner();
  }, [id]);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${import.meta.env.VITE_API_URL}/../uploads/deliverypartners/${url}`;
  };

  const getStatusBadge = (status) => {
    if (status === 'Active' || status === 'Approved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-sm text-slate-500">
          Loading delivery partner details...
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <button
          onClick={() => navigate('/admin/delivery-partners')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-sm text-slate-500">
          Delivery partner not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <button
              onClick={() => navigate('/admin/delivery-partners')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Delivery Partners
            </button>
          </div>
          <h2 className="text-3xl font-black text-slate-900">Partner Details</h2>
          <p className="text-sm text-slate-500">
            Comprehensive information for this delivery partner.
          </p>
        </div>
        <div className="flex gap-3">
          <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-black uppercase tracking-[0.2em] shadow-sm ${getStatusBadge(partner.status)}`}>
            {partner.status || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main Details */}
        <div className="space-y-6">
          {partner.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-center hover:-translate-y-1 transition duration-300">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-900">{partner.stats.deliveredOrders || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Delivered</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-center hover:-translate-y-1 transition duration-300">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                  <Bike className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-900">{partner.stats.acceptedOrders || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Accepted</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-center hover:-translate-y-1 transition duration-300">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                  <XCircle className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-900">{partner.stats.cancelledOrders || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Cancelled</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-center hover:-translate-y-1 transition duration-300">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-900">{partner.stats.newOrders || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">New Orders</p>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                {partner.profile_photo ? (
                  <img src={getImageUrl(partner.profile_photo)} alt={partner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-black">
                    {(partner.first_name?.[0] || partner.name?.[0] || 'D').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">{partner.name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim()}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> {partner.mobile}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> {partner.email || 'No email provided'}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] font-black text-slate-400 flex items-center gap-2 mb-2"><MapPin className="w-3.5 h-3.5" /> Location</p>
                <div className="text-sm text-slate-700 font-medium">
                  {partner.current_address ? <p>{partner.current_address}</p> : <p className="text-slate-400 italic">No address</p>}
                  {partner.city && <p className="mt-1">{partner.city}, {partner.state} {partner.pincode}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] font-black text-slate-400 flex items-center gap-2 mb-2"><ShieldCheck className="w-3.5 h-3.5" /> Verification</p>
                <div className="text-sm text-slate-700 space-y-1 font-medium">
                  <p>Aadhaar: <span className="text-slate-900">{partner.aadhaar_number || 'N/A'}</span></p>
                  <p>PAN: <span className="text-slate-900">{partner.pan_number || 'N/A'}</span></p>
                  <p>DOB: <span className="text-slate-900">{partner.date_of_birth ? new Date(partner.date_of_birth).toLocaleDateString() : 'N/A'}</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" /> Bank Details</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Account Name</p>
                <p className="mt-1 font-semibold text-slate-800">{partner.account_holder_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Bank Name</p>
                <p className="mt-1 font-semibold text-slate-800">{partner.bank_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Account Number</p>
                <p className="mt-1 font-semibold text-slate-800">{partner.bank_account_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">IFSC / Branch</p>
                <p className="mt-1 font-semibold text-slate-800">{partner.ifsc_code || 'N/A'} / {partner.branch_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
            <h4 className="text-lg font-black text-white mb-6">Vehicle Info</h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Type & Brand</p>
                <p className="mt-1 font-bold text-white/90">{partner.vehicle_type || 'Unknown'} - {partner.vehicle_brand || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Model & Color</p>
                <p className="mt-1 font-bold text-white/90">{partner.vehicle_model || 'N/A'} ({partner.vehicle_color || 'N/A'})</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Vehicle Number</p>
                <div className="mt-1 inline-flex rounded-lg bg-yellow-400/10 px-3 py-1.5 text-yellow-500 font-black border border-yellow-400/20">
                  {partner.vehicle_number || 'NOT REGISTERED'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500" /> Documents</h4>
            <div className="space-y-3">
              {[
                { label: 'Aadhaar Front', file: partner.aadhaar_front_url },
                { label: 'Aadhaar Back', file: partner.aadhaar_back_url },
                { label: 'PAN Card', file: partner.pan_card_url },
                { label: 'License Front', file: partner.license_front_image },
                { label: 'License Back', file: partner.license_back_image },
                { label: 'Vehicle Front', file: partner.vehicle_front_photo },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{doc.label}</span>
                  {doc.file ? (
                    <a href={getImageUrl(doc.file)} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 hover:underline">
                      View
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerDetails;
