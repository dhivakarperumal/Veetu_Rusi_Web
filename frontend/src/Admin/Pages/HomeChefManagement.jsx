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
  EyeOff
} from "lucide-react";
import imageCompression from "browser-image-compression";

const emptyForm = {
  // Personal Information
  chef_unique_code: "",
  first_name: "",
  last_name: "",
  gender: "Male",
  date_of_birth: "",
  mobile: "",
  alt_mobile: "",
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
  country: "India",
  google_map_location: "",

  // Kitchen Information
  kitchen_name: "",
  kitchen_type: "Home Kitchen",
  veg_nonveg: "Veg",
  experience_years: "",
  cuisine_type: [],
  daily_order_capacity: "",

  // Food Availability
  available_days: [],
  available_slots: [],

  // Business Details
  fssai_available: "No",
  gst_available: "No",
  aadhaar_number: "",
  pan_number: "",
  bank_account_number: "",
  ifsc_code: "",
  account_holder_name: "",
  bank_branch: "",
  upi_id: "",
  passbook_image: null,

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
  { id: "verification", label: "Proof Verification" },
  { id: "delivery", label: "Delivery Preferences" },
];

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const base64FromFile = async (file) => {
  if (!file) return null;
  if (file.type.startsWith("image/")) {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      return readFileAsDataURL(compressed);
    } catch (error) {
      return readFileAsDataURL(file);
    }
  }
  return readFileAsDataURL(file);
};

