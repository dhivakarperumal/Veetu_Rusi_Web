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
  // Personal Information
  chef_unique_code: "",
  first_name: "",
  last_name: "",
  gender: "Male",
  date_of_birth: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  profile_photo: null,

  // Address Information
  house_number: "",
  street: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  gps_location: "",
  google_map_location: "",

  // Kitchen Information
  kitchen_name: "",
  kitchen_type: "Home Kitchen",
  experience_years: "",
  cuisine_type: "",
  daily_order_capacity: "",

  // Food Availability
  available_days: [],
  available_slots: [],

  // Business Details
  fssai_available: "No",
  gst_available: "No",
  pan_number: "",
  bank_account_number: "",
  ifsc_code: "",
  upi_id: "",

  // Social Media
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  website_url: "",

  // Creator Profile
  about_me: "",
  cooking_story: "",
  why_choose_me: "",
  languages_known: "",
  introduction_video: null,

  // Kitchen Verification
  aadhaar_front_url: null,
  aadhaar_back_url: null,
  pan_card_url: null,

  kitchen_photo1: null,
  kitchen_photo2: null,
  kitchen_photo3: null,

  cooking_area_photo: null,
  storage_area_photo: null,

  selfie_verification_url: null,

  // Delivery Preferences
  delivery_radius: "5 KM",
  preorder_available: false,
  cutoff_time: "",
};

