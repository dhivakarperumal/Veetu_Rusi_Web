import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import {
  Search,
  Filter,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Eye,
  Plus,
  Edit2,
  List,
  LayoutGrid,
  MapPin,
  CheckCircle,
  Clock,
} from "lucide-react";

const emptyForm = {
  chef_unique_code: "",
  name: "",
  father_husband_name: "",
  gender: "Male",
  date_of_birth: "",
  age: "",
  profile_photo: null,
  cover_banner: null,
  mobile: "",
  alt_mobile: "",
  whatsapp_number: "",
  email: "",
  emergency_contact: "",
  door_number: "",
  street_name: "",
  area_name: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  map_link: "",
  kitchen_name: "",
  kitchen_address: "",
  kitchen_type: "Home Kitchen",
  kitchen_photos: null,
  kitchen_videos: null,
  seating_available: false,
  dining_available: false,
  takeaway_available: false,
  delivery_available: false,
  specialty_food: "",
  cuisine_type: "South Indian",
  signature_dish: "",
  veg_nonveg: "Veg",
  experience_years: "",
  cooking_style: "",
  preparation_time: "",
  daily_order_capacity: "",
  available_days: "",
  opening_time: "",
  closing_time: "",
  holiday_schedule: "",
  busy_hours: "",
  instant_order: false,
  pre_order: false,
  aadhaar_number: "",
  pan_number: "",
  fssai_number: "",
  gst_number: "",
  bank_account_number: "",
  ifsc_code: "",
  account_holder_name: "",
  upi_id: "",
  aadhaar_front_url: null,
  aadhaar_back_url: null,
  pan_card_url: null,
  fssai_certificate_url: null,
  gst_certificate_url: null,
  signature_url: null,
  selfie_verification_url: null,
  username: "",
  password: "",
  confirmPassword: "",
  otp_verified: false,
  email_verified: false,
  login_status: "Active",
  verification_status: "Pending",
  approval_status: "Pending",
  rejection_reason: "",
  block_reason: "",
  kyc_verification_notes: "",
};

const tabs = [
  { id: "basic", label: "Basic Info" },
  { id: "address", label: "Address Details" },
  { id: "kitchen", label: "Kitchen Info" },
  { id: "food", label: "Food & Specialty" },
  { id: "availability", label: "Availability" },
  { id: "kyc", label: "Verification & KYC" },
  { id: "documents", label: "Upload Documents KYC" },
  { id: "account", label: "Account & Status" },
];

