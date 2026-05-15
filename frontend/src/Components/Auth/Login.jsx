import { useState, useContext } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

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

      if (res.data.user.role === "admin") {
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

      // send to backend
      const res = await api.post(
        "/auth/google-login",
        googleUser
      );

      login(res.data.user, res.data.token);

      toast.success("Google Login Successful!");

      if (res.data.user.role === "admin") {
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-primary via-primary-light to-primary-dark px-4">

      <div className="w-[380px] bg-white border border-border shadow-2xl rounded-2xl px-4 py-8">

        <h2 className="text-3xl font-bold text-center mb-2 text-primary">
          Welcome Back
        </h2>

        {/* LOGO */}
        {/* <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-14 object-contain"
          />
        </div> */}

        <p className="text-center text-muted mb-6 text-sm">
          Login to explore our premium saree collection
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="identifier"
            type="text"
            placeholder="Email or Username"
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full p-3 pr-10 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-semibold bg-primary hover:bg-primary-light hover:scale-[1.02] transition-all duration-300 shadow-lg cursor-pointer"
          >
            Login
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log("Login Failed")}
            />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Login;