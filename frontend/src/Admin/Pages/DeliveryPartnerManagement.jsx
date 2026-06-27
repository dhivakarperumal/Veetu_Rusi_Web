import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  EyeOff,
  Bike,
  List,
  LayoutGrid,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
} from "lucide-react";
import imageCompression from "browser-image-compression";

const tabs = [
  { id: "personal", label: "Personal Information" },
  { id: "address", label: "Address" },
  { id: "emergency", label: "Emergency Contact" },
  { id: "vehicle", label: "Vehicle Information" },
  { id: "driving", label: "Driving Information" },
  { id: "bank", label: "Bank Information" },
  { id: "documents", label: "Document Upload" },
  { id: "preferences", label: "Work Preferences" },
  // verification tab removed
];

const indiaStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const vehicleBrands = [
  "Honda",
  "Yamaha",
  "Bajaj",
  "Hero",
  "TVS",
  "Suzuki",
  "Royal Enfield",
  "KTM",
  "Kawasaki",
  "Harley-Davidson",
  "Piaggio",
  "Ather",
  "Okinawa",
  "Pure EV",
  "Revolt",
];

const vehicleColors = [
  "Black",
  "White",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Maroon",
  "Brown",
  "Gold",
  "Purple",
  "Beige",
];

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null || value === '') return;
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }
  if (value instanceof FileList) {
    Array.from(value).forEach((file) => {
      formData.append(key, file);
    });
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
  Object.entries(payload).forEach(([key, value]) => appendFormDataValue(formData, key, value));
  return formData;
};

const emptyForm = {
  // Personal
  delivery_partner_code: "",
  first_name: "",
  last_name: "",
  name: "",
  gender: "Male",
  date_of_birth: "",
  blood_group: "",
  mobile: "",
  alt_mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  profile_photo: null,
  cover_photo: null,
  age: "",
  
  // Address
  current_address: "",
  permanent_address: "",
  city: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  live_location: "",
  // Emergency
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_mobile: "",
  // Vehicle
  vehicle_type: "Bike",
  vehicle_brand: "",
  vehicle_model: "",
  vehicle_number: "",
  vehicle_color: "",
  vehicle_front_photo: null,
  vehicle_back_photo: null,
  police_verification_certificate: null,
  // Driving
  license_number: "",
  license_holder_name: "",
  license_issue_date: "",
  license_expiry_date: "",
  // Bank
  account_holder_name: "",
  bank_name: "",
  bank_account_number: "",
  ifsc_code: "",
  branch_name: "",
  upi_id: "",
  // Documents
  aadhaar_number: "",
  pan_number: "",
  aadhaar_front_url: null,
  aadhaar_back_url: null,
  pan_card_url: null,
  license_front_image: null,
  license_back_image: null,
  rc_book_image: null,
  insurance_document_image: null,
  selfie_with_vehicle: null,
  selfie_with_aadhaar: null,
  selfie_verification_url: null,
  rc_book_number: "",
  insurance_number: "",
  insurance_expiry_date: "",
  // Preferences
  available_areas: "",
  available_time_morning: false,
  available_time_afternoon: false,
  available_time_evening: false,
  available_time_night: false,
  preferred_distance: "3 KM",
  delivery_radius: "",
  driving_experience: "",
  status: "Pending",
};