const HomeChefManagement = () => {
  const [chefs, setChefs] = useState([]);
  const [filteredChefs, setFilteredChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  // View Details Modal
  const [selectedChef, setSelectedChef] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Add / Edit Popup Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChef, setEditingChef] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/homechefs");
      setChefs(res.data);
      setFilteredChefs(res.data);
    } catch (error) {
      toast.error("Failed to load home chefs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = chefs;
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(lower) ||
          c.mobile?.includes(lower) ||
          c.email?.toLowerCase().includes(lower) ||
          c.kitchen_name?.toLowerCase().includes(lower),
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFilteredChefs(result);
  }, [search, statusFilter, chefs]);

  const handleDobChange = (e) => {
    const dob = e.target.value;
    let calculatedAge = "";
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let ageVal = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageVal--;
      }
      calculatedAge = ageVal >= 0 ? ageVal.toString() : "";
    }
    setForm({ ...form, date_of_birth: dob, age: calculatedAge });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/superadmin/homechefs/status/${id}`, {
        status: newStatus,
      });
      toast.success(`Home Chef status updated to ${newStatus}`);
      fetchChefs();
      if (selectedChef?.id === id) {
        setSelectedChef((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error("Failed to change home chef status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this home chef?"))
      return;
    try {
      await api.delete(`/superadmin/homechefs/${id}`);
      toast.success("Home chef profile removed.");
      fetchChefs();
      if (selectedChef?.id === id) {
        setSelectedChef(null);
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete chef.");
    }
  };

  const openAddModal = () => {
    setEditingChef(null);
    setForm(emptyForm);
    setActiveFormTab("basic");
    setIsFormOpen(true);
  };

  const openEditModal = (chef) => {
    setEditingChef(chef);
    setActiveFormTab("basic");
    setForm({
      chef_unique_code: chef.chef_unique_code || "",
      name: chef.name || "",
      father_husband_name: chef.father_husband_name || "",
      gender: chef.gender || "Male",
      date_of_birth: chef.date_of_birth
        ? chef.date_of_birth.substring(0, 10)
        : "",
      age: chef.age || "",
      profile_photo: chef.profile_photo || null,
      cover_banner: chef.cover_banner || null,
      mobile: chef.mobile || "",
      alt_mobile: chef.alt_mobile || "",
      whatsapp_number: chef.whatsapp_number || "",
      email: chef.email || "",
      emergency_contact: chef.emergency_contact || "",
      door_number: chef.door_number || "",
      street_name: chef.street_name || "",
      area_name: chef.area_name || "",
      landmark: chef.landmark || "",
      city: chef.city || "",
      district: chef.district || "",
      state: chef.state || "",
      pincode: chef.pincode || "",
      latitude: chef.latitude || "",
      longitude: chef.longitude || "",
      map_link: chef.map_link || "",
      kitchen_name: chef.kitchen_name || "",
      kitchen_address: chef.kitchen_address || "",
      kitchen_type: chef.kitchen_type || "Home Kitchen",
      kitchen_photos: chef.kitchen_photos || null,
      kitchen_videos: chef.kitchen_videos || null,
      seating_available: !!chef.seating_available,
      dining_available: !!chef.dining_available,
      takeaway_available: !!chef.takeaway_available,
      delivery_available: !!chef.delivery_available,
      specialty_food: chef.specialty_food || "",
      cuisine_type: chef.cuisine_type || "South Indian",
      signature_dish: chef.signature_dish || "",
      veg_nonveg: chef.veg_nonveg || "Veg",
      experience_years: chef.experience_years || "",
      cooking_style: chef.cooking_style || "",
      preparation_time: chef.preparation_time || "",
      daily_order_capacity: chef.daily_order_capacity || "",
      available_days: chef.available_days || "",
      opening_time: chef.opening_time || "",
      closing_time: chef.closing_time || "",
      holiday_schedule: chef.holiday_schedule || "",
      busy_hours: chef.busy_hours || "",
      instant_order: !!chef.instant_order,
      pre_order: !!chef.pre_order,
      aadhaar_number: chef.aadhaar_number || "",
      pan_number: chef.pan_number || "",
      fssai_number: chef.fssai_number || "",
      gst_number: chef.gst_number || "",
      bank_account_number: chef.bank_account_number || "",
      ifsc_code: chef.ifsc_code || "",
      account_holder_name: chef.account_holder_name || "",
      upi_id: chef.upi_id || "",
      aadhaar_front_url: chef.aadhaar_front_url || null,
      aadhaar_back_url: chef.aadhaar_back_url || null,
      pan_card_url: chef.pan_card_url || null,
      fssai_certificate_url: chef.fssai_certificate_url || null,
      gst_certificate_url: chef.gst_certificate_url || null,
      signature_url: chef.signature_url || null,
      selfie_verification_url: chef.selfie_verification_url || null,
      username: chef.username || "",
      password: "",
      confirmPassword: "",
      otp_verified: !!chef.otp_verified,
      email_verified: !!chef.email_verified,
      login_status: chef.login_status || "Active",
      verification_status: chef.verification_status || "Pending",
      approval_status: chef.approval_status || "Pending",
      rejection_reason: chef.rejection_reason || "",
      block_reason: chef.block_reason || "",
      kyc_verification_notes: chef.kyc_verification_notes || "",
      address: chef.address || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingChef && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      const multiFileFields = ["kitchen_photos", "kitchen_videos"];

      if (user && !editingChef) {
        formData.append("created_by_id", user.id || "");
        formData.append("created_by_user_id", user.user_id || "");
        formData.append("created_by_name", user.name || "");
        formData.append("created_by_email", user.email || "");
        formData.append("created_by_phone", user.phone || "");
      }

      Object.keys(form).forEach((key) => {
        if (key === "confirmPassword") return;
        const val = form[key];
        if (val instanceof FileList) {
          if (multiFileFields.includes(key)) {
            for (let i = 0; i < val.length; i++) {
              formData.append(key, val[i]);
            }
          } else if (val.length > 0) {
            formData.append(key, val[0]);
          }
        } else if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      if (editingChef) {
        await api.put(`/superadmin/homechefs/${editingChef.id}`, formData);
        toast.success("Home chef updated successfully.");
      } else {
        await api.post("/superadmin/homechefs", formData);
        toast.success("Home chef created successfully.");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingChef(null);
      fetchChefs();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save home chef.",
      );
    } finally {
      setSaving(false);
    }
  };

  const approvedCount = chefs.filter((c) => c.status === "Approved").length;
  const pendingCount = chefs.filter((c) => c.status === "Pending").length;
  const suspendedCount = chefs.filter((c) =>
    ["Suspended", "Rejected"].includes(c.status),
  ).length;

  const inp =
    "w-full px-4 py-3 rounded-[1.75rem] bg-slate-950/85 border border-white/10 text-slate-100 outline-none placeholder:text-slate-500 text-sm font-medium transition focus:border-emerald-400 focus:bg-slate-900";
  const lbl =
    "text-[11px] text-slate-300 font-black uppercase tracking-[0.24em] block mb-2";

  const renderFileField = (fieldName, label, currentValue) => {
    return (
      <div>
        <label className={lbl}>{label}</label>
        <input
          type="file"
          onChange={(e) => setForm({ ...form, [fieldName]: e.target.files })}
          className={inp}
          multiple={
            fieldName === "kitchen_photos" || fieldName === "kitchen_videos"
          }
        />
        {currentValue && typeof currentValue === "string" && (
          <div className="mt-1 text-xs">
            <a
              href={`${import.meta.env.VITE_API_URL}/../uploads/homechefs/${currentValue}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              View Uploaded File
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Home Chef Management</h2>
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
            Approve applications, inspect documents, and manage home chef accounts
          </p> */}
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Home Chef
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Chefs Card */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#0f1628] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            {/* Glow blob */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
            {/* Icon */}
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-700/40">
              <List className="w-6 h-6 text-white" />
            </div>
            {/* Text */}
            <div>
              <p className="text-[10px] text-violet-300/70 font-black uppercase tracking-[0.2em]">
                Total Chefs
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {chefs.length}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                All registered home chefs
              </p>
            </div>
          </div>
        </div>

        {/* Approved Chefs Card */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#071a10] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70 font-black uppercase tracking-[0.2em]">
                Approved Chefs
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {approvedCount}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                Active & verified chefs
              </p>
            </div>
          </div>
        </div>

        {/* Pending & Suspended Card */}
        <div className="relative overflow-hidden group rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-transparent hover:-translate-y-1 transition-all duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1004] to-[#0a0e1a] rounded-2xl p-6 flex items-center gap-5 h-full">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/40">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/70 font-black uppercase tracking-[0.2em]">
                Pending & Suspended
              </p>
              <h4 className="text-4xl font-black text-white mt-1 tracking-tight leading-none">
                {pendingCount + suspendedCount}
              </h4>
              <p className="text-[10px] text-white/25 font-semibold mt-1">
                Awaiting review or action
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search on Left, View Mode Switcher on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 superadmin-panel p-4 rounded-xl">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, mobile or kitchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl outline-none font-medium text-slate-100 text-sm focus:bg-slate-900 focus:border-emerald-600/40 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Right: Filters & View toggle mode */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl outline-none font-bold text-xs uppercase tracking-widest text-slate-100 focus:bg-slate-900 focus:border-emerald-600/40 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Suspended">Suspended</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-emerald-500/15 text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${
                viewMode === "card"
                  ? "bg-slate-900/80 text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
                  : "text-slate-500 hover:text-emerald-700"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
          <div className="superadmin-card overflow-hidden animate-in fade-in duration-200">
            <div className="superadmin-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/10">
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center w-16">
                    S.No
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Chef Info
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Kitchen Name
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Cuisine
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Mobile
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChefs.map((chef, index) => (
                  <tr
                    key={chef.id}
                    className="hover:bg-slate-900/80 transition-colors"
                  >
                    <td className="px-5 py-4 text-center text-sm font-black text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {chef.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {chef.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-300">
                      {chef.kitchen_name || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-300">
                      {chef.cuisine_type || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-300">
                      {chef.mobile}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          chef.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : chef.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {chef.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/homechefs/${chef.id}`)}
                          className="p-1.5 hover:bg-slate-800/70 text-slate-300 hover:text-white rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(chef)}
                          className="p-1.5 hover:bg-slate-800/70 text-slate-300 hover:text-white rounded-lg transition"
                          title="Edit Chef"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {chef.status !== "Approved" && (
                          <button
                            onClick={() =>
                              handleStatusChange(chef.id, "Approved")
                            }
                            className="p-1.5 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-100 rounded-lg transition"
                            title="Approve Chef"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {chef.status === "Approved" && (
                          <button
                            onClick={() =>
                              handleStatusChange(chef.id, "Suspended")
                            }
                            className="p-1.5 hover:bg-amber-500/10 text-amber-300 hover:text-amber-100 rounded-lg transition"
                            title="Suspend Chef"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(chef.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-200 rounded-lg transition"
                          title="Delete Chef"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredChefs.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-xs text-slate-400 italic"
                    >
                      No home chefs match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChefs.map((chef) => (
            <div
              key={chef.id}
              className="bg-slate-950/90 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-2xl transition-all duration-200 hover:shadow-2xl/40"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-white">
                      {chef.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {chef.kitchen_name || "No Kitchen Details"}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      chef.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : chef.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {chef.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>
                    <strong className="text-slate-300">Mobile:</strong>{" "}
                    {chef.mobile}
                  </p>
                  <p>
                    <strong className="text-slate-300">Email:</strong>{" "}
                    {chef.email}
                  </p>
                  <p>
                    <strong className="text-slate-300">Cuisine:</strong>{" "}
                    {chef.cuisine_type || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate(`/admin/homechefs/${chef.id}`)}
                  className="flex-1 py-2 bg-white/5 hover:bg-slate-800/60 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-200 hover:text-white transition text-center border border-white/10"
                >
                  Details
                </button>
                <button
                  onClick={() => openEditModal(chef)}
                  className="p-2 bg-white/5 hover:bg-slate-800/60 text-slate-300 hover:text-white rounded-xl transition border border-white/10"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(chef.id)}
                  className="p-2 bg-white/5 hover:bg-red-500/10 text-red-400 hover:text-red-200 rounded-xl transition border border-white/10"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredChefs.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 italic py-8">
              No home chefs match your criteria.
            </p>
          )}
        </div>
      )}

      {/* Edit/Add Form Popup Portal */}
      {isFormOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsFormOpen(false)}
            ></div>
            <div className="border border-white/10 w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] bg-transparent">
              <div className="p-8 text-white flex-shrink-0 flex justify-between items-center bg-emerald-800 rounded-t-[2.5rem] border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">
                    {editingChef
                      ? "Edit Home Chef Profile"
                      : "Add New Home Chef"}
                  </h3>
                  <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1">
                    Complete the 8-tab verification and setup details
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-full text-white/70 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs List */}
              <div className="border-b border-white/10 bg-slate-950/95 p-4 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin relative z-20">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveFormTab(t.id)}
                    className={`flex-shrink-0 mx-1 px-5 py-2 text-xs font-black uppercase tracking-wider rounded-full transition focus:outline-none focus:ring-0 ${
                      activeFormTab === t.id
                        ? "bg-emerald-500 text-slate-950 shadow-[0_15px_40px_rgba(16,185,129,0.18)]"
                        : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Form Fields container */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/95 text-slate-100"
              >
                {activeFormTab === "basic" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={lbl}>Chef Unique Code</label>
                      <input
                        type="text"
                        value={form.chef_unique_code}
                        onChange={(e) =>
                          setForm({ ...form, chef_unique_code: e.target.value })
                        }
                        placeholder="e.g. HC-9920"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Chef Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Chef Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Father / Husband Name</label>
                      <input
                        type="text"
                        value={form.father_husband_name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            father_husband_name: e.target.value,
                          })
                        }
                        placeholder="Father / Husband Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Date of Birth</label>
                      <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={handleDobChange}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Age (Auto calculated)</label>
                      <input
                        type="number"
                        readOnly
                        value={form.age}
                        className="w-full px-4 py-2.5 bg-[#070b13]/30 border border-white/5 rounded-xl outline-none font-medium text-white/50 text-sm cursor-not-allowed"
                      />
                    </div>
                    {renderFileField(
                      "profile_photo",
                      "Profile Photo",
                      form.profile_photo,
                    )}
                    {renderFileField(
                      "cover_banner",
                      "Cover Banner Image",
                      form.cover_banner,
                    )}
                  </div>
                )}

                {activeFormTab === "address" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className={lbl}>Door Number</label>
                      <input
                        type="text"
                        value={form.door_number}
                        onChange={(e) =>
                          setForm({ ...form, door_number: e.target.value })
                        }
                        placeholder="Door Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Street Name</label>
                      <input
                        type="text"
                        value={form.street_name}
                        onChange={(e) =>
                          setForm({ ...form, street_name: e.target.value })
                        }
                        placeholder="Street Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Area Name</label>
                      <input
                        type="text"
                        value={form.area_name}
                        onChange={(e) =>
                          setForm({ ...form, area_name: e.target.value })
                        }
                        placeholder="Area Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Landmark</label>
                      <input
                        type="text"
                        value={form.landmark}
                        onChange={(e) =>
                          setForm({ ...form, landmark: e.target.value })
                        }
                        placeholder="Landmark"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="City"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>District</label>
                      <input
                        type="text"
                        value={form.district}
                        onChange={(e) =>
                          setForm({ ...form, district: e.target.value })
                        }
                        placeholder="District"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>State</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) =>
                          setForm({ ...form, state: e.target.value })
                        }
                        placeholder="State"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Pincode</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) =>
                          setForm({ ...form, pincode: e.target.value })
                        }
                        placeholder="Pincode"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Latitude</label>
                      <input
                        type="text"
                        value={form.latitude}
                        onChange={(e) =>
                          setForm({ ...form, latitude: e.target.value })
                        }
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Longitude</label>
                      <input
                        type="text"
                        value={form.longitude}
                        onChange={(e) =>
                          setForm({ ...form, longitude: e.target.value })
                        }
                        className={inp}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={lbl}>Google Map Link</label>
                      <input
                        type="url"
                        value={form.map_link}
                        onChange={(e) =>
                          setForm({ ...form, map_link: e.target.value })
                        }
                        placeholder="Google Map Link (https://...)"
                        className={inp}
                      />
                    </div>
                  </div>
                )}

                {activeFormTab === "kitchen" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={lbl}>Kitchen Name</label>
                      <input
                        type="text"
                        value={form.kitchen_name}
                        onChange={(e) =>
                          setForm({ ...form, kitchen_name: e.target.value })
                        }
                        placeholder="Kitchen Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Kitchen Type</label>
                      <select
                        value={form.kitchen_type}
                        onChange={(e) =>
                          setForm({ ...form, kitchen_type: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Home Kitchen">Home Kitchen</option>
                        <option value="Commercial Kitchen">
                          Commercial Kitchen
                        </option>
                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={lbl}>Kitchen Address</label>
                      <textarea
                        value={form.kitchen_address}
                        onChange={(e) =>
                          setForm({ ...form, kitchen_address: e.target.value })
                        }
                        rows="2"
                        placeholder="Kitchen Address"
                        className={inp}
                      />
                    </div>
                    {renderFileField(
                      "kitchen_photos",
                      "Kitchen Photos (Multiple)",
                      form.kitchen_photos,
                    )}
                    {renderFileField(
                      "kitchen_videos",
                      "Kitchen Videos (Multiple)",
                      form.kitchen_videos,
                    )}

                    <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.seating_available}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              seating_available: e.target.checked,
                            })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Seating Available
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.dining_available}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              dining_available: e.target.checked,
                            })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Dining Available
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.takeaway_available}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              takeaway_available: e.target.checked,
                            })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Takeaway Available
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.delivery_available}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              delivery_available: e.target.checked,
                            })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Delivery Available
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {activeFormTab === "food" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={lbl}>Specialty Food</label>
                      <input
                        type="text"
                        value={form.specialty_food}
                        onChange={(e) =>
                          setForm({ ...form, specialty_food: e.target.value })
                        }
                        placeholder="e.g. Authentic Chettinad, Homemade Desserts"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Cuisine Type</label>
                      <select
                        value={form.cuisine_type}
                        onChange={(e) =>
                          setForm({ ...form, cuisine_type: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="South Indian">South Indian</option>
                        <option value="North Indian">North Indian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Fast Food">Fast Food</option>
                        <option value="Healthy Food">Healthy Food</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Signature Dish</label>
                      <input
                        type="text"
                        value={form.signature_dish}
                        onChange={(e) =>
                          setForm({ ...form, signature_dish: e.target.value })
                        }
                        placeholder="Signature Dish"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Veg / Non-Veg</label>
                      <select
                        value={form.veg_nonveg}
                        onChange={(e) =>
                          setForm({ ...form, veg_nonveg: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Veg">Veg Only</option>
                        <option value="Non-Veg">Non-Veg Only</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Experience (Years)</label>
                      <input
                        type="number"
                        value={form.experience_years}
                        onChange={(e) =>
                          setForm({ ...form, experience_years: e.target.value })
                        }
                        placeholder="Experience (Years)"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Cooking Style</label>
                      <input
                        type="text"
                        value={form.cooking_style}
                        onChange={(e) =>
                          setForm({ ...form, cooking_style: e.target.value })
                        }
                        placeholder="e.g. Traditional clay pot, Low oil"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Preparation Time (mins)</label>
                      <input
                        type="text"
                        value={form.preparation_time}
                        onChange={(e) =>
                          setForm({ ...form, preparation_time: e.target.value })
                        }
                        placeholder="e.g. 30-45 mins"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Daily Order Capacity</label>
                      <input
                        type="number"
                        value={form.daily_order_capacity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            daily_order_capacity: e.target.value,
                          })
                        }
                        placeholder="Daily Order Capacity"
                        className={inp}
                      />
                    </div>
                  </div>
                )}

                {activeFormTab === "availability" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={lbl}>Available Days</label>
                      <input
                        type="text"
                        value={form.available_days}
                        onChange={(e) =>
                          setForm({ ...form, available_days: e.target.value })
                        }
                        placeholder="e.g. Mon,Tue,Wed,Thu,Fri,Sat"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Busy Hours</label>
                      <input
                        type="text"
                        value={form.busy_hours}
                        onChange={(e) =>
                          setForm({ ...form, busy_hours: e.target.value })
                        }
                        placeholder="e.g. 12:00 PM - 02:00 PM"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Opening Time</label>
                      <input
                        type="text"
                        value={form.opening_time}
                        onChange={(e) =>
                          setForm({ ...form, opening_time: e.target.value })
                        }
                        placeholder="e.g. 08:00 AM"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Closing Time</label>
                      <input
                        type="text"
                        value={form.closing_time}
                        onChange={(e) =>
                          setForm({ ...form, closing_time: e.target.value })
                        }
                        placeholder="e.g. 10:00 PM"
                        className={inp}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={lbl}>
                        Holiday Schedule / Special Closures
                      </label>
                      <textarea
                        value={form.holiday_schedule}
                        onChange={(e) =>
                          setForm({ ...form, holiday_schedule: e.target.value })
                        }
                        rows="2"
                        placeholder="Holiday Schedule / Special Closures"
                        className={inp}
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-6 pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.instant_order}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              instant_order: e.target.checked,
                            })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Instant Order Available
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.pre_order}
                          onChange={(e) =>
                            setForm({ ...form, pre_order: e.target.checked })
                          }
                          className="rounded bg-[#070b13]/60 border border-white/10 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Pre-order Available
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {activeFormTab === "kyc" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={lbl}>Aadhaar Number</label>
                      <input
                        type="text"
                        value={form.aadhaar_number}
                        onChange={(e) =>
                          setForm({ ...form, aadhaar_number: e.target.value })
                        }
                        placeholder="Aadhaar Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>PAN Number</label>
                      <input
                        type="text"
                        value={form.pan_number}
                        onChange={(e) =>
                          setForm({ ...form, pan_number: e.target.value })
                        }
                        placeholder="PAN Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>FSSAI License Number</label>
                      <input
                        type="text"
                        value={form.fssai_number}
                        onChange={(e) =>
                          setForm({ ...form, fssai_number: e.target.value })
                        }
                        placeholder="FSSAI License Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>GST Number</label>
                      <input
                        type="text"
                        value={form.gst_number}
                        onChange={(e) =>
                          setForm({ ...form, gst_number: e.target.value })
                        }
                        placeholder="GST Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Bank Account Number</label>
                      <input
                        type="text"
                        value={form.bank_account_number}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            bank_account_number: e.target.value,
                          })
                        }
                        placeholder="Bank Account Number"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>IFSC Code</label>
                      <input
                        type="text"
                        value={form.ifsc_code}
                        onChange={(e) =>
                          setForm({ ...form, ifsc_code: e.target.value })
                        }
                        placeholder="IFSC Code"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Account Holder Name</label>
                      <input
                        type="text"
                        value={form.account_holder_name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            account_holder_name: e.target.value,
                          })
                        }
                        placeholder="Account Holder Name"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>UPI ID</label>
                      <input
                        type="text"
                        value={form.upi_id}
                        onChange={(e) =>
                          setForm({ ...form, upi_id: e.target.value })
                        }
                        placeholder="username@okaxis"
                        className={inp}
                      />
                    </div>

                    <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                      <label className="group rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-4 flex items-center justify-between gap-3 cursor-pointer transition hover:border-emerald-400">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.24em] font-black mb-1">
                            OTP Verified
                          </p>
                          <p className="text-sm text-slate-300">
                            Mark if OTP verification is complete.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.otp_verified}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              otp_verified: e.target.checked,
                            })
                          }
                          className="h-5 w-5 rounded border border-white/10 text-emerald-500 bg-slate-950"
                        />
                      </label>
                      <label className="group rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-4 flex items-center justify-between gap-3 cursor-pointer transition hover:border-emerald-400">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.24em] font-black mb-1">
                            Email Verified
                          </p>
                          <p className="text-sm text-slate-300">
                            Mark when the chef has completed email verification.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.email_verified}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              email_verified: e.target.checked,
                            })
                          }
                          className="h-5 w-5 rounded border border-white/10 text-emerald-500 bg-slate-950"
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>KYC Verification Notes</label>
                      <textarea
                        value={form.kyc_verification_notes}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            kyc_verification_notes: e.target.value,
                          })
                        }
                        rows="3"
                        placeholder="Notes on document review, pending issues, or verification comments"
                        className={inp}
                      />
                    </div>
                  </div>
                )}


                 {activeFormTab === "documents" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                    {renderFileField(
                      "aadhaar_front_url",
                      "Aadhaar Front Image",
                      form.aadhaar_front_url,
                    )}
                    {renderFileField(
                      "aadhaar_back_url",
                      "Aadhaar Back Image",
                      form.aadhaar_back_url,
                    )}
                    {renderFileField(
                      "pan_card_url",
                      "PAN Card Image",
                      form.pan_card_url,
                    )}
                    {renderFileField(
                      "fssai_certificate_url",
                      "FSSAI Certificate",
                      form.fssai_certificate_url,
                    )}
                    {renderFileField(
                      "gst_certificate_url",
                      "GST Certificate",
                      form.gst_certificate_url,
                    )}
                    {renderFileField(
                      "signature_url",
                      "Chef Signature Image",
                      form.signature_url,
                    )}
                    {renderFileField(
                      "selfie_verification_url",
                      "Selfie Verification Photo",
                      form.selfie_verification_url,
                    )}
                  </div>
                )}

                {activeFormTab === "account" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                      <label className={lbl}>Username</label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        placeholder="Username"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.mobile}
                        onChange={(e) =>
                          setForm({ ...form, mobile: e.target.value })
                        }
                        placeholder="Mobile Number"
                        className={inp}
                      />
                    </div>
                   
                    <div>
                      <label className={lbl}>Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="Email Address"
                        className={inp}
                      />
                    </div>
                    
                   
                    <div>
                      <label className={lbl}>
                        Password{" "}
                        {editingChef && "(Leave blank to keep current)"}
                      </label>
                      <input
                        type="password"
                        required={!editingChef}
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        placeholder="Password"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Confirm Password</label>
                      <input
                        type="password"
                        required={!editingChef}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm Password"
                        className={inp}
                      />
                    </div>

                     <div>
                      <label className={lbl}>Login Status</label>
                      <select
                        value={form.login_status}
                        onChange={(e) =>
                          setForm({ ...form, login_status: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Verification Status</label>
                      <select
                        value={form.verification_status}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            verification_status: e.target.value,
                          })
                        }
                        className={inp}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Approval Status</label>
                      <select
                        value={form.approval_status}
                        onChange={(e) =>
                          setForm({ ...form, approval_status: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>

                    {form.verification_status === "Rejected" && (
                      <div className="md:col-span-2">
                        <label className={lbl}>Rejection Reason</label>
                        <textarea
                          value={form.rejection_reason}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              rejection_reason: e.target.value,
                            })
                          }
                          rows="2"
                          placeholder="Rejection Reason"
                          className={inp}
                        />
                      </div>
                    )}

                    {(form.approval_status === "Blocked" ||
                      form.login_status === "Blocked") && (
                      <div className="md:col-span-2">
                        <label className={lbl}>Block Reason</label>
                        <textarea
                          value={form.block_reason}
                          onChange={(e) =>
                            setForm({ ...form, block_reason: e.target.value })
                          }
                          rows="2"
                          placeholder="Block Reason"
                          className={inp}
                        />
                      </div>
                    )}

                    
                  </div>
                )}
              </form>

              <div className="p-8 border-t border-white/10 bg-slate-950/95 flex justify-end gap-3 flex-shrink-0 rounded-b-[2.5rem]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 bg-slate-900/80 border border-white/10 text-slate-200 hover:bg-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {saving ? "Saving..." : "Save Chef"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Details View Modal */}
      {isDetailOpen &&
        selectedChef &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsDetailOpen(false)}
            ></div>
            <div className="bg-[#0B1120] border border-white/5 w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-emerald-800 p-8 text-white flex-shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">
                    {selectedChef.name}
                  </h3>
                  <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1">
                    Home Chef Code: {selectedChef.chef_unique_code || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-full text-white/70 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Grid detail categories */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      Father / Husband Name
                    </p>
                    <p className="font-semibold mt-0.5 text-white/90">
                      {selectedChef.father_husband_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      Gender / Age
                    </p>
                    <p className="font-semibold mt-0.5 text-white/90">
                      {selectedChef.gender || "N/A"} (
                      {selectedChef.age || "N/A"} yrs)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      Mobile Number
                    </p>
                    <p className="font-semibold mt-0.5 text-white/90">
                      {selectedChef.mobile}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      Email Address
                    </p>
                    <p className="font-semibold mt-0.5 text-white/90">{selectedChef.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      Pickup Address
                    </p>
                    <p className="font-semibold mt-0.5 text-white/80">
                      {selectedChef.address || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Kitchen Section */}
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                    Kitchen & Specialty Info
                  </h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Kitchen Name
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {selectedChef.kitchen_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Kitchen Type
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {selectedChef.kitchen_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Cuisine Type / Style
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {selectedChef.cuisine_type || "N/A"} (
                        {selectedChef.cooking_style || "N/A"})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Signature Dish
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {selectedChef.signature_dish || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Available Services
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {[
                          selectedChef.seating_available && "Seating",
                          selectedChef.dining_available && "Dining",
                          selectedChef.takeaway_available && "Takeaway",
                          selectedChef.delivery_available && "Delivery",
                        ]
                          .filter(Boolean)
                          .join(", ") || "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Opening / Closing Time
                      </p>
                      <p className="font-semibold mt-0.5 text-white/90">
                        {selectedChef.opening_time || "N/A"} -{" "}
                        {selectedChef.closing_time || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legal & KYC */}
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                    Verification & KYC Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {[
                      { label: "Profile Photo", key: "profile_photo" },
                      { label: "Cover Banner", key: "cover_banner" },
                      { label: "Aadhaar Front", key: "aadhaar_front_url" },
                      { label: "Aadhaar Back", key: "aadhaar_back_url" },
                      { label: "PAN Card", key: "pan_card_url" },
                      {
                        label: "FSSAI Certificate",
                        key: "fssai_certificate_url",
                      },
                      { label: "GST Certificate", key: "gst_certificate_url" },
                      { label: "Chef Signature", key: "signature_url" },
                      { label: "Selfie Image", key: "selfie_verification_url" },
                    ].map((doc) => (
                      <div
                        key={doc.key}
                        className="bg-[#070b13] p-4 rounded-xl border border-white/5 flex items-center justify-between"
                      >
                        <span className="font-bold text-white/60 uppercase">
                          {doc.label}
                        </span>
                        {selectedChef[doc.key] ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/../uploads/homechefs/${selectedChef[doc.key]}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold transition uppercase tracking-wider"
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-white/20 italic">
                            Not Uploaded
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-[#070b13]/40 flex gap-3 flex-shrink-0">
                {selectedChef.status !== "Approved" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedChef.id, "Approved");
                      setIsDetailOpen(false);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                  >
                    Approve Application
                  </button>
                )}
                {selectedChef.status === "Pending" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedChef.id, "Rejected");
                      setIsDetailOpen(false);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                  >
                    Reject Application
                  </button>
                )}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-black text-xs uppercase tracking-widest rounded-2xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default HomeChefManagement;
