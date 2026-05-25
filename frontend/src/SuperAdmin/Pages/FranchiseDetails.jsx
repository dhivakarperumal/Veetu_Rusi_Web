import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { Landmark, MapPin } from "lucide-react";

const FranchiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedHomeChefCount, setLinkedHomeChefCount] = useState(0);
  const [linkedDeliveryPartnerCount, setLinkedDeliveryPartnerCount] = useState(0);

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
        setLinkedHomeChefCount(homeChefRes.data.filter(matcher).length);
        setLinkedDeliveryPartnerCount(deliveryRes.data.filter(matcher).length);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/superadmin/franchises')} className="px-4 py-2 bg-white border rounded-lg">← Back</button>
        <h2 className="text-2xl font-black">{franchise.franchise_name}</h2>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">{franchise.franchise_name}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="w-4 h-4" />{franchise.city}, {franchise.state}</div>
          </div>
          <div className="text-sm font-bold">{franchise.commission_percentage}% Commission</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase">Owner</p>
            <p className="font-bold">{franchise.owner_name}</p>
            <p className="text-sm text-slate-600">{franchise.email} • {franchise.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Linked</p>
            <p className="font-bold">Home Chefs: {linkedHomeChefCount}</p>
            <p className="font-bold">Delivery Partners: {linkedDeliveryPartnerCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseDetails;
