const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['delivery_partner']));

// Get dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    
    // Get total deliveries
    const [deliveries] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE delivery_partner = ? AND status = "Delivered"',
      [deliveryBoyId]
    );
    
    // Get pending deliveries
    const [pending] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE delivery_partner = ? AND status IN ("Out for Delivery", "Assigned")',
      [deliveryBoyId]
    );

    // Mock earnings for now, you can link to an earnings table later
    const totalEarnings = deliveries[0].count * 50; 
    const todayEarnings = 0; // calculate properly if date available

    res.json({
      cards: {
        totalDeliveries: deliveries[0].count,
        pendingDeliveries: pending[0].count,
        totalEarnings,
        todayEarnings
      }
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get assigned orders
router.get('/orders', async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const { status } = req.query;
    
    let query = 'SELECT * FROM user_food_order_table WHERE delivery_partner = ?';
    const params = [deliveryBoyId];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ordered_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Orders Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/orders/available', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM user_food_order_table
       WHERE status = 'Pending'
         AND (delivery_partner IS NULL OR delivery_partner = '')
       ORDER BY ordered_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Available Orders Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/orders/:id/assign', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deliveryBoyId = req.user.id || req.user.user_id || null;
    const [result] = await pool.execute(
      `UPDATE user_food_order_table
       SET status = 'Assigned', delivery_partner = ?, updated_at = NOW()
       WHERE id = ?
         AND status = 'Pending'
         AND (delivery_partner IS NULL OR delivery_partner = '')`,
      [deliveryBoyId, orderId]
    );

    if (!result.affectedRows) {
      return res.status(409).json({ message: 'This order has already been assigned.' });
    }

    res.json({ message: 'Order assigned successfully.' });
  } catch (err) {
    console.error('Assign Order Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
