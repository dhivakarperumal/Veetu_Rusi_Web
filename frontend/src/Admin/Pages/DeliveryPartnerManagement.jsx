import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Eye,
  Bike,
  List,
  LayoutGrid,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
} from "lucide-react";

const tabs = [
  { id: "basic", label: "Basic Info" },
  { id: "contact", label: "Contact Details" },
  { id: "address", label: "Address Details" },
  { id: "login", label: "Login & Auth" },
  { id: "vehicle", label: "Vehicle Info" },
  { id: "license", label: "Driving License" },
  { id: "kyc", label: "KYC & Aadhaar" },
  { id: "bank", label: "Bank & Payment" },
  { id: "availability", label: "Availability" },
  { id: "zone", label: "Delivery Zone" },
];

const emptyForm = {
  // Basic
  delivery_partner_code: "",
  name: "",
  father_husband_name: "",
  gender: "Male",
  date_of_birth: "",
  age: "",
  profile_photo: null,
  cover_photo: null,
  marital_status: "Single",
  blood_group: "",
  // Contact
  mobile: "",
  email: "",
  
  // Address
  door_number: "",
  street_name: "",
  area_name: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  country: "India",
  latitude: "",
  longitude: "",
  map_link: "",
  // Login
  username: "",
  password: "",
  confirmPassword: "",
  otp_verified: false,
  email_verified: false,
  device_id: "",
  login_status: "Active",
  account_status: "Pending",
  // Vehicle
  vehicle_type: "Bike",
  vehicle_brand: "",
  vehicle_model: "",
  vehicle_color: "",
  vehicle_number: "",
  rc_book_number: "",
  insurance_number: "",
  insurance_expiry_date: "",
  pollution_certificate_number: "",
  vehicle_front_photo: null,
  vehicle_back_photo: null,
  rc_book_image: null,
  insurance_document_image: null,
  // License
  license_number: "",
  license_holder_name: "",
  license_expiry_date: "",
  license_front_image: null,
  license_back_image: null,
  driving_experience: "",
  // KYC
  aadhaar_number: "",
  pan_number: "",
  aadhaar_front_url: null,
  aadhaar_back_url: null,
  pan_card_url: null,
  selfie_verification_url: null,
  police_verification_certificate: null,
  background_verification_status: "Pending",
  kyc_verification_status: "Pending",
  // Bank
  bank_name: "",
  account_holder_name: "",
  bank_account_number: "",
  ifsc_code: "",
  branch_name: "",
  upi_id: "",
  wallet_balance: "",
  pending_earnings: "",
  total_earnings: "",
  daily_earnings: "",
  weekly_earnings: "",
  monthly_earnings: "",
  incentive_amount: "",
  bonus_amount: "",
  // Availability
  online_status: "Offline",
  availability_schedule: "",
  working_days: "",
  shift_timing: "",
  current_location: "",
  last_active_time: "",
  break_time_status: "",
  // Zone
  assigned_delivery_area: "",
  delivery_radius: "",
  preferred_delivery_zone: "",
  city_coverage: "",
  area_coverage: "",
  zone_status: "Active",
  // Status
  status: "Pending",
};

const inp =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 text-sm focus:border-emerald-500 transition-all placeholder:text-gray-400";
const lbl =
  "text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1";

const DeliveryPartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/delivery-partners");
      setPartners(res.data);
      setFilteredPartners(res.data);
    } catch {
      toast.error("Failed to load delivery partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = partners;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.mobile?.includes(lower) ||
          p.vehicle_number?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }
    setFilteredPartners(result);
  }, [search, statusFilter, partners]);

  const handleDobChange = (e) => {
    const dob = e.target.value;
    let age = "";
    if (dob) {
      const b = new Date(dob), t = new Date();
      let a = t.getFullYear() - b.getFullYear();
      const m = t.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
      age = a >= 0 ? a.toString() : "";
    }
    setForm({ ...form, date_of_birth: dob, age });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const target = partners.find((p) => p.id === id);
      if (!target) return;
      await api.put(`/superadmin/delivery-partners/${id}`, { ...target, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchPartners();
      if (selectedPartner?.id === id) setSelectedPartner((prev) => ({ ...prev, status: newStatus }));
    } catch {
      toast.error("Failed to change status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this delivery partner?")) return;
    try {
      await api.delete(`/superadmin/delivery-partners/${id}`);
      toast.success("Delivery partner removed.");
      fetchPartners();
      if (selectedPartner?.id === id) { setSelectedPartner(null); setIsDetailOpen(false); }
    } catch {
      toast.error("Failed to delete partner.");
    }
  };

  const openAddModal = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setActiveTab("basic");
    setIsFormOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setActiveTab("basic");
    const mapped = {};
    Object.keys(emptyForm).forEach((k) => {
      mapped[k] = partner[k] !== undefined ? partner[k] : emptyForm[k];
    });
    mapped.password = "";
    mapped.confirmPassword = "";
    if (partner.date_of_birth) mapped.date_of_birth = partner.date_of_birth.substring(0, 10);
    if (partner.license_expiry_date) mapped.license_expiry_date = partner.license_expiry_date.substring(0, 10);
    if (partner.insurance_expiry_date) mapped.insurance_expiry_date = partner.insurance_expiry_date.substring(0, 10);
    setForm(mapped);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingPartner && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match."); return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key === "confirmPassword") return;
        const val = form[key];
        if (val instanceof FileList) {
          if (val.length > 0) formData.append(key, val[0]);
        } else if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });
      if (editingPartner) {
        await api.put(`/superadmin/delivery-partners/${editingPartner.id}`, formData);
        toast.success("Delivery partner updated.");
      } else {
        await api.post("/superadmin/delivery-partners", formData);
        toast.success("Delivery partner created.");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingPartner(null);
      fetchPartners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save delivery partner.");
    } finally {
      setSaving(false);
    }
  };

  const f = (key, label, type = "text", opts = {}) => (
    <div>
      <label className={lbl}>{label}</label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inp}
        placeholder={opts.placeholder || `Enter ${label}`}
        {...opts}
      />
    </div>
  );

  const sel = (key, label, options) => (
    <div>
      <label className={lbl}>{label}</label>
      <select value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inp}>
        {(!form[key] || form[key] === "") && <option value="">Select {label}</option>}
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  );

  const fileField = (key, label, currentVal) => (
    <div>
      <label className={lbl}>{label}</label>
      <input type="file" title={`Choose ${label}`} onChange={(e) => setForm({ ...form, [key]: e.target.files })} className={inp} />
      {currentVal && typeof currentVal === "string" && (
        <a href={`${import.meta.env.VITE_API_URL}/../uploads/delivery/${currentVal}`} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-500 hover:underline mt-1 block">
          View Uploaded File
        </a>
      )}
    </div>
  );

  const toggle = (key, label) => (
    <div className="flex items-center gap-3">
      <input type="checkbox" id={key} checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
      <label htmlFor={key} className="text-sm font-semibold text-gray-700">{label}</label>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("delivery_partner_code", "Delivery Partner Code")}
            {f("name", "Full Name")}
            {f("father_husband_name", "Father / Husband Name")}
            {sel("gender", "Gender", ["Male", "Female", "Other"])}
            <div>
              <label className={lbl}>Date of Birth</label>
              <input type="date" value={form.date_of_birth || ""} onChange={handleDobChange} className={inp} />
            </div>
            {f("age", "Age", "number")}
            {sel("marital_status", "Marital Status", ["Single", "Married", "Divorced", "Widowed"])}
            {f("blood_group", "Blood Group")}
            {fileField("profile_photo", "Profile Photo", form.profile_photo)}
            {fileField("cover_photo", "Cover Photo", form.cover_photo)}
          </div>
        );
      case "contact":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Contact details moved to Login & Auth tab */}
          </div>
        );
      case "address":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("door_number", "Door Number")}
            {f("street_name", "Street Name")}
            {f("area_name", "Area Name")}
            {f("landmark", "Landmark")}
            {f("city", "City")}
            {f("district", "District")}
            {f("state", "State")}
            {f("pincode", "Pincode")}
            {f("country", "Country")}
            {f("latitude", "Latitude")}
            {f("longitude", "Longitude")}
            {f("map_link", "Google Map Link")}
          </div>
        );
      case "login":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           
            {f("username", "Username")}
             {f("mobile", "Mobile Number", "tel")}
            {f("email", "Email Address", "email")}
            {f("password", "Password", "password")}
            {f("confirmPassword", "Confirm Password", "password")}
            
            {f("device_id", "Device ID")}
            {f("last_login_time", "Last Login Time", "datetime-local")}
            {sel("login_status", "Login Status", ["Active", "Inactive", "Blocked"])}
            {sel("account_status", "Account Status", ["Pending", "Active", "Suspended", "Blocked"])}
            {sel("status", "Application Status", ["Pending", "Approved", "Suspended", "Rejected"])}
          </div>
        );
      case "vehicle":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sel("vehicle_type", "Vehicle Type", ["Bike", "Scooter", "Bicycle", "Car", "Auto"])}
            {f("vehicle_brand", "Vehicle Brand")}
            {f("vehicle_model", "Vehicle Model")}
            {f("vehicle_color", "Vehicle Color")}
            {f("vehicle_number", "Vehicle Registration Number")}
            {f("rc_book_number", "RC Book Number")}
            {f("insurance_number", "Vehicle Insurance Number")}
            <div>
              <label className={lbl}>Insurance Expiry Date</label>
              <input type="date" value={form.insurance_expiry_date || ""} onChange={(e) => setForm({ ...form, insurance_expiry_date: e.target.value })} className={inp} />
            </div>
            {f("pollution_certificate_number", "Pollution Certificate Number")}
            {fileField("vehicle_front_photo", "Vehicle Front Photo", form.vehicle_front_photo)}
            {fileField("vehicle_back_photo", "Vehicle Back Photo", form.vehicle_back_photo)}
            {fileField("rc_book_image", "RC Book Image", form.rc_book_image)}
            {fileField("insurance_document_image", "Insurance Document Image", form.insurance_document_image)}
          </div>
        );
      case "license":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("license_number", "Driving License Number")}
            {f("license_holder_name", "License Holder Name")}
            <div>
              <label className={lbl}>License Expiry Date</label>
              <input type="date" value={form.license_expiry_date || ""} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} className={inp} />
            </div>
            {f("driving_experience", "Driving Experience (years)", "number")}
            {fileField("license_front_image", "License Front Image", form.license_front_image)}
            {fileField("license_back_image", "License Back Image", form.license_back_image)}
          </div>
        );
      case "kyc":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("aadhaar_number", "Aadhaar Number")}
            {f("pan_number", "PAN Number")}
            {fileField("aadhaar_front_url", "Aadhaar Front Image", form.aadhaar_front_url)}
            {fileField("aadhaar_back_url", "Aadhaar Back Image", form.aadhaar_back_url)}
            {fileField("pan_card_url", "PAN Card Image", form.pan_card_url)}
            {fileField("selfie_verification_url", "Selfie Verification Photo", form.selfie_verification_url)}
            {fileField("police_verification_certificate", "Police Verification Certificate", form.police_verification_certificate)}
            {sel("background_verification_status", "Background Verification Status", ["Pending", "Verified", "Rejected"])}
            {sel("kyc_verification_status", "KYC Verification Status", ["Pending", "Verified", "Rejected"])}
          </div>
        );
      case "bank":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("bank_name", "Bank Name")}
            {f("account_holder_name", "Account Holder Name")}
            {f("bank_account_number", "Account Number")}
            {f("ifsc_code", "IFSC Code")}
            {f("branch_name", "Branch Name")}
            {f("upi_id", "UPI ID")}
            {f("wallet_balance", "Wallet Balance", "number")}
            {f("pending_earnings", "Pending Earnings", "number")}
            {f("total_earnings", "Total Earnings", "number")}
            {f("daily_earnings", "Daily Earnings", "number")}
            {f("weekly_earnings", "Weekly Earnings", "number")}
            {f("monthly_earnings", "Monthly Earnings", "number")}
            {f("incentive_amount", "Incentive Amount", "number")}
            {f("bonus_amount", "Bonus Amount", "number")}
          </div>
        );
      case "availability":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sel("online_status", "Online Status", ["Online", "Offline", "Busy"])}
            {f("availability_schedule", "Availability Schedule")}
            {f("working_days", "Working Days")}
            {f("shift_timing", "Shift Timing")}
            {f("current_location", "Current Location")}
            {f("last_active_time", "Last Active Time", "datetime-local")}
            {f("break_time_status", "Break Time Status")}
          </div>
        );
      case "zone":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {f("assigned_delivery_area", "Assigned Delivery Area")}
            {f("delivery_radius", "Delivery Radius (km)", "number")}
            {f("preferred_delivery_zone", "Preferred Delivery Zone")}
            {f("city_coverage", "City Coverage")}
            {f("area_coverage", "Area Coverage")}
            {sel("zone_status", "Zone Status", ["Active", "Inactive"])}
          </div>
        );
      default:
        return null;
    }
  };

  const approvedCount = partners.filter((p) => p.status === "Approved").length;
  const pendingCount = partners.filter((p) => p.status === "Pending").length;
  const suspendedCount = partners.filter((p) => ["Suspended", "Rejected"].includes(p.status)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div />
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Delivery Partner
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#0f1628] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-700/40">
              <List className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-violet-300/70 font-black uppercase tracking-[0.2em]">Total Partners</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{partners.length}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">All registered delivery partners</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">Approved Partners</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{approvedCount}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">Active & verified partners</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">Pending & Suspended</p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">{pendingCount + suspendedCount}</h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">Awaiting review or action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, mobile or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-600 focus:bg-white focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`} title="Table View">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("card")} className={`p-2 rounded-lg transition ${viewMode === "card" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`} title="Card View">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-200">
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center w-16">S.No</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Partner Info</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Vehicle Details</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Deliveries</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Earnings</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Status</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((partner, index) => (
                  <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-center text-sm font-black text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{partner.name}</h4>
                          <p className="text-xs text-slate-400 font-medium">{partner.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {partner.vehicle_type} &bull; {partner.vehicle_number}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-slate-700">{partner.total_deliveries || 0}</td>
                    <td className="px-5 py-4 text-sm font-black text-emerald-600">₹{parseFloat(partner.earnings || 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${partner.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : partner.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedPartner(partner); setIsDetailOpen(true); }} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(partner)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        {partner.status !== "Approved" && <button onClick={() => handleStatusChange(partner.id, "Approved")} className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition" title="Approve"><Check className="w-4 h-4" /></button>}
                        {partner.status === "Approved" && <button onClick={() => handleStatusChange(partner.id, "Suspended")} className="p-1.5 hover:bg-amber-50 text-amber-500 hover:text-amber-700 rounded-lg transition" title="Suspend"><ShieldAlert className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(partner.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPartners.length === 0 && (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-xs text-slate-400 italic">No delivery partners match your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800">{partner.name}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{partner.vehicle_type}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${partner.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : partner.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {partner.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p><strong className="text-slate-600">Mobile:</strong> {partner.mobile}</p>
                  <p><strong className="text-slate-600">Vehicle No:</strong> {partner.vehicle_number}</p>
                  <p><strong className="text-slate-600">Deliveries:</strong> {partner.total_deliveries || 0}</p>
                  <p><strong className="text-slate-600">Earnings:</strong> <span className="text-emerald-600 font-black">₹{parseFloat(partner.earnings || 0).toLocaleString()}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                <button onClick={() => { setSelectedPartner(partner); setIsDetailOpen(true); }} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:text-slate-800 transition text-center border border-slate-200">Details</button>
                <button onClick={() => openEditModal(partner)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition border border-slate-200" title="Edit"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(partner.id)} className="p-2 bg-slate-50 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition border border-slate-200" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {filteredPartners.length === 0 && <p className="col-span-full text-center text-xs text-slate-400 italic py-8">No delivery partners match your criteria.</p>}
        </div>
      )}

      {/* Add / Edit Form Popup */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
          <div className="border border-white/10 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] bg-transparent">
            {/* Form Header */}
            <div className="p-4 text-white flex-shrink-0 flex justify-between items-center bg-emerald-800 rounded-t-[2.5rem] border-b border-white/5">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">
                  {editingPartner ? "Edit Delivery Partner" : "Add New Delivery Partner"}
                </h3>
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1">
                  Complete the 10-tab verification and setup details
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/15 rounded-full text-white/70 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tab List */}
            <div className="border-b border-gray-100 bg-white p-1 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin relative z-20">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-shrink-0 mx-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition focus:outline-none ${activeTab === t.id ? "bg-emerald-800 text-white shadow-inner" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-gray-50">
              <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
              <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100 rounded-b-[2.5rem] flex justify-between items-center gap-4">
                <div className="flex gap-2">
                  {tabs.map((t, i) => (
                    <div key={t.id} className={`w-2 h-2 rounded-full transition-all ${activeTab === t.id ? "bg-emerald-700 w-5" : "bg-gray-200"}`} />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl transition">Cancel</button>
                  <button type="submit" disabled={saving} className="px-8 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95 disabled:opacity-60">
                    {saving ? "Saving..." : editingPartner ? "Update Partner" : "Create Partner"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Details View Modal */}
      {isDetailOpen && selectedPartner && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsDetailOpen(false)} />
          <div className="border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] bg-white">
            <div className="p-8 text-white flex-shrink-0 flex justify-between items-center bg-emerald-800 rounded-t-[2.5rem]">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">{selectedPartner.name}</h3>
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1">Delivery Partner Overview</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/15 rounded-full text-white/70 hover:text-white transition"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {[
                  ["Mobile", selectedPartner.mobile],
                  ["Email", selectedPartner.email || "N/A"],
                  ["Vehicle Type", selectedPartner.vehicle_type],
                  ["Vehicle Number", selectedPartner.vehicle_number],
                  ["Driving License", selectedPartner.license_number || "N/A"],
                  ["Aadhaar Number", selectedPartner.aadhaar_number || "N/A"],
                  ["Total Deliveries", selectedPartner.total_deliveries || 0],
                  ["Total Earnings", `₹${parseFloat(selectedPartner.earnings || 0).toLocaleString()}`],
                  ["KYC Status", selectedPartner.kyc_verification_status || "N/A"],
                  ["Status", selectedPartner.status],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
              {selectedPartner.status !== "Approved" && (
                <button onClick={() => { handleStatusChange(selectedPartner.id, "Approved"); setIsDetailOpen(false); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95">Approve Partner</button>
              )}
              {selectedPartner.status === "Pending" && (
                <button onClick={() => { handleStatusChange(selectedPartner.id, "Rejected"); setIsDetailOpen(false); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95">Reject Application</button>
              )}
              <button onClick={() => setIsDetailOpen(false)} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DeliveryPartnerManagement;
