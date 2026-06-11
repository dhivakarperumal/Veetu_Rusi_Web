import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Clock, CreditCard, X } from "lucide-react";

const SubscriptionAlert = ({ isOpen, subscriptionInfo, onClose, onBuyClick }) => {
  if (!isOpen || !subscriptionInfo) return null;

  const { isExpired, daysRemaining, status } = subscriptionInfo;
  const isExpiredOrInactive = isExpired || status !== "Active" || daysRemaining === 0 || daysRemaining == null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 scale-100 border border-white/20">
        {/* Header */}
        <div
          className={`px-8 py-10 text-center relative overflow-hidden ${
            isExpiredOrInactive
              ? "bg-gradient-to-br from-red-600 via-red-500 to-rose-600"
              : "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600"
          }`}
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex justify-center mb-5">
            <div className={`p-4 rounded-full bg-white/20 shadow-inner backdrop-blur-sm border border-white/30 ${isExpiredOrInactive ? "animate-bounce" : "animate-pulse"}`}>
              {isExpiredOrInactive ? (
                <AlertCircle className="w-14 h-14 text-white drop-shadow-md" />
              ) : (
                <Clock className="w-14 h-14 text-white drop-shadow-md" />
              )}
            </div>
          </div>
          <h2 className="relative z-10 text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">
            {isExpiredOrInactive ? "Subscription Expired" : "Expiring Soon"}
          </h2>
          <p className="relative z-10 text-white/95 text-sm font-medium px-4">
            {isExpiredOrInactive
              ? "Your access has been restricted. Please renew to continue using all features."
              : `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 bg-gray-50/50">
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3 flex-col sm:flex-row">
              <div className={`p-2 rounded-xl flex-shrink-0 ${isExpiredOrInactive ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base mb-1">
                  {isExpiredOrInactive
                    ? "Action Required"
                    : "Limited Time to Renew"}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {isExpiredOrInactive
                    ? "Your account access is restricted. Purchase a plan to restore full functionality immediately."
                    : "Renew your subscription now to avoid service interruption. Choose from our flexible plans."}
                </p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mb-8 pt-6 border-t border-gray-200/60">
            <div className="space-y-4">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 font-medium">Current Status</span>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
                    isExpiredOrInactive ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {status}
                </span>
              </div>
              {daysRemaining !== null && !isExpiredOrInactive && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500 font-medium">Days Remaining</span>
                  <span className="font-extrabold text-lg text-blue-600">
                    {daysRemaining}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onBuyClick}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <CreditCard className="w-5 h-5" />
              {isExpiredOrInactive ? "View Subscription Plans" : "Renew Subscription Now"}
            </button>

            {!isExpiredOrInactive && (
              <button
                onClick={onClose}
                className="w-full bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-800 font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Maybe Later
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {!isExpiredOrInactive && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SubscriptionAlert;
