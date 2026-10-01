const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { verifyTokenWithoutSubscription } = require('../middleware/authMiddleware');
const { getAssignedRazorpayConfig, getUserCheckoutRazorpayConfig } = require('../utils/razorpayConfig');

const router = express.Router();
router.use(verifyTokenWithoutSubscription);

const getPaymentConfig = (req) => req.body?.payment_profile === 'user_checkout'
  ? getUserCheckoutRazorpayConfig()
  : getAssignedRazorpayConfig(req.user?.id || req.user?.user_id);

const isConfigurationError = (error) => [
  'Razorpay payment configuration is not assigned for this account.',
  'Razorpay User Checkout key is not configured or active.',
].includes(error.message);

router.post('/order', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const currency = String(req.body.currency || 'INR').toUpperCase();
    if (!Number.isSafeInteger(amount) || amount < 100 || !/^[A-Z]{3}$/.test(currency)) {
      return res.status(400).json({ message: 'A valid amount (in paise) and currency are required.' });
    }
    const config = await getPaymentConfig(req);
    const razorpay = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `vr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    });
    res.json({ order, key_id: config.keyId });
  } catch (error) {
    const needsConfiguration = isConfigurationError(error);
    const razorpayRejectedKey = Number(error.statusCode) === 401;
    console.error('Razorpay order creation failed:', error.message, error.statusCode || '');
    const status = needsConfiguration ? 400 : razorpayRejectedKey ? 502 : 500;
    const message = needsConfiguration
      ? error.message
      : razorpayRejectedKey
        ? 'Razorpay rejected the configured User Checkout key. Verify that the Key ID and Key Secret belong to the same Razorpay account.'
        : 'Unable to create Razorpay payment order.';
    res.status(status).json({ message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Razorpay payment verification details are required.' });
    }
    const config = await getPaymentConfig(req);
    const expected = crypto.createHmac('sha256', config.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const supplied = Buffer.from(String(razorpay_signature));
    const expectedBuffer = Buffer.from(expected);
    if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) {
      return res.status(400).json({ message: 'Invalid Razorpay payment signature.' });
    }
    res.json({ verified: true });
  } catch (error) {
    const needsConfiguration = isConfigurationError(error);
    res.status(needsConfiguration ? 400 : 500).json({ message: needsConfiguration ? error.message : 'Unable to verify Razorpay payment.' });
  }
});

module.exports = router;