import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

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
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-primary via-primary-light to-primary-dark px-4">

    <div className="w-[450px] bg-white border border-border shadow-2xl rounded-2xl p-8">

      <h2 className="text-3xl font-bold text-center mb-2 text-primary">
        Create Account
      </h2>

      <p className="text-center text-muted mb-6 text-sm">
        Join our premium saree collection store
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
          required
        />

        <input
          name="phone"
          type="text"
          placeholder="Phone Number"
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
          required
        />

        <div className="grid grid-cols-2 gap-4">

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

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              className="w-full p-3 pr-10 rounded-lg bg-white border border-border focus:ring-2 focus:ring-primary-light outline-none"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg text-white font-semibold bg-primary hover:bg-primary-light hover:scale-[1.02] transition-all duration-300 shadow-lg cursor-pointer"
        >
          Register
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            Sign in
          </span>
        </p>

      </form>

    </div>
  </div>
);
}

export default Register;