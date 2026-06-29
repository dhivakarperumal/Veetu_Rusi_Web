import React, { useState, useEffect } from 'react';
import { FiTag, FiX } from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-hot-toast';

const CouponSection = ({ cartTotal, customerId, onCouponApplied, onCouponRemoved, appliedCoupon }) => {
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCoupons, setShowCoupons] = useState(false);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await api.get('/coupons/available');
                if (data.success) {
                    setAvailableCoupons(data.coupons);
                }
            } catch (error) {
                console.error("Error fetching coupons:", error);
            }
        };
        fetchCoupons();
    }, []);

    const applyCoupon = async (code) => {
        if (!code) {
            toast.error("Please enter a coupon code");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/coupons/validate', {
                code: code,
                cartTotal: cartTotal,
                customerId: customerId,
                cartItems: [] // Pass actual cart items here if needed for product-specific validation later
            });

            if (data.success) {
                toast.success(data.message);
                onCouponApplied({
                    ...data.coupon,
                    discountAmount: data.discountAmount,
                    finalTotal: data.finalTotal
                });
                setCouponCode('');
                setShowCoupons(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid coupon");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyClick = () => {
        applyCoupon(couponCode);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiTag className="text-blue-500" /> Apply Coupon
            </h3>

            {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-green-700">{appliedCoupon.code} applied</div>
                        <div className="text-sm text-green-600">You saved ₹{appliedCoupon.discountAmount.toFixed(2)}</div>
                    </div>
                    <button 
                        onClick={onCouponRemoved}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Remove Coupon"
                    >
                        <FiX size={18} />
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                        <button
                            onClick={handleApplyClick}
                            disabled={loading || !couponCode}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {loading ? 'Applying...' : 'Apply'}
                        </button>
                    </div>

                    {availableCoupons.length > 0 && (
                        <div className="mt-3">
                            <button 
                                onClick={() => setShowCoupons(!showCoupons)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {showCoupons ? 'Hide available coupons' : 'View available coupons'}
                            </button>

                            {showCoupons && (
                                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableCoupons.map((coupon) => (
                                        <div key={coupon.id} className="border border-dashed border-blue-300 bg-blue-50/50 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-800 border-b border-dashed border-gray-300 pb-1 mb-1 inline-block">
                                                    {coupon.code}
                                                </div>
                                                <div className="text-xs text-gray-600 font-medium">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Min. order ₹{coupon.min_order_value}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => applyCoupon(coupon.code)}
                                                disabled={loading}
                                                className="text-xs font-semibold bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition"
                                            >
                                                APPLY
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CouponSection;
