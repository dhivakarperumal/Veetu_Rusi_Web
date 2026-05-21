import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #0E2A14 0%, #1B4D22 50%, #0E2A14 100%)' }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px]"></div>

      {/* Main Card - Increased Size */}
      <div className="relative z-10 w-full max-w-[1000px] min-h-[600px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(20,184,166,0.3)] overflow-hidden flex transform transition-all hover:shadow-[0_25px_60px_-15px_rgba(20,184,166,0.4)]">
        
        {/* Left Image Section */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center hidden md:block"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80')" }}
        >
          {/* Subtle warm overlay to make food pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-teal-800/20 to-transparent"></div>
          
          {/* Decorative text on image */}
          <div className="absolute bottom-12 left-10 right-[55%] text-white">
            <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">Veetu Rusi</h1>
            <p className="text-teal-50 text-lg font-medium drop-shadow-md">Join us to experience the authentic taste of home.</p>
          </div>
        </div>

        {/* SVG Wave Background */}
        <svg className="absolute inset-0 h-full w-full hidden md:block drop-shadow-2xl" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 40,0 C 10,40 55,60 45,100 L 100,100 L 100,0 Z" fill="white" />
        </svg>

        {/* White background fallback for mobile */}
        <div className="absolute inset-0 bg-white md:hidden"></div>

        {/* Right Form Section - Narrower to not overlap wave */}
        <div className="relative z-10 w-full md:w-[45%] md:ml-auto h-full flex flex-col justify-center px-8 md:px-10 py-10">
          
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Create Account</h2>
            <p className="text-gray-500 text-base font-medium">Register to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                  <User className="h-[18px] w-[18px]" />
                </div>
                <input
                  name="username"
                  type="text"
                  placeholder="e.g. johndoe"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-[15px] placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="e.g. awesome@user.com"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-[15px] placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                  <Phone className="h-[18px] w-[18px]" />
                </div>
                <input
                  name="phone"
                  type="text"
                  placeholder="e.g. +1 234 567 890"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-[15px] placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-[15px] placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-500 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">Confirm</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-[15px] placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-500 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full max-w-[220px] mx-auto block py-3 mt-6 rounded-2xl text-white font-bold text-[17px] bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(20,184,166,0.6)]"
            >
              Sign Up
            </button>

            <p className="text-center text-[15px] text-gray-500 mt-6 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-teal-600 font-bold hover:text-teal-500 hover:underline underline-offset-4 transition-colors">
                Log In!
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;