const DeliveryPartnerManagement = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const lbl = "block text-sm font-semibold text-slate-300 mb-2";
  const inp = "w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  const stepIds = tabs.map((t) => t.id);
  const currentStepIndex = stepIds.indexOf(activeTab);
  const goToNextStep = () => {
    const nextIndex = Math.min(currentStepIndex + 1, stepIds.length - 1);
    setActiveTab(stepIds[nextIndex]);
  };
  const goToPreviousStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setActiveTab(stepIds[prevIndex]);
  };

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/delivery-partners");
      setPartners(res.data);
    } catch {
      toast.error("Failed to load delivery partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPartners = async () => {
      await fetchPartners();
    };
    void loadPartners();
  }, []);

  const filteredPartners = useMemo(() => {
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
    return result;
  }, [search, statusFilter, partners]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

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
      await api.patch(`/admin/delivery-partners/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchPartners();
      if (selectedPartner?.id === id) setSelectedPartner((prev) => ({ ...prev, status: newStatus }));
    } catch {
      toast.error("Failed to change status.");
    }
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^[0-9]{10}$/.test(value);
  const isValidIFSC = (value) => /^[A-Za-z]{4}[0-9]{7}$/.test(value);
  const isValidPAN = (value) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase());
  const isValidAadhaar = (value) => /^[0-9]{12}$/.test(value);
  const isValidDrivingLicense = (value) => /^[A-Z0-9\- ]{8,25}$/i.test(value.trim());
  const isValidVehicleNumber = (value) => /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{1,4}$/i.test(value.trim());
  const isNumeric = (value) => /^[0-9]+$/.test(String(value).trim());

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this delivery partner?")) return;
    try {
      await api.delete(`/admin/delivery-partners/${id}`);
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
    setValidationErrors({});
    setActiveTab("personal");
    setIsFormOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setActiveTab("personal");
    setValidationErrors({});
    const mapped = {};
    Object.keys(emptyForm).forEach((k) => {
      mapped[k] = partner[k] !== undefined ? partner[k] : emptyForm[k];
    });
    mapped.first_name = partner.first_name || partner.name?.split(" ")[0] || "";
    mapped.last_name = partner.last_name || partner.name?.split(" ").slice(1).join(" ") || "";
    mapped.name = partner.name || `${mapped.first_name} ${mapped.last_name}`.trim();
    mapped.password = "";
    mapped.confirmPassword = "";
    if (partner.date_of_birth) mapped.date_of_birth = partner.date_of_birth.substring(0, 10);
    setForm(mapped);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.first_name.trim()) errors.first_name = "First name is required.";
    if (!form.last_name.trim()) errors.last_name = "Last name is required.";
    if (!form.gender) errors.gender = "Please select gender.";
    if (!form.date_of_birth) {
      errors.date_of_birth = "Date of birth is required.";
    } else if (new Date(form.date_of_birth) > new Date()) {
      errors.date_of_birth = "Date of birth cannot be in the future.";
    }
    if (!form.blood_group) errors.blood_group = "Blood group is required.";

    if (!form.mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (!isValidPhone(form.mobile.trim())) {
      errors.mobile = "Enter a valid 10-digit mobile number.";
    }

    if (form.alt_mobile?.trim() && !isValidPhone(form.alt_mobile.trim())) {
      errors.alt_mobile = "Enter a valid 10-digit alternate mobile number.";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!editingPartner && !form.password) {
      errors.password = "Password is required.";
    }
    if (form.password) {
      if (!form.confirmPassword) {
        errors.confirmPassword = "Please confirm the password.";
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    if (!form.current_address.trim()) errors.current_address = "Current address is required.";
    if (!form.permanent_address.trim()) errors.permanent_address = "Permanent address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!form.pincode.trim()) {
      errors.pincode = "Pincode is required.";
    } else if (!isNumeric(form.pincode.trim())) {
      errors.pincode = "Enter a valid numeric pincode.";
    }
    if (!form.live_location.trim()) errors.live_location = "Live GPS location is required.";

    if (!form.emergency_contact_name.trim()) errors.emergency_contact_name = "Emergency contact name is required.";
    if (!form.emergency_contact_relationship.trim()) errors.emergency_contact_relationship = "Relationship is required.";
    if (!form.emergency_contact_mobile.trim()) {
      errors.emergency_contact_mobile = "Emergency phone is required.";
    } else if (!isValidPhone(form.emergency_contact_mobile.trim())) {
      errors.emergency_contact_mobile = "Enter a valid 10-digit emergency mobile number.";
    }

    if (!form.vehicle_brand.trim()) errors.vehicle_brand = "Vehicle brand is required.";
    if (!form.vehicle_model.trim()) errors.vehicle_model = "Vehicle model is required.";
    if (!form.vehicle_number.trim()) {
      errors.vehicle_number = "Vehicle number is required.";
    } else if (!isValidVehicleNumber(form.vehicle_number.trim())) {
      errors.vehicle_number = "Enter a valid vehicle number (e.g. KA01AB1234).";
    }
    if (!form.vehicle_color.trim()) errors.vehicle_color = "Vehicle color is required.";

    if (!form.license_number.trim()) {
      errors.license_number = "Driving license number is required.";
    } else if (!isValidDrivingLicense(form.license_number.trim())) {
      errors.license_number = "Enter a valid driving license number (e.g. MH1234567890123).";
    }
    if (!form.license_holder_name.trim()) errors.license_holder_name = "License holder name is required.";
    if (!form.license_issue_date) errors.license_issue_date = "License issue date is required.";
    if (!form.license_expiry_date) errors.license_expiry_date = "License expiry date is required.";

    if (!form.account_holder_name.trim()) errors.account_holder_name = "Account holder name is required.";
    if (!form.bank_name.trim()) errors.bank_name = "Bank name is required.";
    if (!form.bank_account_number.trim()) {
      errors.bank_account_number = "Account number is required.";
    } else if (!isNumeric(form.bank_account_number.trim())) {
      errors.bank_account_number = "Enter a valid account number.";
    }
    if (!form.ifsc_code.trim()) {
      errors.ifsc_code = "IFSC code is required.";
    } else if (!isValidIFSC(form.ifsc_code.trim())) {
      errors.ifsc_code = "Enter a valid IFSC code.";
    }
    if (!form.branch_name.trim()) errors.branch_name = "Branch name is required.";
    if (!form.upi_id.trim()) errors.upi_id = "UPI ID is required.";

    if (!form.aadhaar_number.trim()) {
      errors.aadhaar_number = "Aadhaar number is required.";
    } else if (!isValidAadhaar(form.aadhaar_number.trim())) {
      errors.aadhaar_number = "Enter a valid 12-digit Aadhaar number.";
    }
    if (!form.pan_number.trim()) {
      errors.pan_number = "PAN number is required.";
    } else if (!isValidPAN(form.pan_number.trim())) {
      errors.pan_number = "Enter a valid PAN number like ABCDE1234F.";
    }

    if (!form.available_areas.trim()) errors.available_areas = "Available areas are required.";
    if (!form.preferred_distance.trim()) errors.preferred_distance = "Preferred distance is required.";
    if (!form.available_time_morning && !form.available_time_afternoon && !form.available_time_evening && !form.available_time_night) {
      errors.available_time = "Select at least one available time slot.";
    }

    if (!form.delivery_radius.trim()) {
      errors.delivery_radius = "Delivery radius is required.";
    } else if (!isNumeric(form.delivery_radius.trim())) {
      errors.delivery_radius = "Enter a valid delivery radius.";
    }
    if (!form.driving_experience.trim()) {
      errors.driving_experience = "Driving experience is required.";
    } else if (!isNumeric(form.driving_experience.trim())) {
      errors.driving_experience = "Enter a valid number of years.";
    }

    const fileRequired = [
      ["profile_photo", "Profile photo is required."],
      ["vehicle_front_photo", "Vehicle image is required."],
      ["license_front_image", "License front image is required."],
      ["license_back_image", "License back image is required."],
      ["aadhaar_front_url", "Aadhaar front upload is required."],
      ["aadhaar_back_url", "Aadhaar back upload is required."],
      ["pan_card_url", "PAN card upload is required."],
      ["selfie_with_vehicle", "Selfie with vehicle is required."],
      ["selfie_with_aadhaar", "Selfie with Aadhaar is required."],
      ["selfie_verification_url", "Identity selfie is required."],
    ];

    fileRequired.forEach(([key, message]) => {
      const value = form[key];
      const hasFile = value && (!(value instanceof FileList) || value.length > 0);
      if (!hasFile) {
        errors[key] = message;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validateForm()) {
      toast.error("Please resolve the highlighted fields before submitting.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        name: `${form.first_name || ""} ${form.last_name || ""}`.trim(),
      };
      delete payload.confirmPassword;
      if (editingPartner && !payload.password) {
        delete payload.password;
      }
      const formData = createFormDataPayload(payload);
      if (editingPartner) {
        await api.put(`/admin/delivery-partners/${editingPartner.id}`, formData);
        toast.success("Delivery partner updated.");
      } else {
        await api.post("/admin/delivery-partners", formData);
        toast.success("Delivery partner created.");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingPartner(null);
      fetchPartners();
    } catch (err) {
      const duplicateErrors = err?.response?.data?.errors;
      if (duplicateErrors) {
        setValidationErrors(duplicateErrors);
        toast.error(err?.response?.data?.message || "Duplicate values found.");
      } else {
        toast.error(err?.response?.data?.message || "Failed to save delivery partner.");
      }
    } finally {
      setSaving(false);
    }
  };


  const f = (key, label, type = "text", opts = {}) => {
    const error = validationErrors[key];
    return (
      <div>
        <label className={lbl}>{label}</label>
        <input
          type={type}
          value={form[key] || ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className={`${inp} ${error ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`}
          placeholder={opts.placeholder || `Enter ${label}`}
          {...opts}
        />
        {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
      </div>
    );
  };

  const sel = (key, label, options) => {
    const error = validationErrors[key];
    return (
      <div>
        <label className={lbl}>{label}</label>
        <select value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={`${inp} ${error ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`}>
          {(!form[key] || form[key] === "") && <option value="">Select {label}</option>}
          {options.map((o) => (
            <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
      </div>
    );
  };

  const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");

  const fileField = (key, label, currentVal) => {
    const error = validationErrors[key];
    return (
      <div>
        <label className={lbl}>{label}</label>
        <input type="file" title={`Choose ${label}`} onChange={(e) => setForm({ ...form, [key]: e.target.files })} className={`${inp} ${error ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`} />
        {currentVal instanceof FileList && currentVal.length > 0 && (
          <p className="mt-1 text-[11px] text-slate-300">Selected file: {currentVal[0].name}</p>
        )}
        {currentVal && typeof currentVal === "string" && !isDataUrl(currentVal) && (
          <a href={`${import.meta.env.VITE_API_URL}/../uploads/deliverypartners/${currentVal}`} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-500 hover:underline mt-1 block">
            View Uploaded File
          </a>
        )}
        {currentVal && typeof currentVal === "string" && isDataUrl(currentVal) && (
          <p className="mt-1 text-[11px] text-emerald-500">Stored as Base64 Data URL</p>
        )}
        {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
      </div>
    );
  };


  const toggle = (key, label) => (
    <div className="flex items-center gap-3">
      <input type="checkbox" id={key} checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
      <label htmlFor={key} className="text-sm font-semibold text-white">{label}</label>
    </div>
  );

  const renderTabContent = () => {
    const errorSummary = Object.keys(validationErrors).length > 0;
    return (
      <div className="space-y-5">
        {errorSummary && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            Please resolve the highlighted fields before continuing.
          </div>
        )}
        {(() => {
          switch (activeTab) {
            case "personal":
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {f("first_name", "First Name", "text", { placeholder: "Enter first name" })}
                  {f("last_name", "Last Name", "text", { placeholder: "Enter last name" })}
                  {sel("gender", "Gender", ["Male", "Female", "Other"])}
                  <div>
                    <label className={lbl}>DOB</label>
                    <input
                      type="date"
                      value={form.date_of_birth || ""}
                      onChange={handleDobChange}
                      className={`${inp} ${validationErrors.date_of_birth ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`}
                    />
                    {validationErrors.date_of_birth && <p className="mt-1 text-[10px] text-rose-400">{validationErrors.date_of_birth}</p>}
                  </div>
                  {sel("blood_group", "Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"])}
                  {f("mobile", "Mobile Number", "tel", { placeholder: "Enter 10-digit mobile number" })}
                  {f("alt_mobile", "Alternate Mobile", "tel", { placeholder: "Enter alternate mobile number" })}
                  {f("email", "Email ID", "email", { placeholder: "Enter email address" })}
                  
                  <div className="md:col-span-2">
                    {fileField("profile_photo", "Profile Photo", form.profile_photo)}
                  </div>
                  {!editingPartner && (
                    <div>
                      <label className={lbl}>Password</label>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password || ""}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          className={`${inp} pr-12 ${validationErrors.password
                              ? "border-rose-500 ring-1 ring-rose-500/20"
                              : ""
                            }`}
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

                      {validationErrors.password && (
                        <p className="mt-1 text-[10px] text-rose-400">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>
                  )}

                  {!editingPartner && (
                    <div>
                      <label className={lbl}>Confirm Password</label>

                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`${inp} pr-12 ${validationErrors.confirmPassword
                              ? "border-rose-500 ring-1 ring-rose-500/20"
                              : ""
                            }`}
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

                      {validationErrors.confirmPassword && (
                        <p className="mt-1 text-[10px] text-rose-400">
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            case "address":
              return (
                <div className="grid grid-cols-1 gap-5">
                  {f("current_address", "Current Address", "text", { placeholder: "Enter current address" })}
                  {f("permanent_address", "Permanent Address", "text", { placeholder: "Enter permanent address" })}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {f("city", "City", "text", { placeholder: "Enter city" })}
                    {sel("state", "State", indiaStates)}
                    {f("pincode", "Pincode", "text", { placeholder: "Enter pincode" })}
                    {f("live_location", "Live GPS Location", "text", { placeholder: "Enter live GPS coordinates or location" })}
                  </div>
                </div>
              );
            case "emergency":
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {f("emergency_contact_name", "Emergency Contact Name", "text", { placeholder: "Enter emergency contact name" })}
                  {sel("emergency_contact_relationship", "Relationship", ["Parent", "Spouse", "Sibling", "Friend", "Colleague", "Other"]) }
                  {f("emergency_contact_mobile", "Mobile Number", "tel", { placeholder: "Enter emergency contact mobile" })}
                </div>
              );
            case "vehicle":
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {sel("vehicle_type", "Vehicle Type", ["Bike", "Scooter", "Bicycle", "Electric Bike"])}
                  {sel("vehicle_brand", "Vehicle Brand", vehicleBrands)}
                  {f("vehicle_model", "Vehicle Model", "text", { placeholder: "Enter vehicle model" })}
                  {f("vehicle_number", "Vehicle Number", "text", { placeholder: "Enter vehicle number e.g. KA01AB1234" })}
                  {sel("vehicle_color", "Vehicle Color", vehicleColors)}
                  {fileField("vehicle_front_photo", "Vehicle Image", form.vehicle_front_photo)}
                </div>
              );
            case "driving":
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {f("license_number", "Driving License Number", "text", { placeholder: "Enter driving license number e.g. MH1234567890123" })}
                  {f("license_holder_name", "License Holder Name", "text", { placeholder: "Enter license holder name" })}
                  <div>
                    <label className={lbl}>Issue Date</label>
                    <input
                      type="date"
                      value={form.license_issue_date || ""}
                      onChange={(e) => setForm({ ...form, license_issue_date: e.target.value })}
                      className={`${inp} ${validationErrors.license_issue_date ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`}
                      placeholder="Select license issue date"
                    />
                    {validationErrors.license_issue_date && <p className="mt-1 text-[10px] text-rose-400">{validationErrors.license_issue_date}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Expiry Date</label>
                    <input
                      type="date"
                      value={form.license_expiry_date || ""}
                      onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })}
                      className={`${inp} ${validationErrors.license_expiry_date ? "border-rose-500 ring-1 ring-rose-500/20" : ""}`}
                      placeholder="Select license expiry date"
                    />
                    {validationErrors.license_expiry_date && <p className="mt-1 text-[10px] text-rose-400">{validationErrors.license_expiry_date}</p>}
                  </div>
                  <div>
                    {fileField("license_front_image", "Driving License - Front", form.license_front_image)}
                  </div>
                  <div>
                    {fileField("license_back_image", "Driving License - Back", form.license_back_image)}
                  </div>
                </div>
              );
            case "bank":
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {f("account_holder_name", "Account Holder Name", "text", { placeholder: "Enter account holder name" })}
                  {f("bank_name", "Bank Name", "text", { placeholder: "Enter bank name" })}
                  {f("bank_account_number", "Account Number", "text", { placeholder: "Enter account number" })}
                  {f("ifsc_code", "IFSC Code", "text", { placeholder: "Enter IFSC code" })}
                  {f("branch_name", "Branch", "text", { placeholder: "Enter branch name" })}
                  {f("upi_id", "UPI ID", "text", { placeholder: "Enter UPI ID" })}
                  {f("aadhaar_number", "Aadhaar Number", "text", { placeholder: "Enter Aadhaar number (12 digits)" })}
                  {f("pan_number", "PAN Number", "text", { placeholder: "Enter PAN number e.g. ABCDE1234F" })}
                </div>
              );
            case "documents":
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Insurance fields removed per schema change */}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {fileField("aadhaar_front_url", "Aadhaar Front", form.aadhaar_front_url)}
                    {fileField("aadhaar_back_url", "Aadhaar Back", form.aadhaar_back_url)}
                    {fileField("pan_card_url", "PAN Card", form.pan_card_url)}
                    {fileField("selfie_verification_url", "Identity Selfie", form.selfie_verification_url)}
                    {fileField("selfie_with_vehicle", "Selfie With Vehicle", form.selfie_with_vehicle)}
                    {fileField("selfie_with_aadhaar", "Selfie With Aadhaar", form.selfie_with_aadhaar)}
                  </div>
                </div>
              );
            case "preferences":
              return (
                <div className="space-y-5">
                  {f("available_areas", "Available Areas", "text", { placeholder: "Enter delivery areas or zones" })}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-white">Available Time</p>
                      {toggle("available_time_morning", "Morning")}
                      {toggle("available_time_afternoon", "Afternoon")}
                      {toggle("available_time_evening", "Evening")}
                      {toggle("available_time_night", "Night")}
                      {validationErrors.available_time && <p className="mt-1 text-[10px] text-rose-400">{validationErrors.available_time}</p>}
                    </div>
                    <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-white">Preferred Distance</p>
                      {['3 KM', '5 KM', '10 KM'].map((distance) => (
                        <button
                          type="button"
                          key={distance}
                          onClick={() => setForm({ ...form, preferred_distance: distance })}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-black uppercase tracking-[0.18em] transition ${form.preferred_distance === distance ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}>
                          {distance}
                        </button>
                      ))}
                      {validationErrors.preferred_distance && <p className="mt-1 text-[10px] text-rose-400">{validationErrors.preferred_distance}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {f("delivery_radius", "Delivery Radius (KM)", "number", { placeholder: "Enter delivery radius in KM" })}
                      {f("driving_experience", "Driving Experience", "number", { placeholder: "Enter years of driving experience" })}
                    </div>
                  </div>
                </div>
              );
            // verification tab removed
            default:
              return null;
          }
        })()}
      </div>
    );
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 superadmin-panel p-4 rounded-xl">
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
        <div className="superadmin-card rounded-2xl overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-200">
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center w-16">S.No</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Partner Info</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Vehicle Details</th>
                  {/* <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Address / Verification</th> */}
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Deliveries</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Earnings</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em]">Status</th>
                  <th className="px-5 py-4 text-[10px] font-black text-white uppercase tracking-[0.15em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPartners.map((partner, index) => (
                  <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-center text-sm font-black text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                    {/* <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="space-y-1.5 text-[11px] leading-snug">
                        <p><span className="font-black text-slate-800">Current:</span> {partner.current_address || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Permanent:</span> {partner.permanent_address || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Live GPS:</span> {partner.live_location || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Emergency:</span> {partner.emergency_contact_name ? `${partner.emergency_contact_name} (${partner.emergency_contact_relationship || 'N/A'}) ${partner.emergency_contact_mobile || ''}` : 'N/A'}</p>
                        <p><span className="font-black text-slate-800">License Issue:</span> {partner.license_issue_date ? partner.license_issue_date.substring(0, 10) : 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Available:</span> {partner.available_areas || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Time:</span> {[
                          partner.available_time_morning ? 'Morning' : null,
                          partner.available_time_afternoon ? 'Afternoon' : null,
                          partner.available_time_evening ? 'Evening' : null,
                          partner.available_time_night ? 'Night' : null,
                        ].filter(Boolean).join(', ') || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Verified:</span> {[partner.face_verified ? 'Face' : null, partner.location_verified ? 'Location' : null].filter(Boolean).join(', ') || 'N/A'}</p>
                        <p><span className="font-black text-slate-800">Selfies:</span> {[partner.selfie_with_vehicle ? 'Vehicle' : null, partner.selfie_with_aadhaar ? 'Aadhaar' : null].filter(Boolean).join(', ') || 'N/A'}</p>
                      </div>
                    </td> */}
                    <td className="px-5 py-4 text-sm font-black text-slate-700">{partner.total_deliveries || 0}</td>
                    <td className="px-5 py-4 text-sm font-black text-emerald-600">₹{parseFloat(partner.earnings || 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${partner.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : partner.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/admin/delivery-partners/${partner.id}`)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(partner)} className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition" title="Edit Partner"><Edit2 className="w-4 h-4" /></button>
                        {partner.status !== "Approved" && <button onClick={() => handleStatusChange(partner.id, "Approved")} className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition" title="Approve"><Check className="w-4 h-4" /></button>}
                        {partner.status === "Approved" && <button onClick={() => handleStatusChange(partner.id, "Suspended")} className="p-1.5 hover:bg-amber-50 text-amber-500 hover:text-amber-700 rounded-lg transition" title="Suspend"><ShieldAlert className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(partner.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedPartners.length === 0 && (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-xs text-slate-400 italic">No delivery partners match your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedPartners.map((partner) => (
            <div key={partner.id} className="superadmin-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200">
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
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => navigate(`/admin/delivery-partners/${partner.id}`)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:text-slate-800 transition text-center border border-slate-200">Details</button>
                <button onClick={() => openEditModal(partner)} className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition text-center border border-emerald-200">Edit</button>
                <button onClick={() => handleDelete(partner.id)} className="p-2 bg-slate-50 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition border border-slate-200" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {paginatedPartners.length === 0 && <p className="col-span-full text-center text-xs text-slate-400 italic py-8">No delivery partners match your criteria.</p>}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 mb-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 cursor-pointer bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-100 border cursor-pointer border-slate-200 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Add / Edit Form Popup */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
          <div className="border border-white/10 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden grid lg:grid-cols-[320px_1fr] max-h-[95vh] h-full bg-slate-900">
            <div className="hidden lg:flex flex-col gap-6 p-6 bg-slate-950 border-r border-white/10 overflow-y-auto min-h-0 h-full">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Delivery Partner Onboarding</p>
                <h3 className="mt-4 text-3xl font-black text-white">Advanced Registration</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Nine guided steps to capture identity, vehicle, and compliance details with clarity.</p>
              </div>

              <div className="space-y-3">
                {tabs.map((step, index) => {
                  const completed = index < currentStepIndex;
                  const isActive = step.id === activeTab;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveTab(step.id)}
                      className={`w-full text-left rounded-3xl border px-4 py-3 transition ${isActive ? "bg-emerald-700 text-white border-emerald-600 shadow-xl" : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900/95"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white text-emerald-700" : completed ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                          {completed ? "✓" : index + 1}
                        </span>
                        <span className="text-xs uppercase tracking-[0.25em]">Step {index + 1}</span>
                      </div>
                      <p className="mt-3 text-sm leading-5 font-bold tracking-tight text-slate-200">{step.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto rounded-3xl border border-white/10 bg-slate-900/90 p-5 text-sm text-slate-400">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Progress</p>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((currentStepIndex + 1) / tabs.length) * 100}%` }} />
                </div>
                <p className="mt-4 text-slate-300">Complete each step to keep records accurate and approvals fast.</p>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden bg-slate-950 min-h-0 h-full">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Step {currentStepIndex + 1} of {tabs.length}</p>
                  <h4 className="mt-3 text-2xl font-black tracking-tight text-white">{tabs[currentStepIndex]?.label}</h4>
                  <p className="mt-2 text-sm text-slate-400 max-w-2xl">{tabs[currentStepIndex]?.description || "Fill in the required fields below to continue."}</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-slate-950 min-h-0 h-full">
                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">{renderTabContent()}</div>

                <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={currentStepIndex === 0}
                      onClick={goToPreviousStep}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-700"
                    >
                      Previous
                    </button>
                    {currentStepIndex < tabs.length - 1 ? (
                      <button
                        type="button"
                        onClick={goToNextStep}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600"
                      >
                        Next
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition hover:bg-slate-700">
                      Cancel
                    </button>
                    {currentStepIndex === tabs.length - 1 ? (
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : editingPartner ? "Update Partner" : "Create Partner"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
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
                  ["Current Address", selectedPartner.current_address || "N/A"],
                  ["Permanent Address", selectedPartner.permanent_address || "N/A"],
                  ["Live GPS", selectedPartner.live_location || "N/A"],
                  ["Emergency Contact", selectedPartner.emergency_contact_name ? `${selectedPartner.emergency_contact_name} (${selectedPartner.emergency_contact_relationship || 'N/A'}) ${selectedPartner.emergency_contact_mobile || ''}` : "N/A"],
                  ["Vehicle Type", selectedPartner.vehicle_type],
                  ["Vehicle Number", selectedPartner.vehicle_number],
                  ["License Issue Date", selectedPartner.license_issue_date ? selectedPartner.license_issue_date.substring(0, 10) : "N/A"],
                  ["Driving License", selectedPartner.license_number || "N/A"],
                  ["Available Areas", selectedPartner.available_areas || "N/A"],
                  ["Available Time", [selectedPartner.available_time_morning ? 'Morning' : null, selectedPartner.available_time_afternoon ? 'Afternoon' : null, selectedPartner.available_time_evening ? 'Evening' : null, selectedPartner.available_time_night ? 'Night' : null].filter(Boolean).join(', ') || 'N/A'],
                  ["Selfie Vehicle", selectedPartner.selfie_with_vehicle ? 'Uploaded' : 'Missing'],
                  ["Selfie Aadhaar", selectedPartner.selfie_with_aadhaar ? 'Uploaded' : 'Missing'],
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
