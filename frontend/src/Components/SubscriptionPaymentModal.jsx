import React, { useState, useEffect } from "react";
import { X, Loader, CheckCircle, AlertCircle } from "lucide-react";
import api from "../api";
import { toast } from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";

const SubscriptionPaymentModal = ({ isOpen, onClose, franchiseId }) => {
  const { email: userEmail } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch available plans
  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscriptions/plans");
      setPlans(res.data);
      if (res.data.length > 0) {
        setSelectedPlan(res.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !razorpayLoaded) {
      toast.error("Please select a plan first");
      return;
    }

    try {
      setPaymentProcessing(true);

      // Create checkout order
      const checkoutRes = await api.post("/subscriptions/checkout", {
        franchiseId,
        planId: selectedPlan,
      });

      const { order, plan, key_id } = checkoutRes.data;

      if (!key_id) {
        // Fallback for testing without Razorpay
        toast.success("Demo mode: Subscription activated for testing");
        setPaymentSuccess(true);
        setTimeout(() => {
          onClose();
          setPaymentSuccess(false);
        }, 2000);
        return;
      }

      // Open Razorpay payment modal
      const options = {
        key: key_id,
        amount: order.amount,
        currency: plan.currency,
        name: "Veetu Rusi",
        description: `${plan.name} Subscription`,
        ...(order.id && !order.id.startsWith("TEST_") ? { order_id: order.id } : {}),
        handler: async (response) => {
          try {
            // Confirm payment with backend
            const confirmRes = await api.post("/subscriptions/confirm", {
              franchiseId,
              planId: selectedPlan,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Subscription activated successfully!");
            setPaymentSuccess(true);
            setTimeout(() => {
              onClose();
              setPaymentSuccess(false);
              // Refresh page to update subscription status
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error("Payment confirmation error:", error);
            toast.error("Payment confirmation failed. Please try again.");
          }
        },
        prefill: {
          name: "Franchise Owner",
          email: userEmail || "",
          contact: "",
        },
        notes: {
          franchiseId,
          planId: selectedPlan,
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      const backendError = error.response?.data?.error || error.response?.data?.message || "Failed to initiate payment.";
      toast.error(backendError);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-blue-100 text-sm mt-1">
              Select a subscription plan to restore full access
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={paymentProcessing}
            className="text-blue-100 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Success Message */}
        {paymentSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Payment Successful!</h3>
                <p className="text-green-700 text-sm">
                  Your subscription has been activated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-gray-600">No subscription plans available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Selection */}
              <div className="grid grid-cols-1 gap-4">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="absolute top-4 left-4"
                      disabled={paymentProcessing}
                    />
                    <div className="pl-8">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{plan.amount}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {plan.durationDays} days access
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {plan.durationDays === 30 ? "per month" : plan.durationDays === 90 ? "per quarter" : plan.durationDays === 365 ? "per year" : `${plan.durationDays} day${plan.durationDays > 1 ? "s" : ""} access`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Payment Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-xs text-blue-900">
                  💳 <strong>Note:</strong> Payments are processed securely through
                  Razorpay. You will be redirected to complete payment after clicking "Proceed to Payment".
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  disabled={paymentProcessing}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentProcessing || !selectedPlan}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentModal;
