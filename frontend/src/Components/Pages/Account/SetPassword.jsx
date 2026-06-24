import React, { useContext, useState } from "react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";
import { FiLock, FiKey, FiLoader, FiEye, FiEyeOff, FiShield } from "react-icons/fi";

const SetPassword = () => {
  const { user } = useContext(AuthContext);
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = { 0: "", 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong", 5: "Very Strong" };
  const strengthColor = { 0: "", 1: "bg-red-400", 2: "bg-orange-400", 3: "bg-yellow-400", 4: "bg-green-400", 5: "bg-green-600" };
  const pwdStrength = strength(newPwd);

  const handlePasswordUpdate = async () => {
    if (!currentPwd.trim()) { toast.error("Enter current password"); return; }
    if (newPwd.length < 6)  { toast.error("New password must be at least 6 characters"); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords do not match"); return; }

    try {
      setLoading(true);
      await api.put(`/auth/profile/password`, {
        currentPassword: currentPwd,
        newPassword: newPwd
      });
      toast.success("Password updated successfully");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ label, value, onChange, show, toggle, placeholder }) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="relative">
        <FiLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 text-primary flex items-center justify-center">
            <FiShield size={16} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
            <p className="text-xs text-gray-400">Keep your account secure</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <PasswordField
            label="Current Password"
            value={currentPwd}
            onChange={setCurrentPwd}
            show={showCurrent}
            toggle={() => setShowCurrent(!showCurrent)}
            placeholder="Enter current password"
          />

          <PasswordField
            label="New Password"
            value={newPwd}
            onChange={setNewPwd}
            show={showNew}
            toggle={() => setShowNew(!showNew)}
            placeholder="Enter new password"
          />

          {/* Strength bar */}
          {newPwd && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwdStrength ? strengthColor[pwdStrength] : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <p className={`text-xs font-semibold ${pwdStrength >= 4 ? "text-green-600" : pwdStrength >= 2 ? "text-yellow-500" : "text-red-500"}`}>
                {strengthLabel[pwdStrength]}
              </p>
            </div>
          )}

          <PasswordField
            label="Confirm New Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
            placeholder="Re-enter new password"
          />

          {/* Match indicator */}
          {confirmPwd && (
            <p className={`text-xs font-semibold -mt-2 ${newPwd === confirmPwd ? "text-green-600" : "text-red-500"}`}>
              {newPwd === confirmPwd ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}

          <button
            onClick={handlePasswordUpdate}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <><FiLoader className="animate-spin" size={16} /> Updating...</>
            ) : (
              <><FiKey size={16} /> Update Password</>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-blue-700 mb-3">Password Tips</h3>
        <ul className="space-y-1.5 text-xs text-blue-600">
          <li>• Use at least 8 characters</li>
          <li>• Mix uppercase and lowercase letters</li>
          <li>• Include numbers and special characters (!@#$%)</li>
          <li>• Avoid using your name or email in the password</li>
        </ul>
      </div>
    </div>
  );
};

export default SetPassword;