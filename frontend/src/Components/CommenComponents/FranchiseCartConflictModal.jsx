import React from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";

export default function FranchiseCartConflictModal({
  isOpen,
  existingFranchiseName,
  newFranchiseName,
  newProductName,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 transform transition-all animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <FiX size={20} />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
          <FiAlertTriangle size={28} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
          Replace Cart Items?
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
          Your food cart already contains dishes from{" "}
          <strong className="text-gray-800 font-semibold">
            {existingFranchiseName || "another franchise"}
          </strong>
          .
          <br />
          Because each franchise admin maintains a separate Razorpay payment account, you can only order from{" "}
          <span className="font-semibold text-emerald-700">one franchise admin's home chefs</span> at a time.
        </p>

        {/* Next Item Info Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6 text-xs text-amber-900">
          <p className="font-semibold text-amber-800 mb-1">
            New item to add:
          </p>
          <p className="font-medium text-gray-800">
            {newProductName || "Selected Item"}
          </p>
          {newFranchiseName && (
            <p className="text-gray-500 mt-0.5">
              Franchise: <span className="font-semibold text-gray-700">{newFranchiseName}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer text-sm"
          >
            Keep Current Cart
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <FiTrash2 size={16} />
            Clear & Add
          </button>
        </div>
      </div>
    </div>
  );
}
