import { useState } from "react";
import api from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = reset password
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setResetToken(res.data.resetToken);
      setStep(2);
      toast.success("Email verified! Set your new password.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Email not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        resetToken,
        password: form.password,
      });
      toast.success("Password reset successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans"
      style={{
        background:
          "linear-gradient(135deg, #0E2A14 0%, #1B4D22 50%, #0E2A14 100%)",
      }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(20,184,166,0.3)] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-teal-600 to-emerald-700 px-8 py-10 text-white overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-lg" />

          <Link
            to="/login"
            className="relative z-10 inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              {step === 1 ? (
                <ShieldCheck className="w-7 h-7 text-white" />
              ) : (
                <CheckCircle className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {step === 1 ? "Forgot Password?" : "Reset Password"}
              </h2>
              <p className="text-white/60 text-sm font-medium mt-1">
                {step === 1
                  ? "Enter your registered email"
                  : "Create a new secure password"}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="relative z-10 flex items-center gap-3 mt-8">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step >= 1 ? "bg-white w-16" : "bg-white/20 w-8"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step >= 2 ? "bg-white w-16" : "bg-white/20 w-8"
              }`}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-10">
          {step === 1 ? (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(20,184,166,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 mb-2">
                <p className="text-sm text-teal-700 font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  Verified: {email}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-teal-500 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-teal-500 focus:outline-none transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(20,184,166,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
