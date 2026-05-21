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
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Login failed");
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
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.response?.data?.message || error.message || "Google Login Failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-900 font-sans">
      {/* Blurred background image layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm scale-110"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80')" }}
      ></div>
      <div className="absolute inset-0 bg-[#278679]/70 mix-blend-multiply"></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[850px] h-[520px] bg-white rounded shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex">
        
        {/* Left Image Section (Background of the card) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center hidden md:block"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80')" }}
        >
          {/* Teal Overlay matching the design */}
          <div className="absolute inset-0 bg-[#278679]/80 mix-blend-multiply"></div>
        </div>

        {/* SVG Wave Background (Visible only on desktop) */}
        <svg className="absolute inset-0 h-full w-full hidden md:block" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 45,0 C 25,40 75,60 50,100 L 100,100 L 100,0 Z" fill="white" />
        </svg>

        {/* White background fallback for mobile */}
        <div className="absolute inset-0 bg-white md:hidden"></div>

        {/* Right Form Section */}
        <div className="relative z-10 w-full md:w-[50%] md:ml-auto h-full flex flex-col justify-center px-8 md:px-10">
          
          <div className="text-center mb-8">
            <h2 className="text-[2.2rem] font-normal text-gray-700 mb-1 tracking-wide">Welcome</h2>
            <p className="text-gray-400 text-[13px]">Log in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                name="identifier"
                type="text"
                placeholder="awesome@user.com"
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-[10px] rounded-full border border-gray-200 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:border-[#3cd5b8] focus:ring-1 focus:ring-[#3cd5b8] transition-colors"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••••••••••"
                onChange={handleChange}
                className="w-full pl-11 pr-11 py-[10px] rounded-full border border-gray-200 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:border-[#3cd5b8] focus:ring-1 focus:ring-[#3cd5b8] transition-colors tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-[11px] text-gray-400 hover:text-[#3cd5b8] transition-colors underline-offset-2">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full max-w-[140px] mx-auto block py-2 mt-4 rounded-full text-white text-[15px] bg-[#3cd5b8] hover:bg-[#34bc9f] transition-colors"
            >
              Log In
            </button>

            <p className="text-center text-[13px] text-gray-400 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#c2c2c2] hover:text-[#3cd5b8] underline underline-offset-2 transition-colors">
                Sign up!
              </Link>
            </p>

            {/* Social Icons & Google Login */}
            <div className="mt-8 flex flex-col items-center space-y-5">
              <div className="flex justify-center space-x-6 text-[#b5b5b5]">
                <a href="#" className="hover:text-gray-500 transition-colors"><FaFacebookF className="h-5 w-5" /></a>
                <a href="#" className="hover:text-gray-500 transition-colors"><FaTwitter className="h-5 w-5" /></a>
                <a href="#" className="hover:text-gray-500 transition-colors"><FaLinkedinIn className="h-5 w-5" /></a>
              </div>
              
              <div className="flex justify-center w-full max-w-[200px] overflow-hidden rounded-full border border-gray-200">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => console.log("Login Failed")}
                  theme="outline"
                  size="medium"
                  shape="pill"
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