import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { ArrowLeft, PlusSquare, Truck } from "lucide-react";

const HomeChefDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "add-products", label: "Add Products" },
    { id: "orders", label: "Orders" },
    { id: "delivery-orders", label: "Delivery Orders" },
  ];

  useEffect(() => {
    const fetchChef = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/superadmin/homechefs/${id}`);
        setChef(res.data);
      } catch (error) {
        toast.error("Unable to load home chef details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChef();
    }
  }, [id]);

  const getDocLink = (filename) => {
    return filename
      ? `${import.meta.env.VITE_API_URL}/../uploads/homechefs/${filename}`
      : null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="rounded-3xl border border-slate-700 p-8 bg-slate-950 text-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg font-black">Chef details not found</h2>
        </div>
        <p className="text-sm text-slate-400">This chef id may be invalid or the record was removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs uppercase tracking-widest text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back to chefs
          </button>
          <h1 className="mt-4 text-3xl font-black text-white">{chef.name || "Home Chef"}</h1>
          <p className="text-sm text-slate-400 mt-2">Chef Code: {chef.chef_unique_code || "N/A"}</p>
        </div>
        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
          <p className="font-black uppercase tracking-[0.25em] text-slate-400">Status</p>
          <span
            className={`inline-flex mt-3 items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
              chef.status === "Approved"
                ? "bg-emerald-50 text-emerald-700"
                : chef.status === "Pending"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {chef.status || "Unknown"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Contact Info</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <strong className="text-slate-200">Mobile:</strong> {chef.mobile || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Email:</strong> {chef.email || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">WhatsApp:</strong> {chef.whatsapp_number || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Emergency Contact:</strong> {chef.emergency_contact || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Home Kitchen</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <strong className="text-slate-200">Kitchen Name:</strong> {chef.kitchen_name || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Cuisine:</strong> {chef.cuisine_type || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Specialty:</strong> {chef.specialty_food || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Signature Dish:</strong> {chef.signature_dish || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Location</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <strong className="text-slate-200">City:</strong> {chef.city || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">District:</strong> {chef.district || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">State:</strong> {chef.state || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Pincode:</strong> {chef.pincode || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-4">Documents</h2>
              <div className="space-y-3 text-sm text-slate-300">
                {[
                  { label: "Aadhaar Front", value: chef.aadhaar_front_url },
                  { label: "Aadhaar Back", value: chef.aadhaar_back_url },
                  { label: "PAN Card", value: chef.pan_card_url },
                  { label: "FSSAI Certificate", value: chef.fssai_certificate_url },
                  { label: "GST Certificate", value: chef.gst_certificate_url },
                  { label: "Signature", value: chef.signature_url },
                  { label: "Selfie Verification", value: chef.selfie_verification_url },
                ].map((doc) => (
                  <div key={doc.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <span>{doc.label}</span>
                    {doc.value ? (
                      <a
                        href={getDocLink(doc.value)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-500">Not uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-4">Chef Profile</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  <strong className="text-slate-200">Gender:</strong> {chef.gender || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">DOB:</strong> {chef.date_of_birth || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Age:</strong> {chef.age || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-200">Booking Status:</strong> {chef.verification_status || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "add-products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Add Product</p>
                  <h3 className="mt-3 text-2xl font-black text-white">Create new listing</h3>
                </div>
                <div className="rounded-3xl bg-emerald-600/10 p-3 text-emerald-200">
                  <PlusSquare className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Add a product for this chef and attach it to their kitchen profile.
              </p>
              <button
                onClick={() => navigate(`/admin/products/add?chefId=${id}`)}
                className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-500"
              >
                Add Product
              </button>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Chef Products</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.product_count ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Total products assigned to this chef.</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pending Reviews</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.pending_products ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Products awaiting admin approval.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm text-slate-300">
            <h3 className="text-lg font-black text-white">Note</h3>
            <p className="mt-3 text-sm text-slate-400">
              Use the add product flow to create listings for this chef. If you want to edit chef-specific product details later, use the product management section.
            </p>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total Orders</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.total_orders ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Orders placed for this chef.</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pending Orders</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.pending_orders ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Orders waiting for confirmation.</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Completed Orders</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.completed_orders ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Fulfilled orders for this chef.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Orders Overview</h3>
                <p className="mt-3 text-sm text-slate-400">Review order metrics and navigate to the order management screen.</p>
              </div>
              <button
                onClick={() => navigate('/admin/orders/all')}
                className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-200 transition hover:bg-slate-700"
              >
                View All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery-orders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery Orders</p>
                  <h3 className="mt-3 text-2xl font-black text-white">{chef.delivery_orders ?? 0}</h3>
                </div>
                <div className="rounded-3xl bg-slate-900 p-3 text-slate-200">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-400">Orders currently assigned to delivery.</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">In Transit</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.in_transit_orders ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Orders being delivered right now.</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivered</p>
              <p className="mt-4 text-4xl font-black text-white">{chef.delivered_orders ?? 0}</p>
              <p className="text-sm text-slate-400 mt-2">Orders already delivered.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Delivery workflow</h3>
                <p className="mt-3 text-sm text-slate-400">Track delivery order progress for this chef's customers.</p>
              </div>
              <button
                onClick={() => navigate('/admin/orders/delivery')}
                className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-200 transition hover:bg-slate-700"
              >
                Manage Deliveries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeChefDetail;
