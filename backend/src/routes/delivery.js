const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['delivery_partner']));

// Get dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const deliveryBoyId = req.user?.user_id || req.user?.id;
    
    // Get total deliveries
    const [deliveries] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = "Delivered"',
      [deliveryBoyId, deliveryBoyId]
    );
    
    // Get pending deliveries
    const [pending] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status IN ("Out for Delivery", "Assigned", "Picked Up")',
      [deliveryBoyId, deliveryBoyId]
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
    const deliveryBoyId = req.user?.user_id || req.user?.id;
    const { status } = req.query;
    
    let query = 'SELECT * FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?)';
    const params = [deliveryBoyId, deliveryBoyId];

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
    // Prioritize user_id (e.g. 'DEL-xxx') because req.user.id might be the ID from the global users table.
    const deliveryBoyId = req.user?.user_id || req.user?.id;

    // Fetch the delivery partner to find their franchise admin (created_by)
    const [dpRows] = await pool.execute(
      'SELECT created_by FROM delivery_partners WHERE user_id = ? OR id = ? OR delivery_partner_code = ? LIMIT 1',
      [deliveryBoyId, deliveryBoyId, deliveryBoyId]
    );

    let franchiseAdminId = null;
    if (dpRows.length > 0 && dpRows[0].created_by) {
      franchiseAdminId = dpRows[0].created_by;
    }

    console.log(`[orders/available] User: ${deliveryBoyId}, Found FranchiseAdminId: ${franchiseAdminId}`);

    let query = `
      SELECT o.* 
      FROM user_food_order_table o
      LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id)
      WHERE o.status = 'Searching Delivery Partner'
        AND (o.delivery_partner IS NULL OR o.delivery_partner = '')
    `;
    const params = [];

    // If the delivery partner was created by a franchise admin, only show orders from the same franchise admin
    if (franchiseAdminId) {
      query += ` AND (c.created_by = ? OR o.franchise_user_id = ?)`;
      params.push(franchiseAdminId, franchiseAdminId);
    } else {
      // If the delivery boy has NO franchise admin, DO NOT show any franchise orders.
      // E.g., c.created_by IS NULL
      query += ` AND c.created_by IS NULL AND o.franchise_user_id IS NULL`;
    }

    query += ` ORDER BY o.ordered_at DESC`;

    console.log(`[orders/available] Query: ${query}, Params:`, params);

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Available Orders Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/orders/:id/assign', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { latitude, longitude, pincode, area, district } = req.body || {};
    // Prioritize user_id (e.g. 'DEL-xxx') to avoid global user ID mismatches
    const deliveryBoyId = req.user?.user_id || req.user?.id || null;

    // First, look up the delivery partner's details
    console.log('🔍 [Assignment] Looking up delivery partner with id:', deliveryBoyId);
    const [partnerResult] = await pool.execute(
      `SELECT dp.name, dp.mobile, dp.user_id
       FROM delivery_partners dp
       LEFT JOIN users u ON u.user_id = dp.user_id
       WHERE dp.user_id = ? OR dp.delivery_partner_user_id = ? OR u.id = ? OR dp.id = ?
       LIMIT 1`,
      [deliveryBoyId, deliveryBoyId, deliveryBoyId, deliveryBoyId]
    );

    const partnerName = partnerResult[0]?.name || '';
    const partnerPhone = partnerResult[0]?.mobile || '';
    const partnerUserId = partnerResult[0]?.user_id || deliveryBoyId;

    const [result] = await pool.execute(
      `UPDATE user_food_order_table
       SET status = 'Delivery Partner Assigned',
           delivery_partner = ?,
           delivery_partner_user_id = ?,
           delivery_partner_name = ?,
           delivery_partner_phone = ?,
           updated_at = NOW()
       WHERE id = ?
         AND status = 'Searching Delivery Partner'
         AND (delivery_partner IS NULL OR delivery_partner = '')`,
      [deliveryBoyId, partnerUserId, partnerName, partnerPhone, orderId]
    );

    if (!result.affectedRows) {
      return res.status(409).json({ message: 'This order has already been assigned.' });
    }

    // Insert initial tracking record
    const [orderRows] = await pool.execute('SELECT order_id, user_id, customer_name, customer_email, items FROM user_food_order_table WHERE id = ?', [orderId]);
    if (orderRows.length > 0) {
      const realOrderId = orderRows[0].order_id;
      const orderUserId = orderRows[0].user_id || null;
      const orderUserName = orderRows[0].customer_name || null;
      const orderUserEmail = orderRows[0].customer_email || null;
      const orderedItems = JSON.stringify(orderRows[0].items || []);

      await pool.execute(
        `INSERT INTO delivery_live_tracking (
           order_id, delivery_partner_user_id, delivery_partner_name, delivery_partner_phone,
           user_id, user_name, user_mail_id, ordered_product_details,
           latitude, longitude, pincode, area, district
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           delivery_partner_user_id = VALUES(delivery_partner_user_id),
           delivery_partner_name = VALUES(delivery_partner_name),
           delivery_partner_phone = VALUES(delivery_partner_phone),
           user_id = VALUES(user_id),
           user_name = VALUES(user_name),
           user_mail_id = VALUES(user_mail_id),
           ordered_product_details = VALUES(ordered_product_details),
           latitude = VALUES(latitude),
           longitude = VALUES(longitude),
           pincode = VALUES(pincode),
           area = VALUES(area),
           district = VALUES(district),
           updated_at = CURRENT_TIMESTAMP`,
        [realOrderId, partnerUserId, partnerName, partnerPhone, orderUserId, orderUserName, orderUserEmail, orderedItems, latitude || null, longitude || null, pincode || null, area || null, district || null]
      );
      console.log('✅ [Tracking] Record saved for order:', realOrderId, 'partner:', partnerName);
    }

    res.json({ message: 'Order assigned successfully.' });
  } catch (err) {
    console.error('Assign Order Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get earnings breakdown
router.get('/earnings', async (req, res) => {
  try {
    const deliveryBoyId = req.user?.user_id || req.user?.id;

    // Total earnings (from delivered orders)
    const [totalResult] = await pool.execute(
      `SELECT SUM(total_amount) as total FROM user_food_order_table 
       WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = 'Delivered'`,
      [deliveryBoyId, deliveryBoyId]
    );

    // Today's earnings
    const [todayResult] = await pool.execute(
      `SELECT SUM(total_amount) as today FROM user_food_order_table 
       WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = 'Delivered' AND DATE(updated_at) = CURDATE()`,
      [deliveryBoyId, deliveryBoyId]
    );

    // Weekly earnings (last 7 days)
    const [weeklyResult] = await pool.execute(
      `SELECT SUM(total_amount) as weekly FROM user_food_order_table 
       WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = 'Delivered' AND DATE(updated_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [deliveryBoyId, deliveryBoyId]
    );

    // Earnings by day (last 14 days)
    const [dailyResult] = await pool.execute(
      `SELECT DATE(updated_at) as date, COUNT(*) as deliveries, SUM(total_amount) as amount
       FROM user_food_order_table 
       WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = 'Delivered' AND DATE(updated_at) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY DATE(updated_at) ORDER BY date DESC`,
      [deliveryBoyId, deliveryBoyId]
    );

    // Recent completed orders
    const [recentOrders] = await pool.execute(
      `SELECT id, order_id, customer_name, customer_phone, total_amount, updated_at, status
       FROM user_food_order_table 
       WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = 'Delivered'
       ORDER BY updated_at DESC LIMIT 20`,
      [deliveryBoyId, deliveryBoyId]
    );

    res.json({
      totals: {
        totalEarnings: totalResult[0]?.total || 0,
        todayEarnings: todayResult[0]?.today || 0,
        weeklyEarnings: weeklyResult[0]?.weekly || 0
      },
      dailyEarnings: dailyResult || [],
      recentDeliveries: recentOrders || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Live Tracking
router.post('/tracking/update', async (req, res) => {
  try {
    const deliveryBoyId = req.user.id || req.user.user_id;
    const { order_id, latitude, longitude, pincode, area, district } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Fetch delivery boy details
    const [partnerResult] = await pool.execute('SELECT name, mobile FROM delivery_partners WHERE user_id = ?', [deliveryBoyId]);
    const name = partnerResult[0]?.name || '';
    const phone = partnerResult[0]?.mobile || '';

    // Upsert tracking data
    const query = `
      INSERT INTO delivery_live_tracking 
      (order_id, delivery_partner_user_id, delivery_partner_name, delivery_partner_phone, latitude, longitude, pincode, area, district) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      latitude = VALUES(latitude), 
      longitude = VALUES(longitude),
      pincode = VALUES(pincode),
      area = VALUES(area),
      district = VALUES(district),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await pool.execute(query, [
      order_id, deliveryBoyId, name, phone, 
      latitude || null, longitude || null, pincode || null, area || null, district || null
    ]);

    res.json({ message: 'Tracking updated successfully' });
  } catch (err) {
    console.error('Update Tracking Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;
