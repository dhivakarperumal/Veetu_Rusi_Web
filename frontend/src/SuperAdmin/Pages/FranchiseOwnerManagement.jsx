import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  Search, Plus, Trash2, Edit2, Landmark, MapPin,
  CheckCircle, Copy, Eye, EyeOff, UserCheck, KeyRound, X,
  Clock, List, LayoutGrid, CreditCard
} from "lucide-react";

const ITEMS_PER_PAGE = 8;

const emptyForm = {
  // Basic Details
  franchise_name: "", owner_name: "", logo_url: "", banner_url: "",
  start_date: "", expiry_date: "", status: "Pending",

  // Contact Details
  mobile: "", alt_mobile: "", email: "", territory_pincodes: [],
  aadhaar_number: "", pan_number: "",
  
  // Address Details
  door_number: "", street_name: "", area: "", landmark: "",
  city: "", district: "", state: "", pincode: "", map_link: "",

  // Bank Account Details
  bank_name: "", account_holder_name: "", account_number: "", 
  ifsc_code: "", account_type: "Savings", bank_passbook_url: "",

  // Login Details
  username: "", password: "", confirmPassword: "", role: "Admin",
  login_status: "Active",

  // KYC Documents
  aadhaar_url: "", pan_url: "",
  signature_url: "",
  kyc_verification_status: "Pending",
  image_upload_status: "Pending",
  email_verified: false,
  otp_verified: false
};

