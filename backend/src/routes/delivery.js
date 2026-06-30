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
    
    // Get total deliveries (Delivered)
    const [deliveries] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = "Delivered"',
      [deliveryBoyId, deliveryBoyId]
    );
    
    // Get pending deliveries
    const [pending] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status IN ("Out for Delivery", "Delivery Partner Assigned", "Picked Up")',
      [deliveryBoyId, deliveryBoyId]
    );

    // Cancelled orders (assigned to this partner)
    const [cancelled] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = "Cancelled"',
      [deliveryBoyId, deliveryBoyId]
    );

    // Orders today (all statuses for this partner)
    const [ordersToday] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND DATE(ordered_at) = CURDATE()',
      [deliveryBoyId, deliveryBoyId]
    );

    // Completed today
    const [completedToday] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status = "Delivered" AND DATE(ordered_at) = CURDATE()',
      [deliveryBoyId, deliveryBoyId]
    );

    // Pending today
    const [pendingToday] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_food_order_table WHERE (delivery_partner = ? OR delivery_partner_user_id = ?) AND status IN ("Out for Delivery", "Delivery Partner Assigned", "Picked Up") AND DATE(ordered_at) = CURDATE()',
      [deliveryBoyId, deliveryBoyId]
    );


    // Latest live tracking entry for this partner
    const [trackingResult] = await pool.execute(
      'SELECT latitude, longitude, area, district, pincode, updated_at FROM delivery_live_tracking WHERE delivery_partner_user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [deliveryBoyId]
    );

    // Count of active tracking entries (distinct active orders being tracked)
    const [activeTracking] = await pool.execute(
      'SELECT COUNT(*) as count FROM delivery_live_tracking WHERE delivery_partner_user_id = ? AND status = "Active"',
      [deliveryBoyId]
    );

    // Real wallet balance from dp_earnings_history (net credited amount)
    let walletBalance = 0;
    let todayNetEarnings = 0;
    let totalNetEarnings = 0;
    let totalDistanceKm = 0;
    try {
      const [walletRows] = await pool.execute(
        'SELECT COALESCE(wallet_balance, 0) as balance FROM delivery_partners WHERE user_id = ? LIMIT 1',
        [deliveryBoyId]
      );
      walletBalance = parseFloat(walletRows[0]?.balance || 0);

      const [todayEarningsRow] = await pool.execute(
        'SELECT COALESCE(SUM(net_earnings), 0) as total FROM dp_earnings_history WHERE delivery_partner_user_id = ? AND DATE(created_at) = CURDATE()',
        [deliveryBoyId]
      );
      todayNetEarnings = parseFloat(todayEarningsRow[0]?.total || 0);

      const [totalEarningsRow] = await pool.execute(
        'SELECT COALESCE(SUM(net_earnings), 0) as total FROM dp_earnings_history WHERE delivery_partner_user_id = ?',
        [deliveryBoyId]
      );
      totalNetEarnings = parseFloat(totalEarningsRow[0]?.total || 0);

      // Total distance from all completed deliveries for this partner
      const [distRow] = await pool.execute(
        `SELECT COALESCE(SUM(dlt.total_distance_km), 0) as total_km
         FROM delivery_live_tracking dlt
         WHERE dlt.delivery_partner_user_id = ? AND dlt.status = 'Completed'`,
        [deliveryBoyId]
      );
      totalDistanceKm = parseFloat(distRow[0]?.total_km || 0);
    } catch (e) {
      console.error('Error fetching DP wallet/distance stats:', e.message);
    }

    res.json({
      cards: {
        ordersToday: ordersToday[0].count,
        completed: completedToday[0].count,
        pending: pendingToday[0].count,
        cancelled: cancelled[0].count,
        totalDeliveries: deliveries[0].count,
        pendingDeliveries: pending[0].count,
        todayEarnings: todayNetEarnings,
        totalEarnings: totalNetEarnings,
        walletBalance,
        rating: 4.9,
        acceptanceRate: 96,
        completionRate: completedToday[0].count > 0
          ? Math.round((completedToday[0].count / Math.max(ordersToday[0].count, 1)) * 100)
          : 0,
        onlineTime: "0h 0m",
        distanceTravelled: parseFloat(totalDistanceKm.toFixed(2)),
        activeTrackingCount: activeTracking[0].count,
        lastLocation: trackingResult[0] || null
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
    
    let query = `
      SELECT o.*,
             c.latitude AS home_chef_lat,
             c.longitude AS home_chef_lng,
             u.latitude AS customer_lat,
             u.longitude AS customer_lng
        FROM user_food_order_table o
        LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id)
        LEFT JOIN users u ON o.user_id = u.user_id
       WHERE (o.delivery_partner = ? OR o.delivery_partner_user_id = ?) 
         AND DATE(o.ordered_at) = CURDATE()
    `;
    const params = [deliveryBoyId, deliveryBoyId];

    if (status && status !== 'All') {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.ordered_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Orders Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/orders/available', async (req, res) => {
  try {
    const deliveryBoyId = req.user?.user_id || req.user?.id;

    // ── Step 1: Try to find franchise/admin context from delivery_partners table ──
    let franchiseAdminId = null;
    try {
      const [dpRows] = await pool.execute(
        `SELECT created_by FROM delivery_partners
          WHERE user_id = ? OR delivery_partner_user_id = ? OR id = ?
          LIMIT 1`,
        [deliveryBoyId, deliveryBoyId, deliveryBoyId]
      );
      if (dpRows.length > 0 && dpRows[0].created_by) {
        franchiseAdminId = dpRows[0].created_by;
      }
    } catch (e) {
      console.warn('[orders/available] delivery_partners lookup failed:', e.message);
    }

    // ── Step 2: Fallback — check users table for franchise context ──
    if (!franchiseAdminId) {
      try {
        const [userRows] = await pool.execute(
          `SELECT created_by, franchise_user_id
             FROM users
            WHERE user_id = ? AND role = 'delivery_partner'
            LIMIT 1`,
          [deliveryBoyId]
        );
        if (userRows.length > 0) {
          franchiseAdminId =
            userRows[0].franchise_user_id || userRows[0].created_by || null;
        }
      } catch (e) {
        console.warn('[orders/available] users franchise lookup failed:', e.message);
      }
    }

    console.log(`[orders/available] deliveryBoyId: ${deliveryBoyId}, franchiseAdminId: ${franchiseAdminId}`);

    // ── Step 3: Build query ────────────────────────────────────────────────────
    // Base: orders that are awaiting a delivery partner (unassigned)
    let query = `
      SELECT o.*,
             c.name           AS home_chef_name,
             c.mobile         AS home_chef_phone,
             c.kitchen_address AS home_chef_address,
             c.latitude       AS home_chef_lat,
             c.longitude      AS home_chef_lng
        FROM user_food_order_table o
        LEFT JOIN home_chefs c ON (o.chef_id = c.id OR o.chef_user_id = c.user_id)
       WHERE o.status IN ('Searching Delivery Partner', 'Order Placed', 'Accepted')
         AND (o.delivery_partner IS NULL OR o.delivery_partner = '')
         AND (o.delivery_partner_user_id IS NULL OR o.delivery_partner_user_id = '')
         AND DATE(o.ordered_at) = CURDATE()
    `;
    const params = [];

    if (franchiseAdminId) {
      // Show orders that belong to the same franchise admin
      // (either by chef's created_by or order's franchise_user_id)
      query += ` AND (
        c.created_by = ?
        OR o.franchise_user_id = ?
        OR c.created_by IS NULL
      )`;
      params.push(franchiseAdminId, franchiseAdminId);
    }
    // If no franchise context found → show ALL unassigned orders (no extra filter)

    query += ` ORDER BY o.ordered_at DESC LIMIT 100`;

    console.log(`[orders/available] Params:`, params);

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
         AND status IN ('Searching Delivery Partner', 'Order Placed', 'Accepted', 'Preparing', 'Food Ready')
         AND (delivery_partner IS NULL OR delivery_partner = '')`,
      [deliveryBoyId, partnerUserId, partnerName, partnerPhone, orderId]
    );

    if (!result.affectedRows) {
      return res.status(409).json({ message: 'This order has already been assigned.' });
    }

    // Insert initial tracking record with pickup (chef) and dropoff (customer) coordinates
    const [orderRows] = await pool.execute(
      `SELECT o.order_id, o.user_id, o.customer_name, o.customer_email, o.items,
              COALESCE(hc.latitude, chef_u.latitude) AS pickup_lat,
              COALESCE(hc.longitude, chef_u.longitude) AS pickup_lng,
              cust_u.latitude AS dropoff_lat,
              cust_u.longitude AS dropoff_lng
       FROM user_food_order_table o
       LEFT JOIN users chef_u ON chef_u.user_id = o.chef_user_id
       LEFT JOIN home_chefs hc ON (hc.user_id = o.chef_user_id OR hc.id = o.chef_id)
       LEFT JOIN users cust_u ON cust_u.user_id = o.user_id
       WHERE o.id = ? LIMIT 1`,
      [orderId]
    );
    if (orderRows.length > 0) {
      const orderData = orderRows[0];
      const realOrderId = orderData.order_id;
      const orderUserId = orderData.user_id || null;
      const orderUserName = orderData.customer_name || null;
      const orderUserEmail = orderData.customer_email || null;
      const orderedItems = JSON.stringify(orderData.items || []);

      const pickupLat = orderData.pickup_lat ? parseFloat(orderData.pickup_lat) : null;
      const pickupLng = orderData.pickup_lng ? parseFloat(orderData.pickup_lng) : null;
      const dropoffLat = orderData.dropoff_lat ? parseFloat(orderData.dropoff_lat) : null;
      const dropoffLng = orderData.dropoff_lng ? parseFloat(orderData.dropoff_lng) : null;

      // Calculate straight-line distance (Haversine) between pickup and dropoff
      let distanceKm = null;
      if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
        const R = 6371; // Earth radius in km
        const dLat = (dropoffLat - pickupLat) * Math.PI / 180;
        const dLon = (dropoffLng - pickupLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(pickupLat * Math.PI / 180) * Math.cos(dropoffLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = parseFloat((R * c).toFixed(3));
      }

      await pool.execute(
        `INSERT INTO delivery_live_tracking (
           order_id, delivery_partner_user_id, delivery_partner_name, delivery_partner_phone,
           user_id, user_name, user_mail_id, ordered_product_details,
           latitude, longitude, pincode, area, district,
           pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude, total_distance_km
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
           pickup_latitude = VALUES(pickup_latitude),
           pickup_longitude = VALUES(pickup_longitude),
           dropoff_latitude = VALUES(dropoff_latitude),
           dropoff_longitude = VALUES(dropoff_longitude),
           total_distance_km = VALUES(total_distance_km),
           updated_at = CURRENT_TIMESTAMP`,
        [
          realOrderId, partnerUserId, partnerName, partnerPhone,
          orderUserId, orderUserName, orderUserEmail, orderedItems,
          latitude || pickupLat || null, longitude || pickupLng || null,
          pincode || null, area || null, district || null,
          pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm
        ]
      );
      console.log(`✅ [Tracking] Record saved for order: ${realOrderId}, partner: ${partnerName}, distance: ${distanceKm ?? 'unknown'} km`);
    }

    res.json({ message: 'Order assigned successfully.' });
  } catch (err) {
    console.error('Assign Order Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (Picked Up → Out for Delivery → Delivered)
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deliveryBoyId = req.user?.user_id || req.user?.id;
    const { status } = req.body;

    const allowedStatuses = ['Picked Up', 'Out for Delivery', 'Delivered'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    // Only allow updating orders assigned to this delivery partner
    const [result] = await pool.execute(
      `UPDATE user_food_order_table 
       SET status = ?, updated_at = NOW()
       WHERE id = ? AND (delivery_partner = ? OR delivery_partner_user_id = ?)`,
      [status, orderId, deliveryBoyId, deliveryBoyId]
    );

    if (!result.affectedRows) {
      return res.status(403).json({ message: 'Order not found or not assigned to you.' });
    }

    // Update tracking status
    if (status === 'Delivered') {
      // Mark tracking as completed
      await pool.execute(
        `UPDATE delivery_live_tracking SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
         WHERE order_id = (SELECT order_id FROM user_food_order_table WHERE id = ? LIMIT 1)`,
        [orderId]
      ).catch(() => {}); // non-critical

      // Auto-calculate and credit DP earnings
      try {
        const dpEarningsController = require('../controllers/dpEarningsController');
        const [orderRows] = await pool.execute('SELECT order_id FROM user_food_order_table WHERE id = ? LIMIT 1', [orderId]);
        if (orderRows.length > 0) {
          const result = await dpEarningsController.calculateAndCreditEarnings(orderRows[0].order_id, deliveryBoyId);
          console.log(`[Earnings via DP] Order ${orderRows[0].order_id} earnings:`, result);
        }
      } catch (calcErr) {
        console.error('DP earnings calculation failed (non-critical):', calcErr.message);
      }
    }

    console.log(`✅ [Status Update] Order #${orderId} → ${status} by ${deliveryBoyId}`);
    res.json({ message: `Order status updated to "${status}" successfully.` });
  } catch (err) {
    console.error('Status Update Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/earnings', async (req, res) => {
  try {
    const deliveryBoyId = req.user?.user_id || req.user?.id;

    // Ensure tables exist (safe guard for first-run before backend restart)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS dp_earnings_history (
          id INT PRIMARY KEY AUTO_INCREMENT,
          delivery_partner_user_id VARCHAR(255) NOT NULL,
          order_id VARCHAR(100),
          base_pay DECIMAL(10,2) DEFAULT 0.00,
          distance_pay DECIMAL(10,2) DEFAULT 0.00,
          waiting_pay DECIMAL(10,2) DEFAULT 0.00,
          bonuses_total DECIMAL(10,2) DEFAULT 0.00,
          penalties_total DECIMAL(10,2) DEFAULT 0.00,
          platform_commission DECIMAL(10,2) DEFAULT 0.00,
          tax_amount DECIMAL(10,2) DEFAULT 0.00,
          net_earnings DECIMAL(10,2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'Credited',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      // Ensure total_distance_km column exists in delivery_live_tracking
      await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN IF NOT EXISTS total_distance_km DECIMAL(8,3) DEFAULT NULL').catch(() => {});
      await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10,8) DEFAULT NULL').catch(() => {});
      await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11,8) DEFAULT NULL').catch(() => {});
      await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN IF NOT EXISTS dropoff_latitude DECIMAL(10,8) DEFAULT NULL').catch(() => {});
      await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN IF NOT EXISTS dropoff_longitude DECIMAL(11,8) DEFAULT NULL').catch(() => {});
    } catch (e) { /* ignore, table already exists */ }

    let totalEarningsData = { total: 0, distance_pay: 0, bonuses: 0 };
    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let dailyResult = [];
    let recentOrders = [];
    let totalDistanceKm = 0;

    // Total net earnings from dp_earnings_history (km-based calculated earnings)
    try {
      const [totalResult] = await pool.execute(
        `SELECT COALESCE(SUM(net_earnings), 0) as total,
                COALESCE(SUM(distance_pay), 0) as distance_pay,
                COALESCE(SUM(bonuses_total), 0) as bonuses
         FROM dp_earnings_history WHERE delivery_partner_user_id = ?`,
        [deliveryBoyId]
      );
      totalEarningsData = totalResult[0] || totalEarningsData;
    } catch (e) { console.error('[Earnings] total query error:', e.message); }

    // Today's net earnings
    try {
      const [todayResult] = await pool.execute(
        `SELECT COALESCE(SUM(net_earnings), 0) as today FROM dp_earnings_history 
         WHERE delivery_partner_user_id = ? AND DATE(created_at) = CURDATE()`,
        [deliveryBoyId]
      );
      todayEarnings = parseFloat(todayResult[0]?.today || 0);
    } catch (e) { console.error('[Earnings] today query error:', e.message); }

    // Weekly earnings (last 7 days)
    try {
      const [weeklyResult] = await pool.execute(
        `SELECT COALESCE(SUM(net_earnings), 0) as weekly FROM dp_earnings_history 
         WHERE delivery_partner_user_id = ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
        [deliveryBoyId]
      );
      weeklyEarnings = parseFloat(weeklyResult[0]?.weekly || 0);
    } catch (e) { console.error('[Earnings] weekly query error:', e.message); }

    // Earnings by day (last 14 days)
    try {
      const [rows] = await pool.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as deliveries, 
                SUM(net_earnings) as amount,
                SUM(base_pay) as base_pay,
                SUM(distance_pay) as distance_pay,
                SUM(bonuses_total) as bonuses
         FROM dp_earnings_history 
         WHERE delivery_partner_user_id = ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
         GROUP BY DATE(created_at) ORDER BY date DESC`,
        [deliveryBoyId]
      );
      dailyResult = rows || [];
    } catch (e) { console.error('[Earnings] daily query error:', e.message); }

    // Recent completed orders with km-based earnings breakdown
    try {
      const [rows] = await pool.execute(
        `SELECT 
           eh.order_id, eh.base_pay, eh.distance_pay, eh.bonuses_total,
           eh.platform_commission, eh.tax_amount, eh.net_earnings, eh.created_at,
           ufo.customer_name, ufo.customer_phone, ufo.total_amount as order_total,
           ufo.street_address, ufo.city, ufo.status
         FROM dp_earnings_history eh
         LEFT JOIN user_food_order_table ufo ON ufo.order_id = eh.order_id
         WHERE eh.delivery_partner_user_id = ?
         ORDER BY eh.created_at DESC LIMIT 20`,
        [deliveryBoyId]
      );
      recentOrders = rows || [];
    } catch (e) { console.error('[Earnings] recent orders query error:', e.message); }

    // Try to enrich with distance from delivery_live_tracking
    try {
      const [distRow] = await pool.execute(
        `SELECT COALESCE(SUM(total_distance_km), 0) as total_km 
         FROM delivery_live_tracking 
         WHERE delivery_partner_user_id = ? AND status = 'Completed'`,
        [deliveryBoyId]
      );
      totalDistanceKm = parseFloat(distRow[0]?.total_km || 0);
    } catch (e) { console.error('[Earnings] distance query error:', e.message); }

    res.json({
      totals: {
        totalEarnings: parseFloat(totalEarningsData.total || 0),
        todayEarnings,
        weeklyEarnings,
        totalDistancePay: parseFloat(totalEarningsData.distance_pay || 0),
        totalBonuses: parseFloat(totalEarningsData.bonuses || 0),
        totalDistanceKm
      },
      dailyEarnings: dailyResult,
      recentDeliveries: recentOrders
    });
  } catch (err) {
    console.error('Earnings route error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Update Live Tracking (order-specific)
router.post('/tracking/update', async (req, res) => {
  try {
    const deliveryBoyId = req.user.user_id || req.user.id;
    const { order_id, latitude, longitude, pincode, area, district } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Fetch delivery boy details
    const [partnerResult] = await pool.execute(
      'SELECT dp.name, dp.mobile FROM delivery_partners dp WHERE dp.user_id = ? LIMIT 1',
      [deliveryBoyId]
    );
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

// ─── Live Location Update ────────────────────────────────────────────────────
// POST /delivery/location/update
// Stores the delivery partner's current GPS coordinates in the users table
// and in delivery_live_tracking (keyed to a synthetic order_id).
// Called every 10 minutes by the frontend.
router.post('/location/update', async (req, res) => {
  try {
    const deliveryBoyId = req.user.user_id || req.user.id;
    const { latitude, longitude, location_name, pincode } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    // 1. Update the users table (primary live location store)
    await pool.execute(
      `UPDATE users
         SET latitude      = ?,
             longitude     = ?,
             location_name = ?,
             pincode       = ?,
             updated_at    = NOW()
       WHERE user_id = ? AND role = 'delivery_partner'`,
      [
        String(latitude),
        String(longitude),
        location_name || null,
        pincode       || null,
        deliveryBoyId
      ]
    );

    // 2. Also upsert into delivery_live_tracking for a unified "live_location" row
    const syntheticOrderId = `live_loc_${deliveryBoyId}`;
    const [partnerResult] = await pool.execute(
      `SELECT u.full_name AS name, u.mobile_number AS mobile
         FROM users u
        WHERE u.user_id = ? LIMIT 1`,
      [deliveryBoyId]
    );
    const partnerName  = partnerResult[0]?.name   || '';
    const partnerPhone = partnerResult[0]?.mobile  || '';

    await pool.execute(
      `INSERT INTO delivery_live_tracking
         (order_id, delivery_partner_user_id, delivery_partner_name, delivery_partner_phone,
          latitude, longitude, pincode, area, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
       ON DUPLICATE KEY UPDATE
         latitude                = VALUES(latitude),
         longitude               = VALUES(longitude),
         pincode                 = VALUES(pincode),
         area                    = VALUES(area),
         delivery_partner_name   = VALUES(delivery_partner_name),
         delivery_partner_phone  = VALUES(delivery_partner_phone),
         status                  = 'Active',
         updated_at              = CURRENT_TIMESTAMP`,
      [
        syntheticOrderId,
        deliveryBoyId,
        partnerName,
        partnerPhone,
        String(latitude),
        String(longitude),
        pincode       || null,
        location_name || null
      ]
    );

    console.log(`📍 [Live Location] Partner ${deliveryBoyId} → lat:${latitude}, lng:${longitude}, area:${location_name || '-'}`);
    res.json({ message: 'Live location updated successfully', latitude, longitude });
  } catch (err) {
    console.error('Live Location Update Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET /delivery/location — fetch this partner's last stored live location
router.get('/location', async (req, res) => {
  try {
    const deliveryBoyId = req.user.user_id || req.user.id;

    const [rows] = await pool.execute(
      `SELECT latitude, longitude, location_name, pincode, updated_at
         FROM users
        WHERE user_id = ? AND role = 'delivery_partner'
        LIMIT 1`,
      [deliveryBoyId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get Location Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;