const convertFileFieldsToBase64 = async (payload) => {
  const result = { ...payload };
  for (const key of Object.keys(payload)) {
    const value = payload[key];
    if (value instanceof FileList) {
      const files = Array.from(value);
      if (files.length === 0) {
        delete result[key];
        continue;
      }
      const convertedFiles = await Promise.all(files.map(base64FromFile));
      result[key] = convertedFiles.length === 1 ? convertedFiles[0] : convertedFiles;
    }
  }
  return result;
};

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

  // Show/Hide Password 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Add / Edit Popup Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChef, setEditingChef] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const stepIds = tabs.map((t) => t.id);
  const currentFormStepIndex = stepIds.indexOf(activeFormTab);
  const goToNextFormTab = () => {
    const nextIndex = Math.min(currentFormStepIndex + 1, stepIds.length - 1);
    setActiveFormTab(stepIds[nextIndex]);
  };
  const goToPreviousFormTab = () => {
    const prevIndex = Math.max(currentFormStepIndex - 1, 0);
    setActiveFormTab(stepIds[prevIndex]);
  };
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/homechefs");
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

  const appendFormDataValue = (formData, key, value) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (value instanceof FileList) {
      Array.from(value).forEach((file) => formData.append(key, file));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File) {
          formData.append(key, item);
        } else {
          formData.append(key, item);
        }
      });
      return;
    }
    formData.append(key, value);
  };

  const createFormDataPayload = (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      appendFormDataValue(formData, key, value);
    });
    return formData;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/homechefs/status/${id}`, {
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
      city: "Chennai",
      district: "Chennai",
      state: "Tamil Nadu",
      pincode: "600042",
      country: "India",
      google_map_location: "https://maps.google.com/?q=13.0827,80.2707",
      kitchen_name: "Priya's Home Kitchen",
      kitchen_address: "22B, Maple Avenue, Shanti Nagar, Chennai",
      kitchen_type: "Home Kitchen",
      experience_years: "10",
      cuisine_type: ["South Indian"],
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
      aadhaar_number: "123456789012",
      pan_number: "ABCDE1234F",
      bank_account_number: "123456789012",
      ifsc_code: "SBIN0001234",
      account_holder_name: "Priya Rao",
      bank_branch: "Anna Nagar Branch",
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
      await api.delete(`/admin/homechefs/${id}`);
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
      first_name: chef.first_name || (chef.name ? chef.name.split(" ").slice(0, 1).join(" ") : ""),
      last_name: chef.last_name || (chef.name ? chef.name.split(" ").slice(1).join(" ") : ""),
      gender: chef.gender || "Male",
      date_of_birth: chef.date_of_birth
        ? chef.date_of_birth.substring(0, 10)
        : "",
      profile_photo: chef.profile_photo || null,
      mobile: chef.mobile || "",
      alt_mobile: chef.alt_mobile || "",
      email: chef.email || "",
      house_number: chef.door_number || "",
      street: chef.street_name || "",
      area: chef.area_name || "",
      city: chef.city || "",
      district: chef.district || "",
      state: chef.state || "",
      pincode: chef.pincode || "",
      country: chef.country || "India",
      google_map_location: chef.map_link || "",
      kitchen_name: chef.kitchen_name || "",
      kitchen_address: chef.kitchen_address || "",
      kitchen_type: chef.kitchen_type || "Home Kitchen",
      kitchen_photos: chef.kitchen_photos || null,
      kitchen_videos: chef.kitchen_videos || null,
      specialty_food: chef.specialty_food || "",
      cuisine_type: chef.cuisine_type ? (Array.isArray(chef.cuisine_type) ? chef.cuisine_type : chef.cuisine_type.split(",").map((item) => item.trim())) : [],
      veg_nonveg: chef.veg_nonveg || "Veg",
      experience_years: chef.experience_years || "",
      cooking_style: chef.cooking_style || "",
      // Creator profile fields
      about_me: chef.about_me || "",
      cooking_story: chef.cooking_story || "",
      why_choose_me: chef.why_choose_me || "",
      languages_known: chef.languages_known || "",
     
      daily_order_capacity: chef.daily_order_capacity || "",
      available_days: chef.available_days
        ? chef.available_days.split(",").map((item) => item.trim())
        : [],
      available_slots: chef.available_slots || [],
    
     
      aadhaar_number: chef.aadhaar_number || "",
      pan_number: chef.pan_number || "",
      fssai_number: chef.fssai_number || "",
      gst_number: chef.gst_number || "",
      bank_account_number: chef.bank_account_number || "",
      ifsc_code: chef.ifsc_code || "",
      account_holder_name: chef.account_holder_name || "",
      bank_branch: chef.bank_branch || "",
      upi_id: chef.upi_id || "",
      passbook_image: chef.passbook_image || null,
      aadhaar_front_url: chef.aadhaar_front_url || null,
      aadhaar_back_url: chef.aadhaar_back_url || null,
      pan_card_url: chef.pan_card_url || null,
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
        available_slots: Array.isArray(form.available_slots)
          ? form.available_slots.join(",")
          : form.available_slots,
        cuisine_type: Array.isArray(form.cuisine_type)
          ? form.cuisine_type.join(",")
          : form.cuisine_type,
        preorder_available: form.preorder_available ? "1" : "0",
      };

      // DEBUG: preview which fields will be sent (remove in production)
      try {
        const preview = Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== undefined));
        console.debug('HomeChef update payload preview:', preview);
      } catch (err) {
        console.debug('Unable to build payload preview', err);
      }

      delete payload.house_number;
      delete payload.street;
      delete payload.area;
      delete payload.google_map_location;
      delete payload.confirmPassword;
      delete payload.chef_unique_code; // Not a database field

      if (editingChef && !payload.password) {
        delete payload.password;
      }

      // Remove fields that don't exist in the database
      delete payload.created_by_id;
      delete payload.created_by_user_id;
      delete payload.created_by_name;
      delete payload.created_by_email;
      delete payload.created_by_phone;

      const convertedPayload = createFormDataPayload(payload);

      if (editingChef) {
        await api.put(`/admin/homechefs/${editingChef.id}`, convertedPayload);
        toast.success("Home chef updated successfully.");
      } else {
        await api.post("/admin/homechefs", convertedPayload);
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

  const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");
  const isImageDataUrl = (value) => typeof value === "string" && value.startsWith("data:image/");
  const isVideoDataUrl = (value) => typeof value === "string" && value.startsWith("data:video/");
  const isImageField = (fieldName) => fieldName !== "introduction_video";
  const getPreviewUrl = (value) => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      return URL.createObjectURL(value[0]);
    }
    if (typeof value !== "string") return null;
    if (isDataUrl(value)) return value;
    if (value.startsWith("http") || value.startsWith("blob:")) return value;
    return `${import.meta.env.VITE_API_URL}/../uploads/homechefs/${value}`;
  };

  const renderFileField = (fieldName, label, currentValue) => {
    const previewUrl = getPreviewUrl(currentValue);
    const showImagePreview = previewUrl && isImageField(fieldName);
    const showVideoPreview = previewUrl && (fieldName === "introduction_video" || isVideoDataUrl(previewUrl));

    return (
      <div>
        <label className={lbl}>{label}</label>
        <input
          type="file"
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const value =
              fieldName === "kitchen_photos" || fieldName === "kitchen_videos"
                ? Array.from(files)
                : files[0];
            setForm((prev) => ({ ...prev, [fieldName]: value }));
          }}
          className={inp}
          multiple={
            fieldName === "kitchen_photos" || fieldName === "kitchen_videos"
          }
        />

        {(currentValue instanceof FileList || Array.isArray(currentValue)) && currentValue.length > 0 && (
          <p className="mt-1 text-xs text-slate-300">
            Selected file: {currentValue.length > 1 ? `${currentValue.length} files` : currentValue[0].name}
          </p>
        )}
        {currentValue instanceof File && (
          <p className="mt-1 text-xs text-slate-300">Selected file: {currentValue.name}</p>
        )}

        {showImagePreview && (
          <img
            src={previewUrl}
            alt={label}
            className="mt-3 max-h-40 w-full object-contain rounded-xl border border-white/10"
          />
        )}

        {showVideoPreview && (
          <video
            controls
            className="mt-3 w-full max-h-56 rounded-xl border border-white/10 bg-slate-950"
            src={previewUrl}
          />
        )}

        {currentValue && typeof currentValue === "string" && !isDataUrl(currentValue) && (
          <div className="mt-2 text-xs">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              View Uploaded File
            </a>
          </div>
        )}

        {currentValue && typeof currentValue === "string" && isDataUrl(currentValue) && !isImageDataUrl(currentValue) && !isVideoDataUrl(currentValue) && (
          <p className="mt-1 text-xs text-emerald-400">
            Stored as Base64 Data URL
          </p>
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
            <div className="border border-white/10 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden grid lg:grid-cols-[320px_1fr] max-h-[95vh] h-full bg-slate-950">
              <div className="hidden lg:flex flex-col gap-6 p-6 bg-slate-950 border-r border-white/10 overflow-y-auto min-h-0 h-full">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Home Chef Onboarding
                  </p>
                  <h3 className="mt-4 text-3xl font-black text-white">
                    Advanced Registration
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Eight guided steps to capture chef, kitchen, and verification data.
                  </p>
                </div>
                <div className="space-y-3">
                  {tabs.map((step, index) => {
                    const completed = index < currentFormStepIndex;
                    const isActive = step.id === activeFormTab;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveFormTab(step.id)}
                        className={`w-full text-left rounded-3xl border px-4 py-4 transition ${isActive
                          ? "bg-emerald-700 text-white border-emerald-600 shadow-xl"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900/95"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive
                              ? "bg-white text-emerald-700"
                              : completed
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 text-slate-400"
                              }`}
                          >
                            {completed ? "✓" : index + 1}
                          </span>
                          <span className="text-xs uppercase tracking-[0.25em]">
                            Step {index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-5 font-bold tracking-tight text-slate-200">
                          {step.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-auto rounded-3xl border border-white/10 bg-slate-900/90 p-5 text-sm text-slate-400">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Progress
                  </p>
                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${((currentFormStepIndex + 1) / tabs.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-4 text-slate-300">
                    Finish each section for the fastest approval flow.
                  </p>
                </div>
              </div>

              <div className="flex flex-col overflow-hidden bg-slate-950 min-h-0 h-full">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                      Step {currentFormStepIndex + 1} of {tabs.length}
                    </p>
                    <h4 className="mt-3 text-2xl font-black tracking-tight text-white">
                      {tabs[currentFormStepIndex]?.label}
                    </h4>
                    <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                      {tabs[currentFormStepIndex]?.description ||
                        "Fill in the required details to continue."}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="lg:hidden border-b border-white/10 bg-slate-950/95 p-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
                  <div className="flex gap-2">
                    {tabs.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveFormTab(t.id)}
                        className={`flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition ${activeFormTab === t.id
                          ? "bg-emerald-500 text-slate-950 shadow-[0_15px_40px_rgba(16,185,129,0.18)]"
                          : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col flex-1 overflow-hidden bg-slate-950 min-h-0 h-full"
                >
                  <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6">
                    {activeFormTab === "personal" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                          <label className={lbl}>First Name *</label>
                          <input
                            type="text"
                            value={form.first_name}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                first_name: e.target.value,
                              })
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

                        {renderFileField("profile_photo", "Profile Photo", form.profile_photo)}

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
                          <label className={lbl}>Alternate Number</label>
                          <input
                            type="tel"
                            value={form.alt_mobile}
                            onChange={(e) =>
                              setForm({ ...form, alt_mobile: e.target.value })
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

                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={form.password}
                              onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                              }
                              className={`${inp} pr-12`}
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={lbl}>Confirm Password *</label>

                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={form.confirmPassword}
                              onChange={(e) =>
                                setForm({ ...form, confirmPassword: e.target.value })
                              }
                              className={`${inp} pr-12`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

  
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
                          <select
                            value={form.state}
                            onChange={(e) =>
                              setForm({ ...form, state: e.target.value })
                            }
                            className={inp}
                          >
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                          </select>
                        </div>

                        <div>
                          <label className={lbl}>Country *</label>
                          <select
                            value={form.country}
                            onChange={(e) =>
                              setForm({ ...form, country: e.target.value })
                            }
                            className={inp}
                          >
                            <option value="">Select Country</option>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Canada">Canada</option>
                          </select>
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
                          <label className={lbl}>Select Veg or Non-Veg *</label>
                          <select
                            value={form.veg_nonveg}
                            onChange={(e) =>
                              setForm({ ...form, veg_nonveg: e.target.value })
                            }
                            className={inp}
                          >
                            <option value="Veg">Veg</option>
                            <option value="Non-Veg">Non-Veg</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className={`${lbl} mb-3 block`}>Speciality Cuisine *</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              "South Indian",
                              "North Indian",
                              "Chinese",
                              "Andhra",
                              "Kerala",
                              "Healthy Foods",
                              "Millet Foods",
                              "Desserts",
                              "Others",
                            ].map((cuisine) => (
                              <label key={cuisine} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={form.cuisine_type.includes(cuisine)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setForm({
                                        ...form,
                                        cuisine_type: [...form.cuisine_type, cuisine],
                                      });
                                    } else {
                                      setForm({
                                        ...form,
                                        cuisine_type: form.cuisine_type.filter(
                                          (c) => c !== cuisine
                                        ),
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-sm text-white">{cuisine}</span>
                              </label>
                            ))}
                          </div>
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

                        <div className="md:col-span-2">
                          <label className={`${lbl} mb-3 block`}>Kitchen Photos *</label>
                          <div className="grid grid-cols-1 gap-4">
                            {renderFileField(
                              "kitchen_photos",
                              "Upload Kitchen Photos",
                              form.kitchen_photos
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className={`${lbl} mb-3 block`}>Kitchen Videos *</label>
                          <div className="grid grid-cols-1 gap-4">
                            {renderFileField(
                              "kitchen_videos",
                              "Upload Kitchen Videos",
                              form.kitchen_videos
                            )}
                          </div>
                        </div>

                        <div>
                          {renderFileField(
                            "cooking_area_photo",
                            "Cooking Area Photo *",
                            form.cooking_area_photo
                          )}
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

                                <span className="text-slate-200 font-medium">
                                  {day}
                                </span>
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

                                <span className="text-slate-200 font-medium">
                                  {slot}
                                </span>
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
                          <label className={lbl}>Account Holder Name *</label>
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
                          <label className={lbl}>Bank Branch *</label>
                          <input
                            type="text"
                            value={form.bank_branch}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                bank_branch: e.target.value,
                              })
                            }
                            placeholder="Bank Branch"
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

                        <div>
                          {renderFileField(
                            "passbook_image",
                            "Passbook Image *",
                            form.passbook_image
                          )}
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
                            className="w-full px-4 py-3 rounded-[1.75rem] bg-slate-950/85 border border-white/10 text-slate-100 outline-none placeholder:text-slate-500 text-sm font-medium resize-none transition focus:border-emerald-400 focus:bg-slate-900"
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
                            className="w-full px-4 py-3 rounded-[1.75rem] bg-slate-950/85 border border-white/10 text-slate-100 outline-none placeholder:text-slate-500 text-sm font-medium resize-none transition focus:border-emerald-400 focus:bg-slate-900"
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
                            className="w-full px-4 py-3 rounded-[1.75rem] bg-slate-950/85 border border-white/10 text-slate-100 outline-none placeholder:text-slate-500 text-sm font-medium resize-none transition focus:border-emerald-400 focus:bg-slate-900"
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
                  </div>
                  <div className="p-8 border-t border-white/10 bg-slate-950/95 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0 rounded-b-[2.5rem]">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={currentFormStepIndex === 0}
                        onClick={goToPreviousFormTab}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800"
                      >
                        Previous
                      </button>
                      {currentFormStepIndex < tabs.length - 1 ? (
                        <button
                          type="button"
                          onClick={goToNextFormTab}
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500"
                        >
                          Next Step
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="rounded-2xl bg-slate-900/80 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition hover:bg-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        {saving
                          ? "Saving..."
                          : editingChef
                            ? "Update Chef"
                            : "Save Chef"}
                      </button>
                    </div>
                  </div>
                </form>
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
