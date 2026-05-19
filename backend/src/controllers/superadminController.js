const pool = require('../config/db');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ==================== DASHBOARD ANALYTICS ====================
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core Card Counts
    const [[{ totalUsers }]] = await pool.execute("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'");
    const [[{ totalRestaurants }]] = await pool.execute("SELECT COUNT(*) AS totalRestaurants FROM restaurants");
    const [[{ totalHomeChefs }]] = await pool.execute("SELECT COUNT(*) AS totalHomeChefs FROM home_chefs");
    const [[{ totalDeliveryPartners }]] = await pool.execute("SELECT COUNT(*) AS totalDeliveryPartners FROM delivery_partners");
    const [[{ totalOrders }]] = await pool.execute("SELECT COUNT(*) AS totalOrders FROM orders");
    const [[{ totalRevenue }]] = await pool.execute("SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM orders WHERE status = 'Delivered'");
    const [[{ pendingApprovals }]] = await pool.execute(
      "SELECT (SELECT COUNT(*) FROM restaurants WHERE status = 'Pending') + (SELECT COUNT(*) FROM home_chefs WHERE status = 'Pending') + (SELECT COUNT(*) FROM delivery_partners WHERE status = 'Pending') AS pendingApprovals"
    );
    const [[{ activeFranchises }]] = await pool.execute("SELECT COUNT(*) AS activeFranchises FROM franchise_owners WHERE status = 'Active'");

    // 2. Mock or computed historical analytics data for charts (recharts)
    // In a fully populated DB, we can query orders grouped by date/status.
    const [ordersByStatus] = await pool.execute("SELECT status, COUNT(*) AS count, SUM(amount) as revenue FROM orders GROUP BY status");
    
    // Fallback/standard chart seeds if DB counts are low
    const dailyOrders = [
      { date: 'Mon', orders: 12, revenue: 3200 },
      { date: 'Tue', orders: 19, revenue: 4500 },
      { date: 'Wed', orders: 15, revenue: 3800 },
      { date: 'Thu', orders: 22, revenue: 5100 },
      { date: 'Fri', orders: 30, revenue: 7800 },
      { date: 'Sat', orders: 45, revenue: 12000 },
      { date: 'Sun', orders: 35, revenue: 9500 }
    ];

    const revenueAnalytics = [
      { name: 'Jan', revenue: 45000, orders: 120 },
      { name: 'Feb', revenue: 58000, orders: 160 },
      { name: 'Mar', revenue: 64000, orders: 190 },
      { name: 'Apr', revenue: 78000, orders: 220 },
      { name: 'May', revenue: 92000, orders: 280 },
      { name: 'Jun', revenue: 110000, orders: 340 }
    ];

    const userGrowth = [
      { name: 'Week 1', customers: 150, chefs: 10, partners: 20 },
      { name: 'Week 2', customers: 220, chefs: 15, partners: 28 },
      { name: 'Week 3', customers: 310, chefs: 21, partners: 35 },
      { name: 'Week 4', customers: 450, chefs: 30, partners: 45 }
    ];

    res.json({
      cards: {
        totalUsers,
        totalRestaurants,
        totalHomeChefs,
        totalDeliveryPartners,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue),
        pendingApprovals,
        activeFranchises
      },
      charts: {
        dailyOrders,
        revenueAnalytics,
        userGrowth,
        ordersByStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard stats.', error: error.message });
  }
};

// ==================== HOME CHEF MANAGEMENT ====================
exports.getHomeChefs = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM home_chefs ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chefs.', error: error.message });
  }
};

exports.createHomeChef = async (req, res) => {
  try {
    const { name, mobile, email, address, fssai_number } = req.body;
    const aadhaar_url = req.files && req.files.aadhaar_doc ? req.files.aadhaar_doc[0].filename : null;
    const pan_url = req.files && req.files.pan_doc ? req.files.pan_doc[0].filename : null;

    const [result] = await pool.execute(
      "INSERT INTO home_chefs (name, mobile, email, address, fssai_number, aadhaar_url, pan_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
      [name, mobile, email, address, fssai_number || null, aadhaar_url, pan_url]
    );
    res.status(201).json({ message: 'Home chef application submitted.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating home chef.', error: error.message });
  }
};

