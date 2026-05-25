import React, { useState } from "react";
import { AlertCircle, Clock, CreditCard, X } from "lucide-react";

const SubscriptionAlert = ({ isOpen, subscriptionInfo, onClose, onBuyClick }) => {
  if (!isOpen || !subscriptionInfo) return null;

  const { isExpired, daysRemaining, status } = subscriptionInfo;
  const isExpiredOrInactive = isExpired || status !== "Active";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div
          className={`px-6 py-8 text-center ${
            isExpiredOrInactive
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-amber-500 to-amber-600"
          }`}
        >
          <div className="flex justify-center mb-4">
            {isExpiredOrInactive ? (
              <AlertCircle className="w-12 h-12 text-white" />
            ) : (
              <Clock className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isExpiredOrInactive ? "Subscription Expired" : "Subscription Expiring Soon"}
          </h2>
          <p className="text-red-100 text-sm">
            {isExpiredOrInactive
              ? "Your subscription has ended. Please renew to continue."
              : `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  {isExpiredOrInactive
                    ? "Action Required"
                    : "Limited Time to Renew"}
                </p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {isExpiredOrInactive
                    ? "Your account access is restricted. Purchase a plan to restore full functionality immediately."
                    : "Renew your subscription now to avoid service interruption. Choose from our flexible plans."}
                </p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mb-6 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Status</span>
                <span
                  className={`font-semibold ${
                    isExpiredOrInactive ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {status}
                </span>
              </div>
              {daysRemaining !== null && !isExpiredOrInactive && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Days Remaining</span>
                  <span className="font-semibold text-blue-600">
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <CreditCard className="w-5 h-5" />
              {isExpiredOrInactive ? "Buy Full Subscription" : "Renew Subscription"}
            </button>

            {!isExpiredOrInactive && (
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200"
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
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionAlert;