const tabs = [
  { id: "personal", label: "Personal Information" },
  { id: "address", label: "Address Information" },
  { id: "kitchen", label: "Kitchen Information" },
  { id: "availability", label: "Food Availability" },
  { id: "business", label: "Business Details" },
  { id: "social", label: "Social Media" },
  { id: "creator", label: "Creator Profile" },
  { id: "verification", label: "Kitchen Verification" },
  { id: "delivery", label: "Delivery Preferences" },
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
  const [activeFormTab, setActiveFormTab] = useState("personal");
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

  const fillSampleChefData = () => {
    setForm({
      chef_unique_code: "CHEF-TEST-001",
      first_name: "Priya",
      last_name: "Rao",
      name: "Priya Rao",
      gender: "Female",
      date_of_birth: "1992-08-15",
      age: "31",
      mobile: "9876543210",
      alt_mobile: "9123456780",
      whatsapp_number: "9876543210",
      email: "priya.rao@example.com",
      password: "Test@1234",
      confirmPassword: "Test@1234",
      profile_photo: null,
      cover_banner: null,
      house_number: "22B",
      street: "Maple Avenue",
      area: "Shanti Nagar",
      landmark: "Near Lotus Park",
      city: "Chennai",
      district: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      gps_location: "13.0827, 80.2707",
      google_map_location: "https://maps.google.com/?q=13.0827,80.2707",
      kitchen_name: "Priya's Home Kitchen",
      kitchen_address: "22B, Maple Avenue, Shanti Nagar, Chennai",
      kitchen_type: "Home Kitchen",
      experience_years: "10",
      cuisine_type: "South Indian",
      daily_order_capacity: "40",
      available_days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      available_slots: [
        "Breakfast",
        "Lunch",
        "Dinner",
        "Evening Snacks",
      ],
      fssai_available: "Yes",
      gst_available: "Yes",
      pan_number: "ABCDE1234F",
      bank_account_number: "123456789012",
      ifsc_code: "SBIN0001234",
      upi_id: "priya@okaxis",
      instagram_url: "https://instagram.com/priya_chef",
      facebook_url: "https://facebook.com/priyahomechef",
      youtube_url: "https://youtube.com/@priyafood",
      website_url: "https://priyahomekitchen.example.com",
      about_me:
        "I am a passionate home chef specializing in authentic South Indian meals.",
      cooking_story:
        "Cooking for family and friends inspired me to share home-cooked flavors with the neighborhood.",
      why_choose_me:
        "Fresh ingredients, traditional recipes, and fast delivery make every meal special.",
      languages_known: "Tamil, English, Hindi",
      introduction_video: null,
      aadhaar_front_url: null,
      aadhaar_back_url: null,
      pan_card_url: null,
      kitchen_photo1: null,
      kitchen_photo2: null,
      kitchen_photo3: null,
      cooking_area_photo: null,
      storage_area_photo: null,
      selfie_verification_url: null,
      delivery_radius: "5 KM",
      preorder_available: true,
      cutoff_time: "Order before 9 PM for next-day delivery",
    });
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
    setActiveFormTab("personal");
    setIsFormOpen(true);
  };

  const openEditModal = (chef) => {
    setEditingChef(chef);
    setActiveFormTab("personal");
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
      house_number: chef.door_number || "",
      street: chef.street_name || "",
      area: chef.area_name || "",
      landmark: chef.landmark || "",
      city: chef.city || "",
      district: chef.district || "",
      state: chef.state || "",
      pincode: chef.pincode || "",
      gps_location:
        chef.latitude && chef.longitude
          ? `${chef.latitude}, ${chef.longitude}`
          : "",
      google_map_location: chef.map_link || "",
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
      available_days: chef.available_days
        ? chef.available_days.split(",").map((item) => item.trim())
        : [],
      available_slots: chef.available_slots || [],
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
      const fileFieldMap = {
        introduction_video: "kitchen_videos",
        kitchen_photo1: "kitchen_photos",
        kitchen_photo2: "kitchen_photos",
        kitchen_photo3: "kitchen_photos",
        cooking_area_photo: "kitchen_photos",
        storage_area_photo: "kitchen_photos",
      };

      const payload = {
        ...form,
        name:
          form.name ||
          [form.first_name, form.last_name].filter(Boolean).join(" "),
        door_number: form.house_number,
        street_name: form.street,
        area_name: form.area,
        map_link: form.google_map_location,
        available_days: Array.isArray(form.available_days)
          ? form.available_days.join(",")
          : form.available_days,
      };

      if (form.gps_location) {
        const [lat, lng] = form.gps_location
          .split(",")
          .map((part) => part.trim());
        if (lat && lng) {
          payload.latitude = lat;
          payload.longitude = lng;
        }
      }

      delete payload.house_number;
      delete payload.street;
      delete payload.area;
      delete payload.google_map_location;
      delete payload.gps_location;

      if (user && !editingChef) {
        formData.append("created_by_id", user.id || "");
        formData.append("created_by_user_id", user.user_id || "");
        formData.append("created_by_name", user.name || "");
        formData.append("created_by_email", user.email || "");
        formData.append("created_by_phone", user.phone || "");
      }

      Object.keys(payload).forEach((key) => {
        if (key === "confirmPassword") return;
        const mappedKey = fileFieldMap[key] || key;
        const val = payload[key];

        if (fileFieldMap[key]) {
          if (val instanceof FileList && val.length > 0) {
            for (let i = 0; i < val.length; i++) {
              formData.append(mappedKey, val[i]);
            }
          }
          return;
        }

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
              className={`p-2 rounded-lg transition ${viewMode === "table"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-700"
                }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${viewMode === "card"
                ? "bg-white text-emerald-700 shadow-sm"
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
                        className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${chef.status === "Approved"
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
                    className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${chef.status === "Approved"
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
                    Complete the 9-tab verification and setup details
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
              <div className="border-b border-gray-100 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-20">
                <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveFormTab(t.id)}
                      className={`flex-shrink-0 mx-1 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition focus:outline-none focus:ring-0 ${activeFormTab === t.id
                        ? "bg-emerald-800 text-white shadow-inner"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={fillSampleChefData}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition"
                >
                  Fill Sample Chef Data
                </button>
              </div>

              {/* Form Fields container */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/95 text-slate-100"
              >
                {activeFormTab === "personal" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>Chef Unique ID *</label>
                      <input
                        type="text"
                        value={form.chef_unique_code}
                        onChange={(e) =>
                          setForm({ ...form, chef_unique_code: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>First Name *</label>
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Last Name *</label>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Gender *</label>
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
                      <label className={lbl}>Date Of Birth *</label>
                      <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={(e) =>
                          setForm({ ...form, date_of_birth: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Mobile Number *</label>
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) =>
                          setForm({ ...form, mobile: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Password *</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Confirm Password *</label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        className={inp}
                      />
                    </div>

                    {renderFileField(
                      "profile_photo",
                      "Profile Photo *",
                      form.profile_photo
                    )}

                  </div>
                )}

                {activeFormTab === "address" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>House Number *</label>
                      <input
                        type="text"
                        value={form.house_number}
                        onChange={(e) =>
                          setForm({ ...form, house_number: e.target.value })
                        }
                        placeholder="House Number"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Street *</label>
                      <input
                        type="text"
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        placeholder="Street"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Area *</label>
                      <input
                        type="text"
                        value={form.area}
                        onChange={(e) =>
                          setForm({ ...form, area: e.target.value })
                        }
                        placeholder="Area"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>City *</label>
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
                      <label className={lbl}>State *</label>
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
                      <label className={lbl}>Pincode *</label>
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
                      <label className={lbl}>Current GPS Location *</label>
                      <input
                        type="text"
                        value={form.gps_location}
                        onChange={(e) =>
                          setForm({ ...form, gps_location: e.target.value })
                        }
                        placeholder="Latitude, Longitude"
                        className={inp}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>Google Map Location *</label>
                      <input
                        type="url"
                        value={form.google_map_location}
                        onChange={(e) =>
                          setForm({ ...form, google_map_location: e.target.value })
                        }
                        placeholder="https://maps.google.com/..."
                        className={inp}
                      />
                    </div>

                  </div>
                )}

                {activeFormTab === "kitchen" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>Kitchen Name *</label>
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
                      <label className={lbl}>Kitchen Type *</label>
                      <select
                        value={form.kitchen_type}
                        onChange={(e) =>
                          setForm({ ...form, kitchen_type: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="Home Kitchen">Home Kitchen</option>
                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                        <option value="Traditional Kitchen">Traditional Kitchen</option>
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>Years Of Experience *</label>
                      <input
                        type="number"
                        value={form.experience_years}
                        onChange={(e) =>
                          setForm({ ...form, experience_years: e.target.value })
                        }
                        placeholder="Years Of Experience"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Speciality Cuisine *</label>
                      <select
                        value={form.cuisine_type}
                        onChange={(e) =>
                          setForm({ ...form, cuisine_type: e.target.value })
                        }
                        className={inp}
                      >
                        <option value="">Select Cuisine</option>
                        <option value="South Indian">South Indian</option>
                        <option value="North Indian">North Indian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Andhra">Andhra</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Healthy Foods">Healthy Foods</option>
                        <option value="Millet Foods">Millet Foods</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>Maximum Orders Per Day *</label>
                      <input
                        type="number"
                        value={form.daily_order_capacity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            daily_order_capacity: e.target.value,
                          })
                        }
                        placeholder="Maximum Orders Per Day"
                        className={inp}
                      />
                    </div>

                  </div>
                )}

                {activeFormTab === "availability" && (
                  <div className="space-y-8">

                    {/* Available Days */}
                    <div>
                      <label className={`${lbl} mb-3 block`}>
                        Available Days
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((day) => (
                          <label
                            key={day}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.available_days.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({
                                    ...form,
                                    available_days: [...form.available_days, day],
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    available_days: form.available_days.filter(
                                      (d) => d !== day
                                    ),
                                  });
                                }
                              }}
                            />

                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Available Time Slots */}
                    <div>
                      <label className={`${lbl} mb-3 block`}>
                        Available Time Slots
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        {[
                          "Breakfast",
                          "Lunch",
                          "Dinner",
                          "Evening Snacks",
                        ].map((slot) => (
                          <label
                            key={slot}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.available_slots.includes(slot)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({
                                    ...form,
                                    available_slots: [
                                      ...form.available_slots,
                                      slot,
                                    ],
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    available_slots:
                                      form.available_slots.filter(
                                        (s) => s !== slot
                                      ),
                                  });
                                }
                              }}
                            />

                            <span>{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {activeFormTab === "business" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>FSSAI Available ?</label>
                      <select
                        value={form.fssai_available}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            fssai_available: e.target.value,
                          })
                        }
                        className={inp}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>GST Available ?</label>
                      <select
                        value={form.gst_available}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            gst_available: e.target.value,
                          })
                        }
                        className={inp}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>PAN Number *</label>
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
                      <label className={lbl}>Bank Account Number *</label>
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
                      <label className={lbl}>IFSC Code *</label>
                      <input
                        type="text"
                        value={form.ifsc_code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ifsc_code: e.target.value,
                          })
                        }
                        placeholder="IFSC Code"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>UPI ID *</label>
                      <input
                        type="text"
                        value={form.upi_id}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            upi_id: e.target.value,
                          })
                        }
                        placeholder="username@upi"
                        className={inp}
                      />
                    </div>

                  </div>
                )}

                {activeFormTab === "social" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>Instagram URL</label>
                      <input
                        type="url"
                        value={form.instagram_url}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            instagram_url: e.target.value,
                          })
                        }
                        placeholder="https://instagram.com/username"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Facebook URL</label>
                      <input
                        type="url"
                        value={form.facebook_url}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            facebook_url: e.target.value,
                          })
                        }
                        placeholder="https://facebook.com/page"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>YouTube Channel URL</label>
                      <input
                        type="url"
                        value={form.youtube_url}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            youtube_url: e.target.value,
                          })
                        }
                        placeholder="https://youtube.com/@channel"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Website URL</label>
                      <input
                        type="url"
                        value={form.website_url}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            website_url: e.target.value,
                          })
                        }
                        placeholder="https://yourwebsite.com"
                        className={inp}
                      />
                    </div>

                  </div>
                )}

                {activeFormTab === "creator" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="md:col-span-2">
                      <label className={lbl}>About Me *</label>
                      <textarea
                        rows="4"
                        value={form.about_me}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            about_me: e.target.value,
                          })
                        }
                        placeholder="Tell customers about yourself..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>Cooking Story *</label>
                      <textarea
                        rows="4"
                        value={form.cooking_story}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cooking_story: e.target.value,
                          })
                        }
                        placeholder="Share your cooking journey..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>
                        Why Customers Should Order From Me *
                      </label>
                      <textarea
                        rows="4"
                        value={form.why_choose_me}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            why_choose_me: e.target.value,
                          })
                        }
                        placeholder="Tell customers why they should choose you..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className={lbl}>Languages Known *</label>
                      <input
                        type="text"
                        value={form.languages_known}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            languages_known: e.target.value,
                          })
                        }
                        placeholder="Tamil, English, Telugu..."
                        className={inp}
                      />
                    </div>

                    <div>
                      {renderFileField(
                        "introduction_video",
                        "Upload Introduction Video *",
                        form.introduction_video
                      )}
                    </div>

                  </div>
                )}

                {activeFormTab === "verification" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {renderFileField(
                      "aadhaar_front_url",
                      "Aadhaar Front *",
                      form.aadhaar_front_url
                    )}

                    {renderFileField(
                      "aadhaar_back_url",
                      "Aadhaar Back *",
                      form.aadhaar_back_url
                    )}

                    {renderFileField(
                      "pan_card_url",
                      "PAN Card *",
                      form.pan_card_url
                    )}

                    {renderFileField(
                      "kitchen_photo1",
                      "Kitchen Photo 1 *",
                      form.kitchen_photo1
                    )}

                    {renderFileField(
                      "kitchen_photo2",
                      "Kitchen Photo 2 *",
                      form.kitchen_photo2
                    )}

                    {renderFileField(
                      "kitchen_photo3",
                      "Kitchen Photo 3 *",
                      form.kitchen_photo3
                    )}

                    {renderFileField(
                      "cooking_area_photo",
                      "Cooking Area Photo *",
                      form.cooking_area_photo
                    )}

                    {renderFileField(
                      "storage_area_photo",
                      "Storage Area Photo *",
                      form.storage_area_photo
                    )}

                    {renderFileField(
                      "selfie_verification_url",
                      "Selfie With Aadhaar *",
                      form.selfie_verification_url
                    )}

                  </div>
                )}

                {activeFormTab === "delivery" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                      <label className={lbl}>Maximum Delivery Radius *</label>

                      <select
                        value={form.delivery_radius}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            delivery_radius: e.target.value,
                          })
                        }
                        className={inp}
                      >
                        <option value="2 KM">2 KM</option>
                        <option value="3 KM">3 KM</option>
                        <option value="5 KM">5 KM</option>
                      </select>

                      <p className="text-xs text-gray-500 mt-2">
                        Default: 5 KM
                      </p>
                    </div>

                    <div>
                      <label className={lbl}>Preorder Available ?</label>

                      <select
                        value={form.preorder_available ? "Yes" : "No"}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            preorder_available: e.target.value === "Yes",
                          })
                        }
                        className={inp}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className={lbl}>Cut-Off Time *</label>

                      <input
                        type="text"
                        value={form.cutoff_time}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cutoff_time: e.target.value,
                          })
                        }
                        placeholder="Example: Order before 9 PM, Delivery tomorrow"
                        className={inp}
                      />
                    </div>

                  </div>
                )}
              <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-3 flex-shrink-0 rounded-b-[2.5rem]">
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
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {saving ? "Saving..." : "Save Chef"}
                </button>
              </div>
            </form>
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