exports.updateHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, address, fssai_number, status } = req.body;
    await pool.execute(
      "UPDATE home_chefs SET name = ?, mobile = ?, email = ?, address = ?, fssai_number = ?, status = ? WHERE id = ?",
      [name, mobile, email, address, fssai_number, status, id]
    );
    res.json({ message: 'Home chef updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating home chef.', error: error.message });
  }
};

exports.patchHomeChefStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. Approved, Suspended, Rejected
    await pool.execute("UPDATE home_chefs SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `Home chef status changed to ${status}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating home chef status.', error: error.message });
  }
};

exports.deleteHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM home_chefs WHERE id = ?", [id]);
    res.json({ message: 'Home chef profile deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting home chef.', error: error.message });
  }
};

// ==================== RESTAURANT MANAGEMENT ====================
exports.getRestaurants = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM restaurants ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving restaurants.', error: error.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    const { name, owner_name, gst_number, fssai_number, mobile, email, address } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO restaurants (name, owner_name, gst_number, fssai_number, mobile, email, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
      [name, owner_name, gst_number || null, fssai_number || null, mobile, email, address]
    );
    res.status(201).json({ message: 'Restaurant created successfully.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating restaurant.', error: error.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner_name, gst_number, fssai_number, mobile, email, address, status } = req.body;
    await pool.execute(
      "UPDATE restaurants SET name = ?, owner_name = ?, gst_number = ?, fssai_number = ?, mobile = ?, email = ?, address = ?, status = ? WHERE id = ?",
      [name, owner_name, gst_number, fssai_number, mobile, email, address, status, id]
    );
    res.json({ message: 'Restaurant updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating restaurant.', error: error.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM restaurants WHERE id = ?", [id]);
    res.json({ message: 'Restaurant deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting restaurant.', error: error.message });
  }
};

// ==================== DELIVERY PARTNER MANAGEMENT ====================
exports.getDeliveryPartners = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM delivery_partners ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partners.', error: error.message });
  }
};

exports.createDeliveryPartner = async (req, res) => {
  try {
    const { name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO delivery_partners (name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')",
      [name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number]
    );
    res.status(201).json({ message: 'Delivery partner registered.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error registering delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status, earnings, total_deliveries } = req.body;
    await pool.execute(
      "UPDATE delivery_partners SET name = ?, mobile = ?, vehicle_type = ?, vehicle_number = ?, license_number = ?, aadhaar_number = ?, status = ?, earnings = ?, total_deliveries = ? WHERE id = ?",
      [name, mobile, vehicle_type, vehicle_number, license_number, aadhaar_number, status, earnings || 0.00, total_deliveries || 0, id]
    );
    res.json({ message: 'Delivery partner profile updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery partner.', error: error.message });
  }
};

exports.deleteDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM delivery_partners WHERE id = ?", [id]);
    res.json({ message: 'Delivery partner deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery partner.', error: error.message });
  }
};

// ==================== USER MANAGEMENT ====================
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, user_id, name, email, phone, role, active, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users.', error: error.message });
  }
};

exports.patchUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // 1 for active, 0 for blocked
    await pool.execute("UPDATE users SET active = ? WHERE id = ?", [active, id]);
    res.json({ message: `User status changed to ${active ? 'Active' : 'Blocked'}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user status.', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: 'User account deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user.', error: error.message });
  }
};

// ==================== ORDER MANAGEMENT ====================
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM orders ORDER BY ordered_date DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders.', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, restaurant_or_chef, delivery_partner, amount, status } = req.body;
    await pool.execute(
      "UPDATE orders SET customer_name = ?, restaurant_or_chef = ?, delivery_partner = ?, amount = ?, status = ? WHERE id = ?",
      [customer_name, restaurant_or_chef, delivery_partner, amount, status, id]
    );
    res.json({ message: 'Order updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order.', error: error.message });
  }
};

exports.patchOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `Order status set to ${status}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error patching order status.', error: error.message });
  }
};

