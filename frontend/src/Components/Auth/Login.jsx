import { useState, useContext } from "react";
import api from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);

      login(res.data.user, res.data.token);
      toast.success("Login successful!");

      if (res.data.user.role === "superadmin") {
        navigate("/superadmin");
      } else if (res.data.user.role === "admin") {
        navigate("/admin");
      } else if (res.data.user.role === "delivery_partner") {
        navigate("/delivery");
      } else if (res.data.user.role === "homechef" || res.data.user.role === "chef") {
        navigate("/chef");
      }
      else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login Error:", error);

      let errorMessage = error.response?.data?.message || "Login failed";

      // If the user is inactive or deactivated (usually 403)
      if (error.response?.status === 403) {
        const currentTime = new Date().toLocaleString();
        errorMessage = `${errorMessage} (Login attempt at: ${currentTime})`;
      }

      toast.error(errorMessage, { position: "top-right" });
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        googleId: decoded.sub
      };

      const res = await api.post("/auth/google-login", googleUser);
      login(res.data.user, res.data.token);
      toast.success("Google Login Successful!");

      if (res.data.user.role === "superadmin") {
        navigate("/superadmin");
      } else if (res.data.user.role === "admin") {
        navigate("/admin");
      } else if (res.data.user.role === "delivery_partner") {
        navigate("/delivery");
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Google Login Error:", error);

      let errorMessage = error.response?.data?.message || error.message || "Google Login Failed";

      // If the user is inactive or deactivated (usually 403)
      if (error.response?.status === 403) {
        const currentTime = new Date().toLocaleString();
        errorMessage = `${errorMessage} (Login attempt at: ${currentTime})`;
      }

      toast.error(errorMessage, { position: "top-right" });
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

        {/* Left Image Section - Brighter and more vibrant */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center hidden md:block"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80')" }}
        >
          {/* Subtle warm overlay to make food pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-teal-800/20 to-transparent"></div>

          {/* Decorative text on image */}
          <div className="absolute bottom-12 left-12 right-[55%] text-white">
            <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">Veetu Rusi</h1>
            <p className="text-teal-50 text-lg font-medium drop-shadow-md">Experience the authentic taste of home in every bite.</p>
          </div>
        </div>

        {/* SVG Wave Background */}
        <svg className="absolute inset-0 h-full w-full hidden md:block drop-shadow-2xl" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 45,0 C 25,40 75,60 50,100 L 100,100 L 100,0 Z" fill="white" />
        </svg>

        {/* White background fallback for mobile */}
        <div className="absolute inset-0 bg-white md:hidden"></div>

        {/* Right Form Section */}
        <div className="relative z-10 w-full md:w-[50%] md:ml-auto h-full flex flex-col justify-center px-8 md:px-12 py-10">

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 text-base font-medium">Log in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Field with Label */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="identifier"
                  type="text"
                  placeholder="e.g. awesome@user.com"
                  onChange={handleChange}
                  className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field with Label */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-bold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-bold hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-teal-500 text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-teal-500 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full max-w-xs mx-auto block py-3.5 mt-4 rounded-2xl text-white font-bold text-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(20,184,166,0.6)]"
            >
              Log In
            </button>

            <p className="text-center text-base text-gray-500 mt-6 font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="text-teal-600 font-bold hover:text-teal-500 hover:underline underline-offset-4 transition-colors">
                Sign up!
              </Link>
            </p>

            {/* Social Icons & Google Login */}
            <div className="mt-10 flex flex-col items-center space-y-6">
              <div className="flex items-center w-full max-w-xs gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or login with</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="flex justify-center space-x-6 text-gray-400">
                <a href="#" className="hover:text-blue-600 transition-colors transform hover:scale-110"><FaFacebookF className="h-6 w-6" /></a>
                <a href="#" className="hover:text-sky-500 transition-colors transform hover:scale-110"><FaTwitter className="h-6 w-6" /></a>
                <a href="#" className="hover:text-blue-700 transition-colors transform hover:scale-110"><FaLinkedinIn className="h-6 w-6" /></a>
              </div>

              <div className="flex justify-center w-full overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-[1.02]">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => console.log("Login Failed")}
                  theme="outline"
                  size="large"
                  width="300"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;