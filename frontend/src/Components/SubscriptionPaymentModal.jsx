import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Left Panel */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white md:w-5/12 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-900/30 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight drop-shadow-md">Choose Your Plan</h2>
            <p className="text-blue-100 text-base leading-relaxed opacity-95">
              Unlock your full potential with our premium artisan tools and features.
            </p>
          </div>
          
          <div className="relative z-10 mt-8 hidden md:block">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" /> Premium Benefits
              </h3>
              <ul className="space-y-3 text-sm text-blue-50 font-medium">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Unlimited Order Processing</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Advanced Business Analytics</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Priority 24/7 Support</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={paymentProcessing}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors disabled:opacity-50 md:hidden bg-black/20 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Panel */}
        <div className="p-6 md:p-8 md:w-7/12 overflow-y-auto bg-gray-50 flex flex-col relative h-full">
          <button
            onClick={onClose}
            disabled={paymentProcessing}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 bg-gray-200/50 hover:bg-gray-200 p-2 rounded-full hidden md:block z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mt-8 md:mt-2">
            {paymentSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Payment Successful!</h3>
                    <p className="text-green-700 text-sm">
                      Your subscription has been activated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-gray-500 font-medium">Loading plans...</p>
                </div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-semibold text-gray-800">No Plans Available</h3>
                <p className="text-gray-500 mt-1">Please check back later or contact support.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                        selectedPlan === plan.id
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100"
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                        className="sr-only"
                        disabled={paymentProcessing}
                      />
                      
                      {/* Custom Radio Button */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                          {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                        </div>
                        {plan.durationDays >= 90 && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Best Value
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold text-indigo-700">₹{plan.amount}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mt-2">
                          {plan.durationDays === 30 ? "Billed Monthly" : plan.durationDays === 90 ? "Billed Quarterly" : plan.durationDays === 365 ? "Billed Annually" : `${plan.durationDays} Days Access`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
                  <div className="text-indigo-500 mt-0.5">💳</div>
                  <p className="text-sm text-indigo-900 leading-relaxed">
                    <strong>Secure Payment:</strong> Transactions are processed securely via Razorpay. You will be redirected to complete the payment.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={paymentProcessing}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={paymentProcessing || !selectedPlan}
                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SubscriptionPaymentModal;