// ==================== PAYOUT MANAGEMENT ====================
exports.getPayouts = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM payouts ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving payouts.', error: error.message });
  }
};

exports.createPayout = async (req, res) => {
  try {
    const { user_name, role, total_earnings, pending_amount, paid_amount, transaction_id, payment_status } = req.body;
    await pool.execute(
      "INSERT INTO payouts (user_name, role, total_earnings, pending_amount, paid_amount, transaction_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [user_name, role, total_earnings, pending_amount, paid_amount, transaction_id, payment_status]
    );
    res.status(201).json({ message: 'Payout logged successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging payout.', error: error.message });
  }
};

// ==================== FRANCHISE OWNER MANAGEMENT ====================
exports.getFranchises = async (req, res) => {
  try {
    // Safe migrations for new columns
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS franch_user_id CHAR(36) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    const [rows] = await pool.execute("SELECT id, franchise_id, franch_user_id, franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, created_at FROM franchise_owners ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving franchise owners.', error: error.message });
  }
};

exports.createFranchise = async (req, res) => {
  try {
    const { franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, password } = req.body;
    // Hash password if provided, else store null (will be auto-generated at approval)
    const hashedPw = password ? hashPassword(password) : null;
    const plainPw  = password || null;
    const [result] = await pool.execute(
      "INSERT INTO franchise_owners (franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, login_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [franchise_name, owner_name, mobile, email, city, state, commission_percentage || 10.00, status || 'Pending', hashedPw]
    );
    res.status(201).json({
      message: 'Franchise owner registered. Click Approve to create login credentials.',
      id: result.insertId,
      // Return the plain password so the frontend can pre-fill credentials modal
      password: plainPw
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering franchise.', error: error.message });
  }
};

exports.approveFranchise = async (req, res) => {
  try {
    const { id } = req.params;

    // Get franchise details (include login_password)
    const [rows] = await pool.execute('SELECT * FROM franchise_owners WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Franchise not found.' });
    const franchise = rows[0];

    // If already approved and linked, return info
    if (franchise.status === 'Active' && franchise.franch_user_id) {
      return res.json({
        message: 'Franchise already approved.',
        alreadyApproved: true,
        franch_user_id: franchise.franch_user_id,
        email: franchise.email,
        owner_name: franchise.owner_name,
        franchise_name: franchise.franchise_name
      });
    }

    // Determine password to use
    let hashedPw = null;
    let plainPassword = null;

    if (req.body && req.body.password) {
      plainPassword = req.body.password;
      hashedPw = hashPassword(plainPassword);
    } else if (franchise.login_password) {
      hashedPw = franchise.login_password;
    } else {
      // Auto-generate: FirstName@last4digits
      const mobileLast4 = (franchise.mobile || '0000').slice(-4);
      plainPassword = `${franchise.owner_name.split(' ')[0]}@${mobileLast4}`;
      hashedPw = hashPassword(plainPassword);
    }

    // Check if a user with this email already exists
    const [existing] = await pool.execute('SELECT id, user_id FROM users WHERE email = ?', [franchise.email]);
    let userId;

    if (existing.length > 0) {
      userId = existing[0].user_id;
      // Update role + password
      await pool.execute(
        "UPDATE users SET role = 'admin', active = 1, password = ? WHERE email = ?",
        [hashedPw, franchise.email]
      );
    } else {
      const [newUser] = await pool.execute(
        "INSERT INTO users (name, email, phone, password, role, active) VALUES (?, ?, ?, ?, 'admin', 1)",
        [franchise.owner_name, franchise.email, franchise.mobile, hashedPw]
      );
      const [created] = await pool.execute('SELECT user_id FROM users WHERE id = ?', [newUser.insertId]);
      userId = created[0].user_id;
    }

    // Update franchise: Active + link UUID + update login_password
    await pool.execute(
      "UPDATE franchise_owners SET status = 'Active', franch_user_id = ?, login_password = ? WHERE id = ?",
      [userId, hashedPw, id]
    );

    return res.json({
      message: 'Franchise approved and login credentials created successfully.',
      franch_user_id: userId,
      email: franchise.email,
      password: plainPassword, // null means password was set at registration (not re-exposed)
      passwordWasPreset: !!franchise.login_password,
      owner_name: franchise.owner_name,
      franchise_name: franchise.franchise_name
    });
  } catch (error) {
    console.error('Approve franchise error:', error);
    res.status(500).json({ message: 'Error approving franchise.', error: error.message });
  }
};

exports.updateFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    const { franchise_name, owner_name, mobile, email, city, state, commission_percentage, status } = req.body;
    await pool.execute(
      "UPDATE franchise_owners SET franchise_name = ?, owner_name = ?, mobile = ?, email = ?, city = ?, state = ?, commission_percentage = ?, status = ? WHERE id = ?",
      [franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, id]
    );
    res.json({ message: 'Franchise updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating franchise.', error: error.message });
  }
};

