const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const plans = require('../config/subscriptions');
const { attachUser } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
require('dotenv').config();

const RAZOR_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.RAZOR_KEY_ID;
const RAZOR_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZOR_KEY_SECRET;

// Get subscription status (requires auth)
router.get('/status', attachUser, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ message: 'Email not found in token' });

    const [rows] = await pool.execute(
      'SELECT id, status, start_date, expiry_date FROM franchise_owners WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows.length) {
      return res.json({ 
        subscription: null, 
        isExpired: false, 
        daysRemaining: null,
        message: 'No subscription found'
      });
    }

    const franchise = rows[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let isExpired = false;
    let daysRemaining = null;
    
    if (franchise.expiry_date) {
      const expiry = new Date(franchise.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      isExpired = expiry < today;
      if (!isExpired) {
        daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      subscription: franchise,
      isExpired,
      daysRemaining,
      status: franchise.status
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Status error', error: err.message });
  }
});

// List available plans
router.get('/plans', (req, res) => {
  res.json(plans);
});

// Create a checkout/order for Razorpay (server-side)
router.post('/checkout', async (req, res) => {
  try {
    const { franchiseId, planId } = req.body;
    if (!franchiseId || !planId) return res.status(400).json({ message: 'franchiseId and planId required' });

    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Create a Razorpay order if keys present
    if (RAZOR_KEY_ID && RAZOR_KEY_SECRET) {
      const razor = new Razorpay({ key_id: RAZOR_KEY_ID, key_secret: RAZOR_KEY_SECRET });
      const amountPaise = Math.round(plan.amount * 100);
      const order = await razor.orders.create({ amount: amountPaise, currency: plan.currency, receipt: `rcpt_${Date.now()}` });
      return res.json({ order, plan, key_id: RAZOR_KEY_ID });
    }

    // Fallback: return plan and fake order id
    return res.json({ order: { id: `TEST_ORDER_${Date.now()}`, amount: plan.amount * 100 }, plan, key_id: RAZOR_KEY_ID });
  } catch (err) {
    console.error('Checkout error:', err);
    const errorMsg = err.error ? err.error.description || err.error.message : err.message;
    res.status(500).json({ message: 'Checkout error', error: errorMsg });
  }
});

// Confirm payment (verifies signature) and activate subscription
router.post('/confirm', async (req, res) => {
  try {
    const { franchiseId, planId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!franchiseId || !planId || !razorpay_payment_id || !razorpay_order_id) return res.status(400).json({ message: 'Missing params' });

    // Verify signature when secret is available
    if (RAZOR_KEY_SECRET && razorpay_signature) {
      const crypto = require('crypto');
      const generated = crypto.createHmac('sha256', RAZOR_KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
      if (generated !== razorpay_signature) return res.status(400).json({ message: 'Invalid signature' });
    }

    // Activate subscription in DB
    const plan = plans.find(p => p.id === planId);
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    await pool.execute("UPDATE franchise_owners SET status = 'Active', start_date = ?, expiry_date = ? WHERE id = ?", [
      startDate.toISOString().slice(0,10), expiryDate.toISOString().slice(0,10), franchiseId
    ]);

    // Optionally insert invoice record (create invoices table if needed)

    res.json({ message: 'Subscription activated', start_date: startDate, expiry_date: expiryDate });
  } catch (err) {
    console.error('Confirm error', err);
    res.status(500).json({ message: 'Confirm error', error: err.message });
  }
});

module.exports = router;