const FranchiseOwnerManagement = () => {
  const [franchises, setFranchises] = useState([]);
  const [filteredFranchises, setFilteredFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewDetailsFranchise, setViewDetailsFranchise] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("franchise");
  const [linkedHomeChefCount, setLinkedHomeChefCount] = useState(0);
  const [linkedDeliveryPartnerCount, setLinkedDeliveryPartnerCount] = useState(0);
  const [linkedHomeChefs, setLinkedHomeChefs] = useState([]);
  const [linkedDeliveryPartners, setLinkedDeliveryPartners] = useState([]);

  // Approve modal: holds the franchise being approved + password input
  const [approveModal, setApproveModal] = useState(null); // { franchise } | null
  const [approvePw, setApprovePw] = useState("");
  const [showApprovePw, setShowApprovePw] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Buy Subscription modal
  const [purchaseTarget, setPurchaseTarget] = useState(null); // franchise being subscribed
  const [subPlans, setSubPlans] = useState([]);
  const [selectedSubPlan, setSelectedSubPlan] = useState(null);

  // Credentials modal
  const [credModal, setCredModal] = useState(null); // { email, password, owner_name, franchise_name, franch_user_id }
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [pincodeEntry, setPincodeEntry] = useState("");
  const [activeFormTab, setActiveFormTab] = useState("basic");

  const formSteps = [
    { id: "basic", label: "Basic Info", description: "Owner and franchise details" },
    { id: "contact", label: "Contact", description: "Phone, email and territory" },
    { id: "address", label: "Address", description: "Location and map details" },
    { id: "bank", label: "Bank Account", description: "Banking and payment details" },
    { id: "login", label: "Login & Auth", description: "Credential and access settings" },
    { id: "kyc", label: "KYC & Docs", description: "Verification documents and status" },
  ];
  const currentFormIndex = formSteps.findIndex(step => step.id === activeFormTab);
  const goToNextFormTab = () => setActiveFormTab(formSteps[Math.min(currentFormIndex + 1, formSteps.length - 1)].id);
  const goToPrevFormTab = () => setActiveFormTab(formSteps[Math.max(currentFormIndex - 1, 0)].id);
  const formRef = useRef(null);

  const getSubscriptionLabel = (franchise) => {
    if (!franchise) return 'Unknown';
    if (!franchise.start_date || !franchise.expiry_date) return 'Inactive';

    const start = new Date(franchise.start_date);
    const expiry = new Date(franchise.expiry_date);
    const now = new Date();

    expiry.setHours(23, 59, 59, 999);

    if (expiry < now) return 'Inactive';

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

  const isExpired = (f) => {
    if (!f || !f.expiry_date) return false;
    return new Date(f.expiry_date) < new Date();
  };

  const needsSubscription = (f) => {
    return getSubscriptionLabel(f) === 'Trial' || getSubscriptionLabel(f) === 'Inactive' || isExpired(f);
  };

  const openSubModal = async (franchise) => {
    try {
      const res = await api.get('/subscriptions/plans');
      setSubPlans(res.data);
      setSelectedSubPlan(res.data[0] || null);
      setPurchaseTarget(franchise);
    } catch {
      toast.error('Failed to load plans.');
    }
  };

  const startSubCheckout = async () => {
    if (!selectedSubPlan || !purchaseTarget) return toast.error('Select a plan');
    try {
      const res = await api.post('/subscriptions/checkout', { franchiseId: purchaseTarget.id, planId: selectedSubPlan.id });
      const { order, plan, key_id } = res.data;

      if (order && key_id) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        script.onload = () => {
          const options = {
            key: key_id,
            amount: order.amount,
            currency: order.currency || plan.currency,
            name: purchaseTarget.franchise_name,
            description: plan.name,
            ...(order.id && !order.id.startsWith('TEST_') ? { order_id: order.id } : {}),
            handler: async function (response) {
              try {
                await api.post('/subscriptions/confirm', {
                  franchiseId: purchaseTarget.id,
                  planId: plan.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                toast.success('Subscription activated!');
                setPurchaseTarget(null);
                fetchFranchises();
              } catch { toast.error('Payment verification failed'); }
            },
            modal: { ondismiss: function () { toast('Payment cancelled'); } }
          };
          const rz = new window.Razorpay(options);
          rz.open();
        };
      } else {
        await api.post('/subscriptions/confirm', { franchiseId: purchaseTarget.id, planId: selectedSubPlan.id, razorpay_payment_id: 'TEST', razorpay_order_id: order.id });
        toast.success('Subscription activated (test)!');
        setPurchaseTarget(null);
        fetchFranchises();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Checkout failed');
    }
  };

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/franchises");
      setFranchises(res.data);
      setFilteredFranchises(res.data);
    } catch { toast.error("Failed to load franchises."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFranchises(); }, []);

  const fetchLinkedEntityCounts = async (franchise) => {
    if (!franchise) return;
    try {
      const [homeChefRes, deliveryRes] = await Promise.all([
        api.get("/superadmin/homechefs"),
        api.get("/superadmin/delivery-partners")
      ]);

      const matcher = (item) =>
        item.created_by_user_id === franchise.franch_user_id;

      const homeChefs = homeChefRes.data.filter(matcher);
      const deliveryPartners = deliveryRes.data.filter(matcher);

      setLinkedHomeChefs(homeChefs);
      setLinkedDeliveryPartners(deliveryPartners);
      setLinkedHomeChefCount(homeChefs.length);
      setLinkedDeliveryPartnerCount(deliveryPartners.length);
    } catch {
      setLinkedHomeChefCount(0);
      setLinkedDeliveryPartnerCount(0);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (viewDetailsFranchise) {
      fetchLinkedEntityCounts(viewDetailsFranchise);
    }
  }, [viewDetailsFranchise]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let filtered = franchises;

    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.franchise_name?.toLowerCase().includes(lower) ||
        f.owner_name?.toLowerCase().includes(lower) ||
        f.city?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    setFilteredFranchises(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, franchises]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePincodeChange = async (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, pincode: value }));

    if (value.length === 6 && /^\d+$/.test(value)) {
      try {
        const res = await api.get(`/superadmin/pincode/${value}`);
        const data = res.data;
        if (data && data[0] && data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setForm(prev => ({
            ...prev,
            city: postOffice.Block !== "NA" ? postOffice.Block : (postOffice.Region !== "NA" ? postOffice.Region : postOffice.District),
            district: postOffice.District,
            state: postOffice.State
          }));
          toast.success("Location details fetched successfully");
        } else {
          toast.error("Invalid Pincode");
        }
      } catch {
        toast.error("Failed to fetch location details");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run comprehensive validation
    if (!validateFormData()) {
      return;
    }

    try {
      const submitForm = {
        ...form,
        territory_pincodes: Array.isArray(form.territory_pincodes)
          ? form.territory_pincodes.filter(Boolean).join(", ")
          : form.territory_pincodes
      };
      const formData = new FormData();
      Object.keys(submitForm).forEach(key => {
        if (submitForm[key] instanceof FileList || Array.isArray(submitForm[key])) {
          for (let i = 0; i < submitForm[key].length; i++) {
            formData.append(key, submitForm[key][i]);
          }
        } else if (submitForm[key] !== null && submitForm[key] !== undefined) {
          formData.append(key, submitForm[key]);
        }
      });

      if (editingFranchise) {
        await api.put(`/superadmin/franchises/${editingFranchise.id}`, formData);
        toast.success("Franchise updated.");
      } else {
        await api.post("/superadmin/franchises", formData);
        toast.success("Franchise registered. Click Approve to create login credentials.");
      }
      setIsModalOpen(false);
      resetForm();
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save franchise.");
    }
  };

  // Step 1: open password entry modal
  const handleApprove = (franchise) => {
    setApprovePw("");
    setShowApprovePw(false);
    setApproveModal({ franchise });
  };

  // Step 2: submit with password
  const confirmApprove = async () => {
    const franchise = approveModal.franchise;
    if (!approvePw.trim() && !franchise.password_preset) { toast.error("Please enter a password."); return; }
    setApprovingId(franchise.id);
    try {
      const payload = approvePw.trim() ? { password: approvePw } : {};
      const res = await api.patch(`/superadmin/franchises/approve/${franchise.id}`, payload);
      const data = res.data;
      setApproveModal(null);
      if (data.alreadyApproved) {
        toast("Already approved.", { icon: "ℹ️" });
        setCredModal({ email: data.email, password: null, owner_name: data.owner_name, franchise_name: data.franchise_name, franch_user_id: data.franch_user_id });
      } else {
        toast.success("Franchise approved & credentials created!");
        setCredModal({ email: data.email, password: approvePw, owner_name: data.owner_name, franchise_name: data.franchise_name, franch_user_id: data.franch_user_id });
      }
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed.");
    } finally { setApprovingId(null); }
  };

  const handleEdit = (franchise) => {
    setEditingFranchise(franchise);
    const territory_pincodes = typeof franchise.territory_pincodes === "string"
      ? franchise.territory_pincodes.split(/\s*,\s*/).filter(Boolean)
      : franchise.territory_pincodes || [];
    const role = franchise.role === "Franchise Admin" ? "Admin" : franchise.role || "Admin";
    setForm({
      ...emptyForm,
      ...franchise,
      role,
      territory_pincodes,
      confirmPassword: "",
      email_verified: !!franchise.email_verified,
      otp_verified: !!franchise.otp_verified,
      kyc_verification_status: franchise.kyc_verification_status || "Pending"
    });
    setPincodeEntry("");
    setActiveFormTab("basic");
    setIsModalOpen(true);
  };

  const addTerritoryPincode = async () => {
    const value = pincodeEntry.trim();
    if (!value) return;
    if (!/^\d{6}$/.test(value)) {
      toast.error("Enter a valid 6-digit pincode.");
      return;
    }

    if (form.territory_pincodes.some(pin => pin === value || pin.startsWith(value + " -"))) {
      toast.error("Pincode already added.");
      return;
    }

    try {
      const res = await api.get(`/superadmin/pincode/${value}`);
      const data = res.data;

      let displayValue = value;
      if (data && data[0] && data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        const cityName = postOffice.Block !== "NA" ? postOffice.Block : (postOffice.Region !== "NA" ? postOffice.Region : postOffice.District);
        displayValue = `${value} - ${cityName}`;
      } else {
        toast.error("Invalid Pincode details, but adding anyway.");
      }

      setForm(prev => ({ ...prev, territory_pincodes: [...prev.territory_pincodes, displayValue] }));
      setPincodeEntry("");
    } catch {
      setForm(prev => ({ ...prev, territory_pincodes: [...prev.territory_pincodes, value] }));
      setPincodeEntry("");
      toast.error("Could not fetch city for pincode");
    }
  };

  const removeTerritoryPincode = (index) => {
    const updatedPins = form.territory_pincodes.filter((_, i) => i !== index);
    setForm({ ...form, territory_pincodes: updatedPins });
  };

  const handleToggleStatus = async (franchise) => {
    const nextStatus = franchise.status === "Active" ? "Inactive" : "Active";
    if (nextStatus === "Active" && !franchise.franch_user_id) {
      handleApprove(franchise);
      return;
    }
    try {
      const updatedForm = {
        franchise_name: franchise.franchise_name,
        owner_name: franchise.owner_name,
        mobile: franchise.mobile,
        email: franchise.email,
        city: franchise.city,
        state: franchise.state,
        status: nextStatus
      };
      await api.put(`/superadmin/franchises/${franchise.id}`, updatedForm);
      toast.success(`Franchise status updated to ${nextStatus}.`);
      fetchFranchises();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this franchise owner?")) return;
    try {
      await api.delete(`/superadmin/franchises/${id}`);
      toast.success("Franchise removed.");
      fetchFranchises();
    } catch { toast.error("Failed to delete."); }
  };

  const resetForm = () => {
    setEditingFranchise(null);
    setForm(emptyForm);
    setActiveFormTab("basic");
  };

  // Validation helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s+\-()]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateAadhaar = (aadhaar) => {
    return /^\d{12}$/.test(aadhaar);
  };

  const validatePAN = (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  };

  const validateIFSC = (ifsc) => {
    return /^[A-Z]{4}[0-9A-Z]{7}$/.test(ifsc.toUpperCase());
  };

  const validateAccountNumber = (accountNumber) => {
    return /^\d{9,18}$/.test(accountNumber.replace(/\s/g, ""));
  };

  const validatePincode = (pincode) => {
    return /^\d{6}$/.test(pincode);
  };

  // Main form validation
  const validateFormData = () => {
    // Basic Info validation
    if (!form.franchise_name.trim()) {
      toast.error("Franchise name is required.");
      setActiveFormTab("basic");
      return false;
    }
    if (!form.owner_name.trim()) {
      toast.error("Owner name is required.");
      setActiveFormTab("basic");
      return false;
    }
    if (!editingFranchise && (!form.logo_url || !form.banner_url)) {
      toast.error("Upload both franchise logo and banner.");
      setActiveFormTab("basic");
      return false;
    }

    // Contact Info validation
    if (!form.mobile.trim()) {
      toast.error("Mobile number is required.");
      setActiveFormTab("contact");
      return false;
    }
    if (!validatePhone(form.mobile)) {
      toast.error("Invalid mobile number format.");
      setActiveFormTab("contact");
      return false;
    }
    if (!validateAadhaar(form.aadhaar_number)) {
      toast.error("Aadhaar must be 12 digits.");
      setActiveFormTab("contact");
      return false;
    }
    if (!validatePAN(form.pan_number)) {
      toast.error("Invalid PAN format (e.g., ABCDE1234F).");
      setActiveFormTab("contact");
      return false;
    }
    if (form.territory_pincodes.length === 0) {
      toast.error("Add at least one territory pincode.");
      setActiveFormTab("contact");
      return false;
    }

    // Address validation
    if (!form.city.trim()) {
      toast.error("City is required.");
      setActiveFormTab("address");
      return false;
    }
    if (!form.state.trim()) {
      toast.error("State is required.");
      setActiveFormTab("address");
      return false;
    }
    if (form.pincode && !validatePincode(form.pincode)) {
      toast.error("Pincode must be 6 digits.");
      setActiveFormTab("address");
      return false;
    }

    // Bank Account validation
    if (!form.bank_name.trim()) {
      toast.error("Bank name is required.");
      setActiveFormTab("bank");
      return false;
    }
    if (!form.account_holder_name.trim()) {
      toast.error("Account holder name is required.");
      setActiveFormTab("bank");
      return false;
    }
    if (!validateAccountNumber(form.account_number)) {
      toast.error("Account number must be 9-18 digits.");
      setActiveFormTab("bank");
      return false;
    }
    if (!validateIFSC(form.ifsc_code)) {
      toast.error("Invalid IFSC code format (e.g., SBIN0001234).");
      setActiveFormTab("bank");
      return false;
    }
    if (!form.account_type.trim()) {
      toast.error("Account type is required.");
      setActiveFormTab("bank");
      return false;
    }
    if (!editingFranchise && !form.bank_passbook_url) {
      toast.error("Upload bank passbook document.");
      setActiveFormTab("bank");
      return false;
    }

    // Login validation (only for new franchises)
    if (!editingFranchise) {
      if (!form.email.trim()) {
        toast.error("Email is required.");
        setActiveFormTab("login");
        return false;
      }
      if (!validateEmail(form.email)) {
        toast.error("Invalid email format.");
        setActiveFormTab("login");
        return false;
      }
      if (!form.username.trim()) {
        toast.error("Username is required.");
        setActiveFormTab("login");
        return false;
      }
      if (!form.password || form.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        setActiveFormTab("login");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match.");
        setActiveFormTab("login");
        return false;
      }
    }

    // KYC validation
    if (!form.email_verified) {
      toast.error("Email must be verified in KYC tab.");
      setActiveFormTab("kyc");
      return false;
    }
    if (!form.otp_verified) {
      toast.error("Mobile OTP must be verified in KYC tab.");
      setActiveFormTab("kyc");
      return false;
    }
    if (form.kyc_verification_status !== "Verified") {
      toast.error("KYC must be verified before registration.");
      setActiveFormTab("kyc");
      return false;
    }
    if (!form.aadhaar_url || !form.pan_url) {
      toast.error("Upload Aadhaar and PAN documents.");
      setActiveFormTab("kyc");
      return false;
    }

    return true;
  };

  const finalizeKycVerification = () => {
    if (!form.aadhaar_url || !form.pan_url) {
      toast.error("Upload Aadhaar and PAN to complete KYC.");
      return;
    }
    setForm(prev => ({ ...prev, kyc_verification_status: "Verified" }));
    toast.success("KYC marked verified. You can now submit the registration.");
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };
  const isLogoUploaded = Boolean(form.logo_url);
  const isBannerUploaded = Boolean(form.banner_url);
  const imageComplete = isLogoUploaded && isBannerUploaded;
  const getFileName = (file) => {
    if (!file) return "No file uploaded";
    return typeof file === "string" ? file.split("/").pop() : file.name;
  };

  const inputCls = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl outline-none font-medium text-slate-100 text-sm placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500/60 transition-all";

  const totalCount = franchises.length;
  const activeCount = franchises.filter(f => f.status === "Active").length;
  const pendingCount = franchises.filter(f => f.status === "Pending").length;
  const inactiveCount = franchises.filter(f => f.status === "Inactive").length;

  const totalPages = Math.ceil(filteredFranchises.length / ITEMS_PER_PAGE);
  const paginatedFranchises = filteredFranchises.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const navigate = useNavigate();

  if (viewDetailsFranchise) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header with Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setViewDetailsFranchise(null)}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl transition shadow-sm active:scale-95 self-start"
          >
            ← Back to List
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                const f = viewDetailsFranchise;
                setViewDetailsFranchise(null);
                handleEdit(f);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit Details
            </button>
            <button
              onClick={() => {
                const id = viewDetailsFranchise.id;
                setViewDetailsFranchise(null);
                handleDelete(id);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Owner
            </button>
          </div>
        </div>

        {/* Full Details Content */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{viewDetailsFranchise.franchise_name}</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-500 font-semibold">{viewDetailsFranchise.city}, {viewDetailsFranchise.state}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${viewDetailsFranchise.status === "Active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                  : viewDetailsFranchise.status === "Inactive"
                    ? "bg-red-50 text-red-700 border border-red-200/50"
                    : "bg-amber-50 text-amber-700 border border-amber-200/50"
                }`}>{viewDetailsFranchise.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-6 shadow-lg shadow-emerald-100/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700/70">Home Chefs</p>
                  <p className="text-5xl font-black text-slate-900 mt-4">{linkedHomeChefCount}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-500 max-w-xs">
                    Total linked home chefs for this franchise.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm border border-emerald-200">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="pointer-events-none absolute -right-10 -top-8 text-[6rem] text-emerald-200 opacity-20">+</div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-100 p-6 shadow-lg shadow-slate-200/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Delivery Partners</p>
                  <p className="text-5xl font-black text-slate-900 mt-4">{linkedDeliveryPartnerCount}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-500 max-w-xs">
                    Total linked delivery partners for this franchise.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm border border-slate-200">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <div className="pointer-events-none absolute -right-10 -top-8 text-[6rem] text-slate-200 opacity-20">•</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Tabs */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 border-r border-slate-100 pr-6">
              <button
                onClick={() => setActiveDetailTab("franchise")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === "franchise"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <Landmark className="w-4 h-4" />
                Franchise Info
              </button>
              <button
                onClick={() => setActiveDetailTab("owner")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === "owner"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <UserCheck className="w-4 h-4" />
                Owner Profile
              </button>
              <button
                onClick={() => setActiveDetailTab("homechefs")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === "homechefs"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <List className="w-4 h-4" />
                Home Chefs
              </button>
              <button
                onClick={() => setActiveDetailTab("deliverypartners")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === "deliverypartners"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <MapPin className="w-4 h-4" />
                Delivery Partners
              </button>
              <button
                onClick={() => setActiveDetailTab("credentials")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${activeDetailTab === "credentials"
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <KeyRound className="w-4 h-4" />
                Credentials & Access
              </button>
            </div>

            {/* Right Side: Tab Details Content */}
            <div className="flex-1 min-w-0">
              {activeDetailTab === "franchise" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Franchise Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Franchise Name</span>
                      <span className="text-sm font-bold text-slate-800">{viewDetailsFranchise.franchise_name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Territory Location</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                        <span className="text-sm font-bold text-slate-800">{viewDetailsFranchise.city}, {viewDetailsFranchise.state}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Registration Date</span>
                      <span className="text-sm font-bold text-slate-800">{new Date(viewDetailsFranchise.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "owner" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Owner Profile Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Owner Name</span>
                      <span className="text-sm font-bold text-slate-800">{viewDetailsFranchise.owner_name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Email Address</span>
                      <span className="text-sm font-bold text-slate-800">{viewDetailsFranchise.email}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Mobile Phone</span>
                      <span className="text-sm font-bold text-slate-800">{viewDetailsFranchise.mobile}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "credentials" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">System Credentials & Access</h3>
                  {viewDetailsFranchise.franch_user_id ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 flex-shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Access Role: Admin</p>
                          <code className="text-xs text-slate-500 font-mono mt-0.5 block truncate max-w-xs md:max-w-md">{viewDetailsFranchise.franch_user_id}</code>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => copy(viewDetailsFranchise.franch_user_id)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy UUID
                        </button>
                        <button
                          onClick={() => setCredModal({ email: viewDetailsFranchise.email, password: null, owner_name: viewDetailsFranchise.owner_name, franchise_name: viewDetailsFranchise.franchise_name, franch_user_id: viewDetailsFranchise.franch_user_id })}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-sm"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> View Logins
                        </button>
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
                      <button
                        onClick={() => handleApprove(viewDetailsFranchise)}
                        className="px-5 py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-xl text-xs font-black uppercase tracking-widest transition active:scale-95 shadow-md hover:shadow-lg self-end sm:self-auto flex-shrink-0"
                      >
                        Approve & Create Account
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "homechefs" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                <div className="text-sm font-bold text-slate-800">{chef.name || chef.owner_name || "Unnamed Chef"}</div>
                                <div className="text-xs text-slate-500">{chef.city ? `${chef.city}, ${chef.state}` : "—"}</div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600">{chef.mobile || "—"}</td>
                              <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]" title={chef.email}>{chef.email || "—"}</td>
                              <td className="px-5 py-4 text-sm text-slate-600">{chef.chef_unique_code || chef.chef_id || "—"}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${chef.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                  {getSubscriptionLabel(chef) === 'Trial' ? `Trial (${getTrialDaysLeft(chef)} days left)` : getSubscriptionLabel(chef)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600">
                      No home chefs are currently linked to this franchise.
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "deliverypartners" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                <div className="text-sm font-bold text-slate-800">{partner.name || "Unnamed Partner"}</div>
                                <div className="text-xs text-slate-500">{partner.city ? `${partner.city}, ${partner.state}` : "—"}</div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600">{partner.mobile || "—"}</td>
                              <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]" title={partner.email}>{partner.email || "—"}</td>
                              <td className="px-5 py-4 text-sm text-slate-600">{partner.vehicle_number || partner.vehicle_type || "—"}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${partner.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                  {partner.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600">
                      No delivery partners are currently linked to this franchise.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 bg-slate-950/90 border border-slate-800 shadow-2xl shadow-slate-950/40 rounded-[2rem] p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]">Platform Control</span>
            <span className="inline-flex items-center rounded-full bg-slate-800/80 text-slate-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">Live Real-Time Insights</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Franchise Owners</h1>
            <p className="max-w-2xl text-sm text-slate-400">Premium dashboard for instant platform oversight. Manage franchise registrations, approvals, and owner subscriptions with enhanced visibility.</p>
          </div>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Franchise
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-slate-400 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 flex-shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Franchises</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{totalCount}</h4>
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-emerald-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Owners</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{activeCount}</h4>
          </div>
        </div>

        {/* Inactive Card */}
        <div className="bg-white border border-slate-100 border-l-4 border-l-amber-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 flex-shrink-0">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Pending & Inactive</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{pendingCount + inactiveCount}</h4>
          </div>
        </div>
      </div>

      {/* Toolbar: Search on Left, View Mode Switcher on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 p-5 rounded-[1.75rem] shadow-2xl shadow-slate-950/30">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-xl w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search by franchise name, owner or city..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-medium text-slate-100 text-sm focus:bg-slate-900 focus:border-emerald-500/70 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Right: Filters & View toggle mode */}
        <div className="flex flex-wrap items-center gap-3 self-end xl:self-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-bold text-xs uppercase tracking-widest text-slate-200 focus:bg-slate-900 focus:border-emerald-500/70 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 rounded-xl transition ${viewMode === "table"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-100"
                }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-3 rounded-xl transition ${viewMode === "card"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-100"
                }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View (Table / Cards) */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : viewMode === "table" ? (
        <>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-700">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] w-16 text-center">S.No</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Franchise</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Owner</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Territory</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Commission</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Subscription</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedFranchises.map((f, index) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* S.No */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      {/* Franchise */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{f.franchise_name}</h4>
                            <p className="text-xs text-slate-400 font-semibold">{f.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Owner */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">{f.owner_name}</p>
                        <p className="text-xs text-slate-400 font-semibold">{f.mobile}</p>
                      </td>
                      {/* Territory */}
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{f.city}, {f.state}</span>
                        </div>
                      </td>
                      {/* Subscription */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${getSubscriptionLabel(f) === 'Trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : getSubscriptionLabel(f) === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-red-50 text-red-700 border border-red-200/50'
                          }`}>
                          {getSubscriptionLabel(f)}
                        </span>
                      </td>
                      {/* Status */}
                      <td
                        className="px-5 py-4 cursor-pointer select-none"
                        onDoubleClick={() => handleToggleStatus(f)}
                        title="Double-click to toggle status"
                      >
                        <div className="space-y-1">
                          <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${f.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : f.status === "Inactive"
                                ? "bg-red-50 text-red-700 border border-red-200/50"
                                : "bg-amber-50 text-amber-700 border border-amber-200/50"
                            }`}>{f.status}</span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                          {/* Buy Subscription — shown for Trial / Expired / Inactive */}
                          {needsSubscription(f) && (
                            <button
                              onClick={() => openSubModal(f)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition shadow-sm shadow-emerald-500/30"
                              title="Buy Subscription"
                            >
                              <CreditCard className="w-3 h-3" />
                              Buy
                            </button>
                          )}

                          {/* Approve */}
                          {(!f.franch_user_id || f.status !== "Active") && (
                            <button
                              onClick={() => handleApprove(f)}
                              disabled={approvingId === f.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition disabled:opacity-50"
                              title="Approve & Create Credentials"
                            >
                              <UserCheck className="w-3 h-3" />
                              {approvingId === f.id ? "…" : "Approve"}
                            </button>
                          )}

                          {/* View Creds if linked */}
                          {/* {f.franch_user_id && (
                          <button
                            onClick={() => setCredModal({ email: f.email, password: null, owner_name: f.owner_name, franchise_name: f.franchise_name, franch_user_id: f.franch_user_id })}
                            className="p-2 hover:bg-teal-50 text-teal-600 rounded-lg transition"
                            title="View Credentials"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}  */}

                          {/* View Details */}
                          <button
                            onClick={() => navigate(`/superadmin/franchises/${f.id}`)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(f)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button onClick={() => handleDelete(f.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFranchises.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No franchise owners registered yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buy Subscription Modal */}
          {purchaseTarget && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-8 text-white relative overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">Buy Subscription</p>
                      <h3 className="text-2xl font-black tracking-tight">{purchaseTarget.franchise_name}</h3>
                      <p className="text-emerald-100 font-medium mt-1">{purchaseTarget.owner_name}</p>
                    </div>
                    <button onClick={() => setPurchaseTarget(null)} className="bg-black/10 hover:bg-black/20 text-white rounded-full p-2 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="p-8 bg-slate-50 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {subPlans.map(p => {
                      const isSel = selectedSubPlan && selectedSubPlan.id === p.id;
                      return (
                        <label key={p.id} className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-white ${isSel ? 'border-emerald-500 shadow-md shadow-emerald-100/50 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                          }`}>
                          <input type="radio" name="subplan" className="hidden" checked={isSel} onChange={() => setSelectedSubPlan(p)} />
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSel ? 'border-emerald-600' : 'border-slate-300'}`}>
                              {isSel && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>}
                            </div>
                            {p.durationDays >= 90 && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Best Value</span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{p.name}</h4>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-emerald-700">₹{p.amount}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> {p.durationDays} Days Access
                          </p>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setPurchaseTarget(null)} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={startSubCheckout} className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Pay & Activate
                  </button>
                </div>
              </div>
            </div>
            , document.body)}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {paginatedFranchises.map(f => {
            const initials = f.owner_name ? f.owner_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FO';
            return (
              <div key={f.id} className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
                {/* Header: Title and Status */}
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 tracking-tight">{f.franchise_name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs text-slate-500 font-semibold">{f.city}, {f.state}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase cursor-pointer select-none ${f.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : f.status === "Inactive"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    onDoubleClick={() => handleToggleStatus(f)}
                    title="Double-click to toggle status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${f.status === "Active" ? "bg-emerald-500" : f.status === "Inactive" ? "bg-rose-500" : "bg-amber-500"
                      }`} />
                    {f.status}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-4 flex-1">
                  {/* Owner Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold border border-slate-200/50">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{f.owner_name}</p>
                    </div>
                  </div>

                  {/* Contact & Business Info */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mobile Number</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{f.mobile}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1 truncate" title={f.email}>{f.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Status</p>
                      {f.franch_user_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200/20 px-2 py-0.5 rounded-md mt-1">
                          Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200/20 px-2 py-0.5 rounded-md mt-1">
                          Not Setup
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {!f.franch_user_id ? (
                      <button
                        onClick={() => handleApprove(f)}
                        disabled={approvingId === f.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#1B4D22] hover:bg-[#153b1a] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => setCredModal({ email: f.email, password: null, owner_name: f.owner_name, franchise_name: f.franchise_name, franch_user_id: f.franch_user_id })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-sm"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Credentials
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/superadmin/franchises/${f.id}`)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="View Franchise Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(f)}
                      className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition"
                      title="Edit Owner Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Delete Franchise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFranchises.length === 0 && (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl py-16 text-center">
              <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No franchise owners registered yet</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredFranchises.length)} of {filteredFranchises.length} entries
          </p>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition disabled:cursor-not-allowed shadow-sm"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 text-[10px] font-black rounded-xl transition ${currentPage === page
                    ? "bg-[#1B4D22] text-white shadow-sm shadow-[#1B4D22]/20"
                    : "text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSubmit} ref={formRef} className="border border-white/10 w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden grid lg:grid-cols-[320px_1fr] max-h-[95vh] h-full bg-slate-950 text-slate-100">
            <div className="hidden lg:flex flex-col gap-6 p-6 bg-slate-950 border-r border-slate-800 overflow-y-auto min-h-0 h-full">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Franchise Onboarding</p>
                <h3 className="mt-4 text-3xl font-black text-white">Register Franchise</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Five guided steps to capture franchise owner, contact, and verification details.</p>
              </div>
              <div className="space-y-3">
                {formSteps.map((step, index) => {
                  const completed = index < currentFormIndex;
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
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive
                          ? "bg-white text-emerald-700"
                          : completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}>
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
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${((currentFormIndex + 1) / formSteps.length) * 100}%` }}
                  />
                </div>
                <p className="mt-4 text-slate-300">Complete each section for faster approvals.</p>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden bg-slate-950 min-h-0 h-full">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Step {currentFormIndex + 1} of {formSteps.length}</p>
                  <h4 className="mt-3 text-2xl font-black tracking-tight text-white">{formSteps[currentFormIndex]?.label}</h4>
                  <p className="mt-2 text-sm text-slate-400 max-w-2xl">{formSteps[currentFormIndex]?.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="lg:hidden border-b border-white/10 bg-slate-950/95 p-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
                <div className="flex gap-2">
                  {formSteps.map(step => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveFormTab(step.id)}
                      className={`flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition ${activeFormTab === step.id
                        ? "bg-emerald-500 text-slate-950 shadow-[0_15px_40px_rgba(16,185,129,0.18)]"
                        : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-7 bg-slate-50/5">
                <div className="space-y-5">
              
                {/* Basic Info */}
                {activeFormTab === "basic" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">Basic Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Franchise Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Franchise Name / Branch *</label>
                        <input type="text" required value={form.franchise_name} onChange={e => setForm({ ...form, franchise_name: e.target.value })} placeholder="e.g. Veetu Rusi Coimbatore" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Owner Name *</label>
                        <input type="text" required value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Ram Kumar" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Franchise Logo</label>
                        <input type="file" accept="image/*" onChange={e => setForm({ ...form, logo_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Franchise Banner Image</label>
                        <input type="file" accept="image/*" onChange={e => setForm({ ...form, banner_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Start Date</label>
                        <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Expiry Date</label>
                        <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                          <option value="Pending">Pending</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 text-slate-100 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Image Upload Status</p>
                            <p className="mt-2 text-sm font-semibold text-slate-200">{imageComplete ? "All images ready for publish" : "Upload both logo and banner"}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${imageComplete ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" : "bg-amber-500/10 text-amber-200 border border-amber-500/20"}`}>
                            {imageComplete ? "Complete" : "Incomplete"}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-black">Logo File</p>
                            <p className="mt-2 text-sm text-slate-100 font-semibold">{getFileName(form.logo_url)}</p>
                          </div>
                          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-3">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-black">Banner File</p>
                            <p className="mt-2 text-sm text-slate-100 font-semibold">{getFileName(form.banner_url)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">KYC Readiness</p>
                        <p className="mt-2 text-sm font-semibold text-slate-200">Capture business registration, GST, PAN and license data in one section. KYC verification will help speed approvals.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">PAN Document: {form.pan_url ? "Uploaded" : "Pending"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                {activeFormTab === "contact" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">Contact Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Mobile Number *</label>
                        <input type="text" required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="9876543210" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Alternate Mobile</label>
                        <input type="text" value={form.alt_mobile} onChange={e => setForm({ ...form, alt_mobile: e.target.value })} placeholder="Optional" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Aadhaar Number *</label>
                        <input type="text" required value={form.aadhaar_number} onChange={e => setForm({ ...form, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="123456789012" maxLength="12" className={inputCls} />
                        <p className="text-[9px] text-slate-400 mt-1">Unique 12-digit Aadhaar number</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">PAN Number *</label>
                        <input type="text" required value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase().slice(0, 10) })} placeholder="ABCDE1234F" maxLength="10" className={inputCls} />
                        <p className="text-[9px] text-slate-400 mt-1">Unique 10-character PAN number</p>
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Pincodes</label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            type="text"
                            value={pincodeEntry}
                            onChange={e => setPincodeEntry(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTerritoryPincode();
                              }
                            }}
                            placeholder="Enter pincode and press + or Enter"
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={addTerritoryPincode}
                            className="inline-flex items-center justify-center px-4 rounded-xl bg-[#1B4D22] text-white font-black uppercase tracking-widest text-xs transition hover:bg-emerald-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {form.territory_pincodes.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {form.territory_pincodes.map((pin, idx) => (
                              <span key={`${pin}-${idx}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                {pin}
                                <button type="button" onClick={() => removeTerritoryPincode(idx)} className="text-slate-500 hover:text-rose-600 transition">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400">No pincodes added yet. Add one using the plus button.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Details */}
                {activeFormTab === "address" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">Address Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Door Number</label>
                        <input type="text" value={form.door_number} onChange={e => setForm({ ...form, door_number: e.target.value })} placeholder="e.g. 12/4" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Street Name</label>
                        <input type="text" value={form.street_name} onChange={e => setForm({ ...form, street_name: e.target.value })} placeholder="Main Street" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Area / Locality</label>
                        <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="RS Puram" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Landmark</label>
                        <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="Near Park" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">City *</label>
                        <input type="text" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Coimbatore" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">District</label>
                        <input type="text" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="Coimbatore" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">State *</label>
                        <input type="text" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Tamil Nadu" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Pincode</label>
                        <input type="text" value={form.pincode} onChange={handlePincodeChange} placeholder="641001" className={inputCls} />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Google Map Link</label>
                        <input type="url" value={form.map_link} onChange={e => setForm({ ...form, map_link: e.target.value })} placeholder="https://maps.app.goo.gl/..." className={inputCls} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Account Details */}
                {activeFormTab === "bank" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">Bank Account Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Bank Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={form.bank_name} 
                          onChange={e => setForm({ ...form, bank_name: e.target.value })} 
                          placeholder="e.g. State Bank of India" 
                          className={inputCls} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Account Holder Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={form.account_holder_name} 
                          onChange={e => setForm({ ...form, account_holder_name: e.target.value })} 
                          placeholder="Name as per bank" 
                          className={inputCls} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Account Number *</label>
                        <input 
                          type="text" 
                          required 
                          value={form.account_number} 
                          onChange={e => setForm({ ...form, account_number: e.target.value.replace(/\D/g, '') })} 
                          placeholder="9-18 digits" 
                          maxLength="18"
                          className={inputCls} 
                        />
                        <p className="text-[9px] text-slate-400 mt-1">9 to 18 digit account number</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">IFSC Code *</label>
                        <input 
                          type="text" 
                          required 
                          value={form.ifsc_code} 
                          onChange={e => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })} 
                          placeholder="e.g. SBIN0001234" 
                          maxLength="11"
                          className={inputCls} 
                        />
                        <p className="text-[9px] text-slate-400 mt-1">4 letters + 7 alphanumeric characters</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Account Type *</label>
                        <select 
                          required 
                          value={form.account_type} 
                          onChange={e => setForm({ ...form, account_type: e.target.value })} 
                          className={inputCls}
                        >
                          <option value="Savings">Savings</option>
                          <option value="Current">Current</option>
                          <option value="Business">Business</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Bank Passbook / Statement</label>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={e => setForm({ ...form, bank_passbook_url: e.target.files[0] })} 
                          className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} 
                        />
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className="mt-6 p-4 rounded-2xl border border-slate-700 bg-slate-900 space-y-3">
                      <p className="text-xs text-amber-300 uppercase tracking-[0.28em] font-black">Bank Details Validation</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 border border-slate-800">
                          <span className="text-slate-400">Bank Name</span>
                          <span className={form.bank_name ? "text-emerald-400 font-bold" : "text-slate-500"}>{form.bank_name ? "✓" : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 border border-slate-800">
                          <span className="text-slate-400">Account Number</span>
                          <span className={validateAccountNumber(form.account_number) ? "text-emerald-400 font-bold" : "text-slate-500"}>
                            {validateAccountNumber(form.account_number) ? "✓" : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 border border-slate-800">
                          <span className="text-slate-400">IFSC Code</span>
                          <span className={validateIFSC(form.ifsc_code) ? "text-emerald-400 font-bold" : "text-slate-500"}>
                            {validateIFSC(form.ifsc_code) ? "✓" : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 border border-slate-800">
                          <span className="text-slate-400">Passbook</span>
                          <span className={form.bank_passbook_url ? "text-emerald-400 font-bold" : "text-slate-500"}>
                            {form.bank_passbook_url ? "Uploaded" : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login & Auth */}
                {activeFormTab === "login" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">Login & Authentication</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!editingFranchise && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Username</label>
                            <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="franchise_admin" className={inputCls} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Email</label>
                            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@franchise.com" className={inputCls} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Password</label>
                            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className={inputCls} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Confirm Password</label>
                            <input type="password" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" className={inputCls} />
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Role</label>
                        <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>
                          <option value="Admin">Admin</option>
                          <option value="Franchise Manager">Franchise Manager</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Login Status</label>
                        <select required value={form.login_status} onChange={e => setForm({ ...form, login_status: e.target.value })} className={inputCls}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* KYC & Docs */}
                {activeFormTab === "kyc" && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-emerald-300 uppercase tracking-[0.25em] font-black mb-5">KYC & Verification Documents</p>

                    {/* Email & Mobile Verification Section */}
                    <div className="mb-6 p-4 rounded-2xl border border-slate-700 bg-slate-900 space-y-4">
                      <p className="text-xs text-amber-300 uppercase tracking-[0.28em] font-black">Step 1: Contact Verification</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email Verification */}
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-950">
                          <input
                            type="checkbox"
                            id="email_verified"
                            checked={form.email_verified}
                            onChange={(e) => setForm({ ...form, email_verified: e.target.checked })}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <label htmlFor="email_verified" className="flex-1 cursor-pointer">
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-300">Email Verified</div>
                            <div className="text-[11px] text-slate-400 mt-1">{form.email || "No email provided"}</div>
                          </label>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${form.email_verified
                              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
                              : "bg-slate-700/40 text-slate-300 border border-slate-600"
                            }`}>
                            {form.email_verified ? "✓ Done" : "Pending"}
                          </span>
                        </div>

                        {/* Mobile OTP Verification */}
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-950">
                          <input
                            type="checkbox"
                            id="otp_verified"
                            checked={form.otp_verified}
                            onChange={(e) => setForm({ ...form, otp_verified: e.target.checked })}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <label htmlFor="otp_verified" className="flex-1 cursor-pointer">
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-300">Mobile OTP Verified</div>
                            <div className="text-[11px] text-slate-400 mt-1">{form.mobile || "No mobile provided"}</div>
                          </label>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${form.otp_verified
                              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
                              : "bg-slate-700/40 text-slate-300 border border-slate-600"
                            }`}>
                            {form.otp_verified ? "✓ Done" : "Pending"}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 pt-2">✓ Check the boxes once email and mobile numbers are verified</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Verification Status</p>
                        <select value={form.kyc_verification_status} onChange={e => setForm({ ...form, kyc_verification_status: e.target.value })} className={inputCls + " bg-slate-900 border-slate-700 text-slate-100"}>
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <p className="mt-3 text-[11px] text-slate-500">Select the current verification state for this franchise owner.</p>
                      </div>
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Required Documents</p>
                            <p className="mt-2 text-sm text-slate-200 font-semibold">Keep these ready for upload and review.</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${form.kyc_verification_status === "Verified" ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" : "bg-amber-500/10 text-amber-200 border border-amber-500/20"}`}>
                            {form.kyc_verification_status}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 text-[11px] text-slate-400">
                          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-3 py-2 border border-slate-800">
                            <span>Aadhaar</span>
                            <span className="text-slate-300">{form.aadhaar_url ? "Uploaded" : "Pending"}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-3 py-2 border border-slate-800">
                            <span>PAN</span>
                            <span className="text-slate-300">{form.pan_url ? "Uploaded" : "Pending"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mb-5">
                      <button
                        type="button"
                        onClick={finalizeKycVerification}
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition"
                      >
                        Mark KYC Verified
                      </button>
                      <p className="text-[11px] text-slate-400">KYC can only be marked verified once Aadhaar and PAN are uploaded.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Aadhaar Card</label>
                        <input type="file" accept="image/*,.pdf" onChange={e => setForm({ ...form, aadhaar_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">PAN Card</label>
                        <input type="file" accept="image/*,.pdf" onChange={e => setForm({ ...form, pan_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Bank Passbook</label>
                        <input type="file" accept="image/*,.pdf" onChange={e => setForm({ ...form, bank_passbook_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Signature Image</label>
                        <input type="file" accept="image/*" onChange={e => setForm({ ...form, signature_url: e.target.files[0] })} className={inputCls + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/20 file:text-emerald-700"} />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

              <div className="p-8 border-t border-white/10 bg-slate-950/95 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={currentFormIndex === 0}
                    onClick={goToPrevFormTab}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  {currentFormIndex < formSteps.length - 1 ? (
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
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl bg-slate-900/80 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-200 transition hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95"
                  >
                    {editingFranchise ? "Update Franchise" : "Register Franchise"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Approve Password Modal */}
      {approveModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApproveModal(null)} />
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Approve Franchise</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{approveModal.franchise.franchise_name}</p>
                </div>
              </div>
              <button onClick={() => setApproveModal(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">Set a login password for <span className="text-slate-800 font-bold">{approveModal.franchise.owner_name}</span>. This will create an <span className="text-emerald-700 font-bold">admin</span> account using the registered email.</p>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Login Email</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 font-mono">{approveModal.franchise.email}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Password {approveModal.franchise.password_preset ? "(leave blank to use registration password)" : <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <input
                    type={showApprovePw ? "text" : "password"}
                    value={approvePw}
                    onChange={e => setApprovePw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmApprove()}
                    placeholder={approveModal.franchise.password_preset ? "Leave empty to reuse registration password" : "Enter password"}
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 text-sm focus:bg-white focus:border-emerald-600/40 pr-12 transition-all"
                  />
                  <button type="button" onClick={() => setShowApprovePw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                    {showApprovePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmApprove}
                  disabled={approvingId === approveModal.franchise.id}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {approvingId === approveModal.franchise.id ? "Approving…" : "Approve & Create Account"}
                </button>
                <button onClick={() => setApproveModal(null)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-xl transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Credentials Modal */}
      {credModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setCredModal(null); setShowPw(false); }} />
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Login Credentials</h3>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">admin access</p>
                </div>
              </div>
              <button onClick={() => { setCredModal(null); setShowPw(false); }} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Franchise info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Franchise</p>
                <p className="text-sm font-black text-slate-800">{credModal.franchise_name}</p>
                <p className="text-xs text-slate-500 font-semibold">{credModal.owner_name}</p>
              </div>

              {/* User ID */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Franchise User ID (UUID)</p>
                {credModal.franch_user_id ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-teal-700 font-mono flex-1 truncate">{credModal.franch_user_id}</code>
                    <button onClick={() => copy(credModal.franch_user_id)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                    ⏳ Pending Approval — UUID assigned after Approve
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Login Email</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 flex-1">{credModal.email}</span>
                  <button onClick={() => copy(credModal.email)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Password</p>
                {credModal.password ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700 flex-1 font-mono">
                      {showPw ? credModal.password : "•".repeat(credModal.password.length)}
                    </span>
                    <button onClick={() => setShowPw(p => !p)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copy(credModal.password)} className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Password was set at registration — not shown again for security. Reset if needed.</p>
                )}
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <div>
                  <p className="text-[10px] text-teal-700 font-black uppercase tracking-widest">Role Assigned</p>
                  <p className="text-xs text-slate-700 font-bold">admin</p>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 italic text-center">Share these credentials securely. Password cannot be recovered later.</p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { setCredModal(null); setShowPw(false); }}
                className="w-full py-3 bg-[#1B4D22] hover:bg-[#153b1a] text-white font-black text-xs uppercase tracking-widest rounded-xl transition active:scale-95 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
};

export default FranchiseOwnerManagement;
