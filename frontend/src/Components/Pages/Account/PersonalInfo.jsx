import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";

export default function PersonalInfo() {

  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  const handleUpdate = async () => {
    try {

      const res = await api.put(`/auth/profile/${user?.id}`, {
        username: form.username,
        email: form.email,
        phone: form.phone
      });

      toast.success("Profile updated successfully");

    } catch (err) {

      toast.error(err.response?.data?.message || "Failed to update profile");

    }
  };

  return (
    <div className="bg-white border border-primary rounded-2xl p-8 shadow-sm">

      <h2 className="text-2xl font-semibold text-gray-800 mb-8">
        Personal Information
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Username */}
        <div>
          <label className="text-sm text-gray-600 font-medium">
            Username
          </label>

          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full mt-2 border border-primary rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {/* Role */}
        {/* <div>
          <label className="text-sm text-gray-600 font-medium">
            Role
          </label>

          <input
            type="text"
            name="role"
            value={form.role}
            disabled
            className="w-full mt-2 border border-primary bg-gray-100 rounded-lg px-4 py-3"
          />
        </div> */}

        {/* Email */}
        <div>
          <label className="text-sm text-gray-600 font-medium">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="w-full mt-2 border border-primary bg-gray-100 text-gray-500 cursor-not-allowed rounded-lg px-4 py-3"
          />
        </div>

        {/* Phone */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 font-medium">
            Phone
          </label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full mt-2 border border-primary rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleUpdate}
          className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-medium transition shadow-sm"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}