exports.deleteFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM franchise_owners WHERE id = ?", [id]);
    res.json({ message: 'Franchise owner deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting franchise.', error: error.message });
  }
};

// ==================== COMMISSION MANAGEMENT ====================
exports.getCommissions = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM commissions ORDER BY type");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving commissions.', error: error.message });
  }
};

exports.updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission_value, is_percentage } = req.body;
    await pool.execute(
      "UPDATE commissions SET commission_value = ?, is_percentage = ? WHERE id = ?",
      [commission_value, is_percentage, id]
    );
    res.json({ message: 'Commission settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating commission.', error: error.message });
  }
};

// ==================== BANNER MANAGEMENT ====================
exports.getBanners = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM banners ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving banners.', error: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { banner_title, redirect_url, start_date, end_date, status } = req.body;
    const banner_image = req.file ? req.file.filename : 'default_banner.jpg';

    const [result] = await pool.execute(
      "INSERT INTO banners (banner_title, banner_image, redirect_url, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
      [banner_title, banner_image, redirect_url || null, start_date || null, end_date || null, status || 'Active']
    );
    res.status(201).json({ message: 'Banner uploaded.', id: result.insertId, image: banner_image });
  } catch (error) {
    res.status(500).json({ message: 'Error creating banner.', error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { banner_title, redirect_url, start_date, end_date, status } = req.body;
    await pool.execute(
      "UPDATE banners SET banner_title = ?, redirect_url = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?",
      [banner_title, redirect_url, start_date || null, end_date || null, status, id]
    );
    res.json({ message: 'Banner settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating banner.', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM banners WHERE id = ?", [id]);
    res.json({ message: 'Banner removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing banner.', error: error.message });
  }
};

// ==================== NOTIFICATION MANAGEMENT ====================
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM notifications ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving notifications.', error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { type, title, message } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO notifications (type, title, message, status) VALUES (?, ?, ?, 'Unread')",
      [type, title, message]
    );
    res.status(201).json({ message: 'Broadcast notification dispatched.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification.', error: error.message });
  }
};

// ==================== REPORTS & EXPORTS ====================
exports.getReportsList = async (req, res) => {
  try {
    // Return list of available or downloadable reporting configurations
    const reports = [
      { id: 1, type: 'Revenue', name: 'Revenue Summary Report', file: 'revenue_report_2026.csv' },
      { id: 2, type: 'Orders', name: 'Order Performance Metrics', file: 'orders_report_2026.csv' },
      { id: 3, type: 'Chefs', name: 'Home Chef Earnings Breakdown', file: 'homechef_report_2026.csv' }
    ];
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error reading reports.', error: error.message });
  }
};
