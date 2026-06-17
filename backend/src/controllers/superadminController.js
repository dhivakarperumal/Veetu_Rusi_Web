const pool = require('../config/db');
const crypto = require('crypto');
const https = require('https');
const { generateRoleId } = require('../utils/idGenerator');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
}

async function resolveCurrentUserAudit(req) {
  try {
    if (!req.user) return null;

    const candidateId = req.user.id || null;
    const candidateUserId = req.user.user_id || null;
    if (!candidateId && !candidateUserId) return null;

    // Try to query with both possible column names for full name
    let rows = [];
    try {
      const [result] = await pool.execute(
        'SELECT id, user_id, full_name AS name, email FROM users WHERE (id = ? OR user_id = ?) LIMIT 1',
        [candidateId, candidateUserId]
      );
      rows = result;
    } catch (e) {
      // Fallback: try with 'name' column instead of 'full_name'
      try {
        const [result] = await pool.execute(
          'SELECT id, user_id, name, email FROM users WHERE (id = ? OR user_id = ?) LIMIT 1',
          [candidateId, candidateUserId]
        );
        rows = result;
      } catch (e2) {
        // Users table might not exist or other issue - log it
        console.warn('Could not query users table for audit data:', e2.message);
        rows = [];
      }
    }

    if (rows.length > 0) {
      const user = rows[0];
      return {
        id: user.id || null,
        user_id: user.user_id || null,
        name: user.name || null,
        email: user.email || null,
      };
    }

    // Fallback: use req.user data if available
    return {
      id: candidateId,
      user_id: candidateUserId,
      name: req.user.name || req.user.full_name || req.user.username || null,
      email: req.user.email || null,
    };
  } catch (error) {
    console.error('Error in resolveCurrentUserAudit:', error);
    // Return fallback with token values on error
    return {
      id: req.user?.id || null,
      user_id: req.user?.user_id || null,
      name: req.user?.name || req.user?.full_name || null,
      email: req.user?.email || null,
    };
  }
}

async function expireFranchiseSubscriptions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [expiredFranchises] = await pool.execute(
      "SELECT id, email, expiry_date FROM franchise_owners WHERE expiry_date IS NOT NULL AND status = 'Active'"
    );

    const expiredIds = expiredFranchises
      .filter((franchise) => {
        const expiryDate = new Date(franchise.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate < today;
      })
      .map((franchise) => franchise.id);

    if (expiredIds.length > 0) {
      await pool.execute(
        `UPDATE franchise_owners SET status = 'Inactive' WHERE id IN (${expiredIds.map(() => '?').join(',')})`,
        expiredIds
      );
      const expiredEmails = expiredFranchises
        .filter((franchise) => expiredIds.includes(franchise.id))
        .map((franchise) => franchise.email);
      if (expiredEmails.length > 0) {
        await pool.execute(
          `UPDATE users SET status = 'Inactive' WHERE email IN (${expiredEmails.map(() => '?').join(',')})`,
          expiredEmails
        );
      }
    }
  } catch (error) {
    console.error('Error expiring franchise subscriptions:', error);
  }
}

async function syncUserForEntity(tableName, id, role) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    if (!rows.length) return null;
    const entity = rows[0];
    const status = entity.status;
    const name = entity.owner_name || entity.name || 'User';
    const email = entity.email;
    const mobile = entity.mobile;
    let password = entity.password;
    let plainPassword = null;

    if (!password) {
      plainPassword = `${name.split(' ')[0]}@${(mobile || '0000').slice(-4)}`;
      password = hashPassword(plainPassword);
    }

    // normalize role names
    let userRole = role;
    if (role === 'delivery' || role === 'delivery_boy' || role === 'delivery_partner') userRole = 'delivery_partner';

    if (status === 'Approved' || status === 'Active') {
      const [existing] = await pool.execute("SELECT id, user_id FROM users WHERE email = ?", [email]);
      if (existing.length === 0) {
        const userId = generateRoleId(userRole);
        const [ins] = await pool.execute(
          "INSERT INTO users (user_id, full_name, email, mobile_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Active')",
          [userId, name, email, mobile, password, userRole]
        );
        if (tableName === 'delivery_partners') {
          await pool.execute(`UPDATE ${tableName} SET user_id = ?, delivery_partner_user_id = ? WHERE id = ?`, [userId, userId, id]);
        } else {
          await pool.execute(`UPDATE ${tableName} SET user_id = ? WHERE id = ?`, [userId, id]);
        }
        return { created: true, user: { id: ins.insertId, name, email, phone: mobile, role: userRole }, plainPassword };
      } else {
        const existingUserId = existing[0].user_id;
        await pool.execute(
          "UPDATE users SET status = 'Active', role = ?, password = ?, full_name = ?, mobile_number = ? WHERE email = ?",
          [userRole, password, name, mobile, email]
        );
        if (existingUserId) {
          if (tableName === 'delivery_partners') {
            await pool.execute(`UPDATE ${tableName} SET user_id = ?, delivery_partner_user_id = ? WHERE id = ?`, [existingUserId, existingUserId, id]);
          } else {
            await pool.execute(`UPDATE ${tableName} SET user_id = ? WHERE id = ?`, [existingUserId, id]);
          }
        }
        return { updated: true };
      }
    } else if (status === 'Suspended' || status === 'Rejected' || status === 'Inactive') {
      await pool.execute("UPDATE users SET status = 'Inactive' WHERE email = ?", [email]);
      return { deactivated: true };
    }
    return null;
  } catch (err) {
    console.error(`Error syncing user for ${tableName}:`, err);
    return null;
  }
}

async function fetchPincodeData(pincode) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
      (response) => {
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        });
      }
    ).on('error', reject);
  });
}

// ==================== DASHBOARD ANALYTICS ====================
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core Card Counts
    const [[{ totalUsers }]] = await pool.execute("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'");
    const [[{ totalRestaurants }]] = await pool.execute("SELECT COUNT(*) AS totalRestaurants FROM restaurants");
    const [[{ totalHomeChefs }]] = await pool.execute("SELECT COUNT(*) AS totalHomeChefs FROM home_chefs");
    const [[{ totalDeliveryPartners }]] = await pool.execute("SELECT COUNT(*) AS totalDeliveryPartners FROM delivery_partners");
    const [[{ totalOrders }]] = await pool.execute("SELECT COUNT(*) AS totalOrders FROM Chef_Order");
    const [[{ totalRevenue }]] = await pool.execute("SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM Chef_Order WHERE status = 'Delivered'");
    const [[{ pendingApprovals }]] = await pool.execute(
      "SELECT (SELECT COUNT(*) FROM restaurants WHERE status = 'Pending') + (SELECT COUNT(*) FROM home_chefs WHERE status = 'Pending') + (SELECT COUNT(*) FROM delivery_partners WHERE status = 'Pending') AS pendingApprovals"
    );
    const [[{ activeFranchises }]] = await pool.execute("SELECT COUNT(*) AS activeFranchises FROM franchise_owners WHERE status = 'Active'");
    const [[{ totalFranchises }]] = await pool.execute("SELECT COUNT(*) AS totalFranchises FROM franchise_owners");
    const [[{ expiredFranchises }]] = await pool.execute("SELECT COUNT(*) AS expiredFranchises FROM franchise_owners WHERE expiry_date IS NOT NULL AND expiry_date < CURDATE()");
    const [[{ expiringSoonFranchises }]] = await pool.execute("SELECT COUNT(*) AS expiringSoonFranchises FROM franchise_owners WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
    // Additional subscription/payment summary values
    const [[{ lastSubscriptionDate }]] = await pool.execute("SELECT MAX(start_date) AS lastSubscriptionDate FROM franchise_owners WHERE start_date IS NOT NULL");
    const [[{ nextSubscriptionDue }]] = await pool.execute("SELECT MIN(expiry_date) AS nextSubscriptionDue FROM franchise_owners WHERE expiry_date > CURDATE()");
    let lastPaymentDate = null;
    try {
      const [[{ lastPaymentDate: lpd }]] = await pool.execute(
        `SELECT MAX(d) AS lastPaymentDate FROM (
           SELECT ordered_date AS d FROM Chef_Order WHERE (LOWER(payment_status) = 'paid' OR LOWER(payment_status) = 'success' OR payment_method LIKE '%razorpay%')
           UNION ALL
           SELECT created_at AS d FROM subscription_payments
         ) t`
      );
      lastPaymentDate = lpd || null;
    } catch (err) {
      // subscription_payments may not exist yet; fall back to last paid order
      try {
        const [[{ lastPaymentDate: lpd2 }]] = await pool.execute("SELECT MAX(ordered_date) AS lastPaymentDate FROM Chef_Order WHERE (LOWER(payment_status) = 'paid' OR LOWER(payment_status) = 'success' OR payment_method LIKE '%razorpay%')");
        lastPaymentDate = lpd2 || null;
      } catch (err2) {
        lastPaymentDate = null;
      }
    }

    // 2. Mock or computed historical analytics data for charts (recharts)
    // In a fully populated DB, we can query orders grouped by date/status.
    const [ordersByStatus] = await pool.execute("SELECT status, COUNT(*) AS count, SUM(total_amount) as revenue FROM Chef_Order GROUP BY status");
    
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

    // Also include subscription payments sum if available
    let subscriptionRevenue = 0;
    try {
      const [[{ subscriptionRevenue: sr }]] = await pool.execute("SELECT COALESCE(SUM(amount),0) AS subscriptionRevenue FROM subscription_payments");
      subscriptionRevenue = parseFloat(sr) || 0;
    } catch (err) {
      subscriptionRevenue = 0;
    }

    res.json({
      cards: {
        totalUsers,
        totalRestaurants,
        totalHomeChefs,
        totalDeliveryPartners,
        totalOrders,
        // combine order revenue + subscription revenue
        totalRevenue: parseFloat(totalRevenue) + subscriptionRevenue,
        pendingApprovals,
        activeFranchises,
        totalFranchises,
        expiredFranchises,
        expiringSoonFranchises,
        subscriptionRevenue
      },
      // Dates (may be null)
      lastSubscriptionDate: lastSubscriptionDate || null,
      lastPaymentDate: lastPaymentDate || null,
      nextSubscriptionDue: nextSubscriptionDue || null,
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
    const {
      name, owner_name, gst_number, fssai_number, mobile, email, address, status,
      restaurant_type, cuisine_type, description, opening_date,
      alt_mobile, whatsapp_number, website_url, customer_support,
      door_number, street_name, area_name, landmark, city, district, state, pincode, latitude, longitude, map_link,
      opening_time, closing_time, working_days, holiday_details, is_24_hours, peak_hours,
      username, password, role, otp_verified, email_verified, verification_status
    } = req.body;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const gst_certificate_url = req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null;
    const shop_license_url = req.files && req.files.shop_license_url ? req.files.shop_license_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;
    const gallery_urls = req.files && req.files.gallery_urls ? req.files.gallery_urls.map(f => f.filename).join(',') : null;
    const restaurant_photos_urls = req.files && req.files.restaurant_photos_urls ? req.files.restaurant_photos_urls.map(f => f.filename).join(',') : null;
    const kitchen_photos_urls = req.files && req.files.kitchen_photos_urls ? req.files.kitchen_photos_urls.map(f => f.filename).join(',') : null;

    // Auto-generate address from individual fields if not provided
    const fullAddress = address || [door_number, street_name, area_name, landmark, city, district, state, pincode].filter(Boolean).join(', ') || null;

    const hashedPw = password ? hashPassword(password) : null;

    const [result] = await pool.execute(
      `INSERT INTO restaurants (
        name, owner_name, gst_number, fssai_number, mobile, email, address, status,
        restaurant_type, cuisine_type, description, opening_date, logo_url, banner_url, gallery_urls,
        alt_mobile, whatsapp_number, website_url, customer_support,
        door_number, street_name, area_name, landmark, city, district, state, pincode, latitude, longitude, map_link,
        opening_time, closing_time, working_days, holiday_details, is_24_hours, peak_hours,
        username, password, role, otp_verified, email_verified,
        verification_status, aadhaar_url, pan_url, gst_certificate_url, shop_license_url, restaurant_photos_urls, kitchen_photos_urls, signature_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, owner_name, gst_number || null, fssai_number || null, mobile, email, fullAddress, status || 'Pending',
        restaurant_type || 'Both', cuisine_type || 'Multi Cuisine', description || null, opening_date || null, logo_url || null, banner_url || null, gallery_urls || null,
        alt_mobile || null, whatsapp_number || null, website_url || null, customer_support || null,
        door_number || null, street_name || null, area_name || null, landmark || null, city || null, district || null, state || null, pincode || null, latitude || null, longitude || null, map_link || null,
        opening_time || null, closing_time || null, working_days || null, holiday_details || null, is_24_hours !== undefined ? (is_24_hours ? 1 : 0) : 0, peak_hours || null,
        username || null, hashedPw, role || 'Restaurant Admin', otp_verified !== undefined ? (otp_verified ? 1 : 0) : 0, email_verified !== undefined ? (email_verified ? 1 : 0) : 0,
        verification_status || 'Pending', aadhaar_url || null, pan_url || null, gst_certificate_url || null, shop_license_url || null, restaurant_photos_urls || null, kitchen_photos_urls || null, signature_url || null
      ]
    );
    await syncUserForEntity('restaurants', result.insertId, 'restaurant');
    res.status(201).json({ message: 'Restaurant created successfully.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating restaurant.', error: error.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, owner_name, gst_number, fssai_number, mobile, email, address, status,
      restaurant_type, cuisine_type, description, opening_date,
      alt_mobile, whatsapp_number, website_url, customer_support,
      door_number, street_name, area_name, landmark, city, district, state, pincode, latitude, longitude, map_link,
      opening_time, closing_time, working_days, holiday_details, is_24_hours, peak_hours,
      username, password, role, otp_verified, email_verified, verification_status
    } = req.body;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const gst_certificate_url = req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null;
    const shop_license_url = req.files && req.files.shop_license_url ? req.files.shop_license_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;
    const gallery_urls = req.files && req.files.gallery_urls ? req.files.gallery_urls.map(f => f.filename).join(',') : null;
    const restaurant_photos_urls = req.files && req.files.restaurant_photos_urls ? req.files.restaurant_photos_urls.map(f => f.filename).join(',') : null;
    const kitchen_photos_urls = req.files && req.files.kitchen_photos_urls ? req.files.kitchen_photos_urls.map(f => f.filename).join(',') : null;

    let query = `UPDATE restaurants SET 
      name = ?, owner_name = ?, gst_number = ?, fssai_number = ?, mobile = ?, email = ?, address = ?, status = ?,
      restaurant_type = ?, cuisine_type = ?, description = ?, opening_date = ?,
      alt_mobile = ?, whatsapp_number = ?, website_url = ?, customer_support = ?,
      door_number = ?, street_name = ?, area_name = ?, landmark = ?, city = ?, district = ?, state = ?, pincode = ?, latitude = ?, longitude = ?, map_link = ?,
      opening_time = ?, closing_time = ?, working_days = ?, holiday_details = ?, is_24_hours = ?, peak_hours = ?,
      username = ?, role = ?, otp_verified = ?, email_verified = ?, verification_status = ?`;
    
    let params = [
      name, owner_name, gst_number, fssai_number, mobile, email, address, status,
      restaurant_type, cuisine_type, description, opening_date,
      alt_mobile, whatsapp_number, website_url, customer_support,
      door_number, street_name, area_name, landmark, city, district, state, pincode, latitude, longitude, map_link,
      opening_time, closing_time, working_days, holiday_details, is_24_hours !== undefined ? (is_24_hours ? 1 : 0) : 0, peak_hours,
      username, role, otp_verified !== undefined ? (otp_verified ? 1 : 0) : 0, email_verified !== undefined ? (email_verified ? 1 : 0) : 0,
      verification_status || 'Pending'
    ];

    if (logo_url) { query += `, logo_url = ?`; params.push(logo_url); }
    if (banner_url) { query += `, banner_url = ?`; params.push(banner_url); }
    if (gallery_urls) { query += `, gallery_urls = ?`; params.push(gallery_urls); }
    if (aadhaar_url) { query += `, aadhaar_url = ?`; params.push(aadhaar_url); }
    if (pan_url) { query += `, pan_url = ?`; params.push(pan_url); }
    if (gst_certificate_url) { query += `, gst_certificate_url = ?`; params.push(gst_certificate_url); }
    if (shop_license_url) { query += `, shop_license_url = ?`; params.push(shop_license_url); }
    if (restaurant_photos_urls) { query += `, restaurant_photos_urls = ?`; params.push(restaurant_photos_urls); }
    if (kitchen_photos_urls) { query += `, kitchen_photos_urls = ?`; params.push(kitchen_photos_urls); }
    if (signature_url) { query += `, signature_url = ?`; params.push(signature_url); }

    if (password) {
      query += `, password = ?`;
      params.push(hashPassword(password));
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);
    await syncUserForEntity('restaurants', id, 'restaurant');
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

// ==================== USER MANAGEMENT ====================
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, user_id, full_name AS name, email, mobile_number AS phone, role, status AS active, created_at FROM users ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users.', error: error.message });
  }
};

exports.patchUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // 1 for active, 0 for blocked
    const statusVal = active ? 'Active' : 'Inactive';
    await pool.execute("UPDATE users SET status = ? WHERE id = ?", [statusVal, id]);
    res.json({ message: `User status changed to ${active ? 'Active' : 'Inactive'}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user status.', error: error.message });
  }
};

exports.patchUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: `User role changed to ${role}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user role.', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { full_name, email, mobile_number, password, role } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required.' });
    }
    // Check duplicate email
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    const hashedPw = hashPassword(password);
    const userIdStr = generateRoleId(role || 'user');
    const [result] = await pool.execute(
      'INSERT INTO users (user_id, full_name, email, mobile_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userIdStr, full_name, email, mobile_number || null, hashedPw, role || 'user', 'Active']
    );
    res.status(201).json({ message: 'User created successfully.', id: result.insertId, user_id: userIdStr });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.', error: error.message });
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
    const { status, franchise_user_id } = req.query;
    const currentUserId = req.user?.user_id;
    const role = req.user?.role;
    
    let query = "SELECT * FROM Chef_Order WHERE 1=1";
    let params = [];
    
    if (status && status !== 'All') {
      if (status === 'Order Placed') {
        query += " AND (status = ? OR status = 'Pending' OR status = 'New')";
      } else {
        query += " AND status = ?";
      }
      params.push(status);
    }
    
    // Role-based filtering:
    // - superadmin → see all orders unless franchise_user_id is provided
    // - admin/franchise → see only orders where their franchise_user_id matches, or where query param is provided for a specific franchise
    // - user → see only their own orders by user_id
    // - chef → filter in JS below by product ownership
    if (franchise_user_id) {
      query += " AND franchise_user_id = ?";
      params.push(franchise_user_id);
    } else if (role === 'franchise' || role === 'admin') {
      query += " AND franchise_user_id = ?";
      params.push(currentUserId);
    } else if (role === 'user') {
      query += " AND user_id = ?";
      params.push(currentUserId);
    }
    
    query += " ORDER BY ordered_date DESC";
    
    const [rows] = await pool.execute(query, params);
    
    let chefProductIds = new Set();
    if (role === 'chef') {
      const [chefProducts] = await pool.execute('SELECT id FROM chef_products WHERE chef_user_id = ?', [currentUserId]);
      chefProducts.forEach(p => chefProductIds.add(p.id));
    }
    
    const parsedRows = rows.map(row => {
      let items = row.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }
      return { ...row, items };
    }).filter(row => {
      if (role === 'chef') {
        if (!row.items || row.items.length === 0) return false;
        // Check if any item in the order belongs to this chef
        return row.items.some(item => chefProductIds.has(Number(item.product_id) || Number(item.id)));
      }
      return true;
    });
    
    res.json(parsedRows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders.', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, restaurant_or_chef, delivery_partner, amount, status } = req.body;
    await pool.execute(
      "UPDATE Chef_Order SET customer_name = ?, restaurant_or_chef = ?, delivery_partner = ?, total_amount = ?, status = ? WHERE id = ?",
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
    await pool.execute("UPDATE Chef_Order SET status = ? WHERE id = ?", [status, id]);
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
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS franch_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners MODIFY COLUMN franch_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    await expireFranchiseSubscriptions();
    // Use SELECT * here to avoid runtime errors when some columns are missing
    // (safer for deployments with partial migrations). Frontend will pick needed fields.
    const [rows] = await pool.execute(`SELECT * FROM franchise_owners ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving franchise owners.', error: error.message });
  }
};

exports.getFranchiseById = async (req, res) => {
  try {
    const { id } = req.params;
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS franch_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners MODIFY COLUMN franch_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    const [rows] = await pool.execute('SELECT * FROM franchise_owners WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Franchise not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving franchise.', error: error.message });
  }
};

exports.createFranchise = async (req, res) => {
  try {
    // Ensure created_by columns exist (safe migration)
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS created_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    
    // Ensure bank columns exist (safe migration)
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS account_number VARCHAR(20) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT NULL"); } catch (_) {}

    const { 
      franchise_name, owner_name, mobile, email, city, state, status, password,
      pan_number, start_date, expiry_date,
      territory_pincodes, aadhaar_number,
      door_number, street_name, area, landmark, district, pincode, map_link,
      username, role, otp_verified, email_verified, login_status,
      bank_name, account_holder_name, account_number, ifsc_code, account_type
    } = req.body;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const bank_passbook_url = req.files && req.files.bank_passbook_url ? req.files.bank_passbook_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;

    // Hash password if provided, else store null (will be auto-generated at approval)
    const hashedPw = password ? hashPassword(password) : null;
    const plainPw = password || null;

    // Get current user for audit trail
    const auditUser = await resolveCurrentUserAudit(req);
    const createdBy = auditUser ? auditUser.user_id : null;

    const insertData = {
      franchise_name,
      owner_name,
      mobile,
      email,
      city,
      state,
      status: status || 'Pending',
      login_password: hashedPw,
      pan_number: pan_number || null,
      aadhaar_number: aadhaar_number || null,
      start_date: start_date || null,
      expiry_date: expiry_date || null,
      door_number: door_number || null,
      street_name: street_name || null,
      area: area || null,
      landmark: landmark || null,
      district: district || null,
      territory_pincodes: territory_pincodes || null,
      pincode: pincode || null,
      map_link: map_link || null,
      username: username || null,
      role: role || 'Admin',
      otp_verified: otp_verified !== undefined ? (otp_verified ? 1 : 0) : 0,
      email_verified: email_verified !== undefined ? (email_verified ? 1 : 0) : 0,
      login_status: login_status || 'Active',
      logo_url,
      banner_url,
      aadhaar_url,
      pan_url,
      bank_passbook_url,
      signature_url,
      bank_name: bank_name || null,
      account_holder_name: account_holder_name || null,
      account_number: account_number || null,
      ifsc_code: ifsc_code || null,
      account_type: account_type || null,
      created_by: createdBy
    };

      // Filter out fields that might not exist in older databases
      const safeInsertData = {};
      const allowedFields = [
        'franchise_name', 'owner_name', 'mobile', 'email', 'city', 'state',
        'status', 'login_password', 'pan_number', 'aadhaar_number', 'start_date', 'expiry_date',
        'door_number', 'street_name', 'area', 'landmark', 'district', 'territory_pincodes', 'pincode',
        'map_link', 'username', 'role', 'otp_verified',
        'email_verified', 'login_status', 'logo_url', 'banner_url', 'aadhaar_url',
        'pan_url', 'bank_passbook_url', 'signature_url',
        'bank_name', 'account_holder_name', 'account_number', 'ifsc_code', 'account_type',
        'created_by'
      ];
    
      allowedFields.forEach(field => {
        if (field in insertData) {
          safeInsertData[field] = insertData[field];
        }
      });

      // Build INSERT statement with column names
      const columns = Object.keys(safeInsertData);
      const placeholders = columns.map(() => '?').join(',');
      const values = columns.map(col => safeInsertData[col]);
      const columnList = columns.join(',');

      const [result] = await pool.execute(
        `INSERT INTO franchise_owners (${columnList}) VALUES (${placeholders})`,
        values
      );
    res.status(201).json({
      message: 'Franchise owner registered. Click Approve to create login credentials.',
      id: result.insertId,
      password: plainPw
    });
  } catch (error) {
    console.error('Error creating franchise:', error);
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

    const today = new Date();
    const defaultStartDate = franchise.start_date || today.toISOString().slice(0, 10);
    const defaultExpiryDate = franchise.expiry_date
      ? franchise.expiry_date
      : new Date(new Date(defaultStartDate).valueOf() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Check if a user with this email already exists
    const [existing] = await pool.execute('SELECT id, user_id FROM users WHERE email = ?', [franchise.email]);
    let userId;

    if (existing.length > 0) {
      userId = existing[0].user_id;
      // Update role + password
      await pool.execute(
        "UPDATE users SET role = 'admin', status = 'Active', password = ? WHERE email = ?",
        [hashedPw, franchise.email]
      );
    } else {
      const userIdStr = generateRoleId('franchise_admin');
      const [newUser] = await pool.execute(
        "INSERT INTO users (user_id, full_name, email, mobile_number, password, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'Active')",
        [userIdStr, franchise.owner_name, franchise.email, franchise.mobile, hashedPw]
      );
      const [created] = await pool.execute('SELECT user_id FROM users WHERE id = ?', [newUser.insertId]);
      userId = created[0].user_id;
    }

    // Get current user for audit trail
    const auditUser = await resolveCurrentUserAudit(req);
    const createdBy = auditUser ? auditUser.user_id : null;

    // Update franchise: Active + link UUID + update login_password + audit trail
    await pool.execute(
      "UPDATE franchise_owners SET status = 'Active', franch_user_id = ?, login_password = ?, start_date = ?, expiry_date = ?, created_by = ? WHERE id = ?",
      [userId, hashedPw, defaultStartDate, defaultExpiryDate, createdBy, id]
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
    const { 
      franchise_name, owner_name, mobile, email, city, state, status,
      pan_number, start_date, expiry_date,
      territory_pincodes, aadhaar_number,
      door_number, street_name, area, landmark, district, pincode, map_link,
      username, role, otp_verified, email_verified, login_status,
      bank_name, account_holder_name, account_number, ifsc_code, account_type
    } = req.body;

    const [existingFranchiseRows] = await pool.execute('SELECT email, franch_user_id FROM franchise_owners WHERE id = ?', [id]);
    if (!existingFranchiseRows.length) {
      return res.status(404).json({ message: 'Franchise not found.' });
    }
    const oldEmail = existingFranchiseRows[0].email;
    const franchiseUserId = existingFranchiseRows[0].franch_user_id;

    // Get current user for audit trail
    const auditUser = await resolveCurrentUserAudit(req);
    const updatedBy = auditUser ? auditUser.user_id : null;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const bank_passbook_url = req.files && req.files.bank_passbook_url ? req.files.bank_passbook_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;

    let query = `UPDATE franchise_owners SET 
      franchise_name = ?, owner_name = ?, mobile = ?, email = ?, city = ?, state = ?, status = ?,
      pan_number = ?, aadhaar_number = ?, start_date = ?, expiry_date = ?,
      door_number = ?, street_name = ?, area = ?, landmark = ?, district = ?, territory_pincodes = ?, pincode = ?, map_link = ?,
      username = ?, role = ?, otp_verified = ?, email_verified = ?, login_status = ?,
      bank_name = ?, account_holder_name = ?, account_number = ?, ifsc_code = ?, account_type = ?`;

    let params = [
      franchise_name, owner_name, mobile, email, city, state, status,
      pan_number || null, aadhaar_number || null, start_date || null, expiry_date || null,
      door_number || null, street_name || null, area || null, landmark || null, district || null, territory_pincodes || null, pincode || null, map_link || null,
      username || null, role || 'Admin', otp_verified !== undefined ? (otp_verified ? 1 : 0) : 0, email_verified !== undefined ? (email_verified ? 1 : 0) : 0, login_status || 'Active',
      bank_name || null, account_holder_name || null, account_number || null, ifsc_code || null, account_type || null
    ];

    if (logo_url) { query += `, logo_url = ?`; params.push(logo_url); }
    if (banner_url) { query += `, banner_url = ?`; params.push(banner_url); }
    if (aadhaar_url) { query += `, aadhaar_url = ?`; params.push(aadhaar_url); }
    if (pan_url) { query += `, pan_url = ?`; params.push(pan_url); }
    if (bank_passbook_url) { query += `, bank_passbook_url = ?`; params.push(bank_passbook_url); }
    if (signature_url) { query += `, signature_url = ?`; params.push(signature_url); }

    query += `, updated_by = ? WHERE id = ?`;
    params.push(updatedBy, id);

    await pool.execute(query, params);

    // Sync status to associated user's status field
    if (status !== undefined && status !== null) {
      const isActive = status === 'Active' ? 'Active' : 'Inactive';
      const emailsToUpdate = Array.from(new Set([oldEmail, email].filter(Boolean)));
      const conditions = [];
      const syncParams = [isActive];

      if (emailsToUpdate.length > 0) {
        conditions.push(`email IN (${emailsToUpdate.map(() => '?').join(', ')})`);
        syncParams.push(...emailsToUpdate);
      }
      if (franchiseUserId) {
        conditions.push('user_id = ?');
        syncParams.push(franchiseUserId);
      }

      if (conditions.length > 0) {
        await pool.execute(`UPDATE users SET status = ? WHERE ${conditions.join(' OR ')}`, syncParams);
      }
    }

    res.json({ message: 'Franchise updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating franchise.', error: error.message });
  }
};

exports.deleteFranchise = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deactivate associated user account before deletion
    const [rows] = await pool.execute("SELECT email FROM franchise_owners WHERE id = ?", [id]);
    if (rows && rows.length > 0) {
      await pool.execute("UPDATE users SET status = 'Inactive', role = 'user' WHERE email = ?", [rows[0].email]);
    }

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

// ==================== HOME CHEF MANAGEMENT ====================
exports.getHomeChefs = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM home_chefs ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chefs.', error: error.message });
  }
};

exports.getHomeChefById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM home_chefs WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Home Chef not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chef.', error: error.message });
  }
};

// Valid columns in home_chefs table
const VALID_HOMECHEF_COLUMNS = [
  'id', 'user_id', 'name', 'mobile', 'email', 'aadhaar_url', 'pan_url',
  'status', 'created_at', 'updated_at', 'profile_photo', 'alt_mobile',
  'door_number', 'street_name', 'area_name', 'landmark', 'city', 'district', 'state', 'pincode',
  'map_link', 'kitchen_name', 'kitchen_address', 'kitchen_type', 'kitchen_photos',
  'cuisine_type', 'veg_nonveg', 'experience_years', 'pre_order', 'aadhaar_number',
  'pan_number', 'gst_number', 'bank_account_number', 'ifsc_code', 'account_holder_name', 'upi_id',
  'aadhaar_front_url', 'aadhaar_back_url', 'pan_card_url', 'fssai_certificate_url', 'gst_certificate_url',
  'signature_url', 'selfie_verification_url', 'instagram_url',
  'facebook_url', 'youtube_url', 'website_url', 'preorder_available', 'cutoff_time', 'about_me',
  'cooking_story', 'languages_known',
  'cooking_area_photo', 'storage_area_photo', 'created_by', 'updated_by', 'password', 'username',
  'gender', 'date_of_birth', 'age', 'country', 'kitchen_videos',
  'daily_order_capacity', 'available_days', 'available_slots', 'fssai_available', 'gst_available',
  'bank_branch', 'passbook_image', 'introduction_video', 'why_choose_me', 'delivery_radius',
  'verification_status', 'approval_status', 'approval_date', 'rejection_reason'
];

exports.createHomeChef = async (req, res) => {
  try {
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email, password,
      house_number, street, area, city, district, state, pincode, country, google_map_location,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    } = req.body;

    const hashedPassword = password ? hashPassword(password) : hashPassword(`${email}@2024`);
    const homeChefUserId = user_id || generateRoleId('chef');
    const preorderAvailable = normalizeBoolean(preorder_available) ? 1 : 0;
    const createdBy = auditUser?.user_id || auditUser?.id || auditUser?.email || auditUser?.name || null;
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || null;
      }
      return null;
    };

    const profilePhoto = getFileFromArray(files.profile_photo);
    const kitchenPhotos = Array.isArray(files.kitchen_photos) && files.kitchen_photos.length > 0
      ? JSON.stringify(files.kitchen_photos.map(f => f.filename))
      : null;
    const kitchenVideos = Array.isArray(files.kitchen_videos) && files.kitchen_videos.length > 0
      ? JSON.stringify(files.kitchen_videos.map(f => f.filename))
      : null;
    const cookingAreaPhoto = getFileFromArray(files.cooking_area_photo);
    const aadhaarFront = getFileFromArray(files.aadhaar_front_url);
    const aadhaarBack = getFileFromArray(files.aadhaar_back_url);
    const panCard = getFileFromArray(files.pan_card_url);
    const passbookImg = getFileFromArray(files.passbook_image);
    const selfieVerif = getFileFromArray(files.selfie_verification_url);
    const introVideo = getFileFromArray(files.introduction_video);
    const fssaiCertUrl = getFileFromArray(files.fssai_certificate_url);
    const gstCertUrl = getFileFromArray(files.gst_certificate_url);
    const sigUrl = getFileFromArray(files.signature_url);
    const storagePhoto = getFileFromArray(files.storage_area_photo);

    const homeChefData = {
      user_id: homeChefUserId,
      name: fullName,
      email,
      mobile,
      profile_photo: profilePhoto,
      alt_mobile,
      door_number: house_number,
      street_name: street,
      area_name: area,
      city,
      district,
      state,
      pincode,
      country,
      map_link: google_map_location,
      kitchen_name,
      kitchen_address,
      kitchen_type,
      kitchen_photos: kitchenPhotos,
      kitchen_videos: kitchenVideos,
      cooking_area_photo: cookingAreaPhoto,
      veg_nonveg,
      experience_years,
      cuisine_type,
      daily_order_capacity,
      available_days,
      available_slots,
      fssai_available,
      gst_available,
      aadhaar_number,
      pan_number,
      bank_account_number,
      ifsc_code,
      account_holder_name,
      bank_branch,
      upi_id,
      passbook_image: passbookImg,
      aadhaar_front_url: aadhaarFront,
      aadhaar_back_url: aadhaarBack,
      pan_card_url: panCard,
      selfie_verification_url: selfieVerif,
      introduction_video: introVideo,
      instagram_url,
      facebook_url,
      youtube_url,
      website_url,
      about_me,
      cooking_story,
      why_choose_me,
      languages_known,
      delivery_radius,
      preorder_available: preorderAvailable,
      cutoff_time,
      fssai_certificate_url: fssaiCertUrl,
      gst_certificate_url: gstCertUrl,
      signature_url: sigUrl,
      storage_area_photo: storagePhoto,
      verification_status: verification_status || 'Pending',
      approval_status: approval_status || 'Pending',
      created_by: createdBy,
      password: hashedPassword,
      username,
      gender,
      date_of_birth,
      age,
      country
    };

    // Filter out undefined, null, and invalid columns
    const filteredData = Object.fromEntries(
      Object.entries(homeChefData)
        .filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (!VALID_HOMECHEF_COLUMNS.includes(key)) {
            console.warn(`⚠️ Skipping invalid column: ${key}`);
            return false;
          }
          return true;
        })
    );

    // Validate required fields
    if (!filteredData.email) {
      throw new Error('Email is required');
    }
    if (!filteredData.mobile) {
      throw new Error('Mobile number is required');
    }
    if (!filteredData.user_id) {
      throw new Error('User ID is required');
    }

    const insertColumns = Object.keys(filteredData);
    const placeholders = insertColumns.map(() => '?').join(', ');
    const values = Object.values(filteredData);

    console.log('📝 Insert columns:', insertColumns.length, 'columns');
    console.log('🔍 Sample data keys:', insertColumns.slice(0, 5), '...');
    console.log('📋 All columns:', insertColumns);

    if (insertColumns.length === 0) {
      throw new Error('No valid data to insert. All fields are empty.');
    }

    const query = `INSERT INTO home_chefs (${insertColumns.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())`;
    
    console.log('🔍 SQL Query:', query.substring(0, 150) + '...');
    
    const [result] = await pool.execute(query, values);

    console.log('✅ Home Chef created:', result.insertId);
    res.status(201).json({ message: 'Home Chef created successfully.', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating home chef:', error.message);
    console.error('📍 Stack:', error.stack);
    res.status(500).json({ message: 'Error creating home chef.', error: error.message });
  }
};

exports.updateHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email,
      house_number, street, area, city, district, state, pincode, country, google_map_location,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    } = req.body;

    // Get existing chef data
    const [existing] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Home Chef not found.' });
    }
    const chef = existing[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray, fallback) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || fallback;
      }
      return fallback;
    };

    const profilePhoto = getFileFromArray(files.profile_photo, chef.profile_photo);
    const kitchenPhotos = (Array.isArray(files.kitchen_photos) && files.kitchen_photos.length > 0)
      ? JSON.stringify(files.kitchen_photos.map(f => f.filename))
      : chef.kitchen_photos;
    const kitchenVideos = (Array.isArray(files.kitchen_videos) && files.kitchen_videos.length > 0)
      ? JSON.stringify(files.kitchen_videos.map(f => f.filename))
      : chef.kitchen_videos;
    const cookingAreaPhoto = getFileFromArray(files.cooking_area_photo, chef.cooking_area_photo);
    const aadhaarFront = getFileFromArray(files.aadhaar_front_url, chef.aadhaar_front_url);
    const aadhaarBack = getFileFromArray(files.aadhaar_back_url, chef.aadhaar_back_url);
    const panCard = getFileFromArray(files.pan_card_url, chef.pan_card_url);
    const passbookImg = getFileFromArray(files.passbook_image, chef.passbook_image);
    const selfieVerif = getFileFromArray(files.selfie_verification_url, chef.selfie_verification_url);
    const introVideo = getFileFromArray(files.introduction_video, chef.introduction_video);
    const fssaiCertUrl = getFileFromArray(files.fssai_certificate_url, chef.fssai_certificate_url);
    const gstCertUrl = getFileFromArray(files.gst_certificate_url, chef.gst_certificate_url);
    const sigUrl = getFileFromArray(files.signature_url, chef.signature_url);
    const storagePhoto = getFileFromArray(files.storage_area_photo, chef.storage_area_photo);

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || chef.name;
    const preorderAvailable = preorder_available !== undefined ? (normalizeBoolean(preorder_available) ? 1 : 0) : chef.preorder_available;
    const updatedBy = auditUser?.user_id || auditUser?.id || auditUser?.email || auditUser?.name || null;

    const normalizeValue = (val, fallback) => (val !== undefined && val !== null && val !== '') ? val : fallback;

    const updateData = {
      name: fullName,
      mobile: normalizeValue(mobile, chef.mobile),
      email: normalizeValue(email, chef.email),
      gender: normalizeValue(gender, chef.gender),
      date_of_birth: normalizeValue(date_of_birth, chef.date_of_birth),
      age: normalizeValue(age, chef.age),
      profile_photo: profilePhoto,
      alt_mobile: normalizeValue(alt_mobile, chef.alt_mobile),
      door_number: normalizeValue(house_number, chef.door_number),
      street_name: normalizeValue(street, chef.street_name),
      area_name: normalizeValue(area, chef.area_name),
      city: normalizeValue(city, chef.city),
      district: normalizeValue(district, chef.district),
      state: normalizeValue(state, chef.state),
      pincode: normalizeValue(pincode, chef.pincode),
      country: normalizeValue(country, chef.country),
      map_link: normalizeValue(google_map_location, chef.map_link),
      kitchen_name: normalizeValue(kitchen_name, chef.kitchen_name),
      kitchen_address: normalizeValue(kitchen_address, chef.kitchen_address),
      kitchen_type: normalizeValue(kitchen_type, chef.kitchen_type),
      kitchen_photos: kitchenPhotos,
      kitchen_videos: kitchenVideos,
      cooking_area_photo: cookingAreaPhoto,
      veg_nonveg: normalizeValue(veg_nonveg, chef.veg_nonveg),
      experience_years: normalizeValue(experience_years, chef.experience_years),
      cuisine_type: normalizeValue(cuisine_type, chef.cuisine_type),
      daily_order_capacity: normalizeValue(daily_order_capacity, chef.daily_order_capacity),
      available_days: normalizeValue(available_days, chef.available_days),
      available_slots: normalizeValue(available_slots, chef.available_slots),
      fssai_available: normalizeValue(fssai_available, chef.fssai_available),
      gst_available: normalizeValue(gst_available, chef.gst_available),
      aadhaar_number: normalizeValue(aadhaar_number, chef.aadhaar_number),
      pan_number: normalizeValue(pan_number, chef.pan_number),
      bank_account_number: normalizeValue(bank_account_number, chef.bank_account_number),
      ifsc_code: normalizeValue(ifsc_code, chef.ifsc_code),
      account_holder_name: normalizeValue(account_holder_name, chef.account_holder_name),
      bank_branch: normalizeValue(bank_branch, chef.bank_branch),
      upi_id: normalizeValue(upi_id, chef.upi_id),
      passbook_image: passbookImg,
      aadhaar_front_url: aadhaarFront,
      aadhaar_back_url: aadhaarBack,
      pan_card_url: panCard,
      selfie_verification_url: selfieVerif,
      introduction_video: introVideo,
      instagram_url: normalizeValue(instagram_url, chef.instagram_url),
      facebook_url: normalizeValue(facebook_url, chef.facebook_url),
      youtube_url: normalizeValue(youtube_url, chef.youtube_url),
      website_url: normalizeValue(website_url, chef.website_url),
      about_me: normalizeValue(about_me, chef.about_me),
      cooking_story: normalizeValue(cooking_story, chef.cooking_story),
      why_choose_me: normalizeValue(why_choose_me, chef.why_choose_me),
      languages_known: normalizeValue(languages_known, chef.languages_known),
      delivery_radius: normalizeValue(delivery_radius, chef.delivery_radius),
      preorder_available: preorderAvailable,
      cutoff_time: normalizeValue(cutoff_time, chef.cutoff_time),
      fssai_certificate_url: fssaiCertUrl,
      gst_certificate_url: gstCertUrl,
      signature_url: sigUrl,
      storage_area_photo: storagePhoto,
      verification_status: normalizeValue(verification_status, chef.verification_status),
      approval_status: normalizeValue(approval_status, chef.approval_status),
      updated_by: updatedBy
    };

    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (!VALID_HOMECHEF_COLUMNS.includes(key)) return false;
        return true;
      })
    );

    if (Object.keys(filteredUpdate).length === 0) {
      return res.json({ message: 'No changes to update.' });
    }

    const setClauses = Object.keys(filteredUpdate).map(k => `${k} = ?`).join(', ');
    const values = Object.values(filteredUpdate);
    values.push(id);

    await pool.execute(
      `UPDATE home_chefs SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
      values
    );

    console.log('✅ Home Chef updated:', id);
    res.json({ message: 'Home Chef updated successfully.' });
  } catch (error) {
    console.error('❌ Error updating home chef:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating home chef.', error: error.message });
  }
};

exports.deleteHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM home_chefs WHERE id = ?", [id]);
    res.json({ message: 'Home Chef deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting home chef.', error: error.message });
  }
};

exports.updateHomeChefStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verification_status, approval_status, rejection_reason, block_reason } = req.body;
    const auditUser = await resolveCurrentUserAudit(req);

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (verification_status) {
      updates.push('verification_status = ?');
      values.push(verification_status);
    }
    if (approval_status) {
      updates.push('approval_status = ?');
      values.push(approval_status);
      if (approval_status === 'Approved') {
        updates.push('approval_date = NOW()');
      }
    }
    if (rejection_reason !== undefined) {
      updates.push('rejection_reason = ?');
      values.push(rejection_reason);
    }
    if (block_reason !== undefined) {
      updates.push('block_reason = ?');
      values.push(block_reason);
    }

    const updatedBy = auditUser?.name || auditUser?.email || auditUser?.user_id || null;
    updates.push('updated_by = ?');
    values.push(updatedBy);
    updates.push('updated_at = NOW()');

    values.push(id);

    await pool.execute(
      `UPDATE home_chefs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Home Chef status updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating home chef status.', error: error.message });
  }
};

// ==================== AREAS MANAGEMENT ====================
exports.lookupPincode = async (req, res) => {
  try {
    const { value } = req.params;
    if (!/^[0-9]{6}$/.test(value)) {
      return res.status(400).json({ message: 'Invalid pincode format. Expected 6 digits.' });
    }

    const data = await fetchPincodeData(value);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(500).json({ message: 'Unexpected response from pincode service.' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching pincode data:', error);
    res.status(500).json({ message: 'Error fetching pincode information.', error: error.message });
  }
};

exports.getAreas = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM areas ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving areas.', error: error.message });
  }
};

exports.createArea = async (req, res) => {
  try {
    const { name, pincode, status } = req.body;
    if (!name || !pincode) {
      return res.status(400).json({ message: 'Name and pincode are required.' });
    }
    const createdBy = req.user?.id || null;
    const [result] = await pool.execute(
      'INSERT INTO areas (name, pincode, created_by, status) VALUES (?, ?, ?, ?)',
      [name.trim(), pincode.trim(), createdBy, status || 'Active']
    );
    const [rows] = await pool.execute('SELECT * FROM areas WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Area added successfully.', area: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Area name or pincode already exists.' });
    }
    res.status(500).json({ message: 'Error creating area.', error: error.message });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pincode, status } = req.body;
    if (!name || !pincode) {
      return res.status(400).json({ message: 'Name and pincode are required.' });
    }
    const query = status !== undefined
      ? 'UPDATE areas SET name = ?, pincode = ?, status = ? WHERE id = ?'
      : 'UPDATE areas SET name = ?, pincode = ? WHERE id = ?';
    const params = status !== undefined
      ? [name.trim(), pincode.trim(), status, id]
      : [name.trim(), pincode.trim(), id];
    await pool.execute(query, params);
    const [rows] = await pool.execute('SELECT * FROM areas WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Area not found.' });
    res.json({ message: 'Area updated successfully.', area: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Area name or pincode already exists.' });
    }
    res.status(500).json({ message: 'Error updating area.', error: error.message });
  }
};

exports.patchAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = String(status || '').trim();
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Status must be Active or Inactive.' });
    }
    await pool.execute('UPDATE areas SET status = ? WHERE id = ?', [normalizedStatus, id]);
    const [rows] = await pool.execute('SELECT * FROM areas WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Area not found.' });
    res.json({ message: `Area status changed to ${normalizedStatus}.`, area: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating area status.', error: error.message });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM areas WHERE id = ?', [id]);
    res.json({ message: 'Area deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting area.', error: error.message });
  }
};

// ==================== DELIVERY PARTNER MANAGEMENT ====================
exports.getDeliveryPartners = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM delivery_partners ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partners.', error: error.message });
  }
};

exports.getDeliveryPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM delivery_partners WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Delivery Partner not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partner.', error: error.message });
  }
};

exports.createDeliveryPartner = async (req, res) => {
  try {
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id, first_name, last_name, gender, date_of_birth, age, blood_group,
      mobile, alt_mobile, whatsapp_number, email, password,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_mobile,
      current_address, permanent_address, city, state, pincode, live_location,
      vehicle_type, vehicle_brand, vehicle_model, vehicle_number, vehicle_color,
      license_number, license_holder_name, license_issue_date, license_expiry_date,
      rc_book_number, insurance_number, insurance_expiry_date,
      aadhaar_number, pan_number,
      account_holder_name, bank_name, bank_account_number, ifsc_code, branch_name, upi_id,
      available_areas, available_time_morning, available_time_afternoon, available_time_evening, available_time_night,
      preferred_distance, delivery_radius, driving_experience,
      status
    } = req.body;

    const hashedPassword = password ? hashPassword(password) : hashPassword(`${email}@2024`);
    const deliveryPartnerUserId = user_id || generateRoleId('delivery_partner');
    const createdBy = auditUser?.name || auditUser?.email || auditUser?.user_id || null;
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || null;
      }
      return null;
    };

    const insertColumns = [
      'user_id', 'delivery_partner_user_id', 'name', 'email', 'mobile', 'status',
      'profile_photo', 'cover_photo', 'gender', 'date_of_birth', 'age', 'blood_group',
      'alt_mobile', 'whatsapp_number', 'emergency_contact_name', 'emergency_contact_relationship',
      'emergency_contact_mobile', 'current_address', 'permanent_address', 'city', 'state', 'pincode',
      'live_location', 'vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_number', 'vehicle_color',
      'license_number', 'license_holder_name', 'license_issue_date', 'license_expiry_date',
      'license_front_image', 'license_back_image', 'rc_book_number', 'rc_book_image',
      'insurance_number', 'insurance_expiry_date', 'insurance_document_image',
      'aadhaar_number', 'aadhaar_front_url', 'aadhaar_back_url', 'pan_number', 'pan_card_url',
      'selfie_verification_url', 'selfie_with_vehicle', 'selfie_with_aadhaar',
      'vehicle_front_photo', 'vehicle_back_photo', 'police_verification_certificate',
      'account_holder_name', 'bank_name', 'bank_account_number', 'ifsc_code', 'branch_name', 'upi_id',
      'available_areas', 'available_time_morning', 'available_time_afternoon', 'available_time_evening',
      'available_time_night', 'preferred_distance', 'delivery_radius', 'driving_experience',
      'password', 'father_husband_name'
    ];

    const values = [
      deliveryPartnerUserId, deliveryPartnerUserId, fullName, email, mobile, status || 'Pending',
      getFileFromArray(files.profile_photo), getFileFromArray(files.cover_photo),
      gender, date_of_birth, age, blood_group,
      alt_mobile, whatsapp_number, emergency_contact_name, emergency_contact_relationship,
      emergency_contact_mobile, current_address, permanent_address, city, state, pincode,
      live_location, vehicle_type, vehicle_brand, vehicle_model, vehicle_number, vehicle_color,
      license_number, license_holder_name, license_issue_date, license_expiry_date,
      getFileFromArray(files.license_front_image), getFileFromArray(files.license_back_image),
      rc_book_number, getFileFromArray(files.rc_book_image),
      insurance_number, insurance_expiry_date, getFileFromArray(files.insurance_document_image),
      aadhaar_number, getFileFromArray(files.aadhaar_front_url), getFileFromArray(files.aadhaar_back_url),
      pan_number, getFileFromArray(files.pan_card_url),
      getFileFromArray(files.selfie_verification_url), getFileFromArray(files.selfie_with_vehicle),
      getFileFromArray(files.selfie_with_aadhaar),
      getFileFromArray(files.vehicle_front_photo), getFileFromArray(files.vehicle_back_photo),
      getFileFromArray(files.police_verification_certificate),
      account_holder_name, bank_name, bank_account_number, ifsc_code, branch_name, upi_id,
      available_areas, normalizeBoolean(available_time_morning) ? 1 : 0,
      normalizeBoolean(available_time_afternoon) ? 1 : 0, normalizeBoolean(available_time_evening) ? 1 : 0,
      normalizeBoolean(available_time_night) ? 1 : 0, preferred_distance, delivery_radius, driving_experience,
      hashedPassword, req.body.father_husband_name || ''
    ];

    const placeholders = insertColumns.map(() => '?').join(', ');
    const query = `INSERT INTO delivery_partners (${insertColumns.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())`;
    
    const [result] = await pool.execute(query, values);

    res.status(201).json({ message: 'Delivery Partner created successfully.', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating delivery partner:', error.message);
    res.status(500).json({ message: 'Error creating delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, gender, date_of_birth, age, blood_group,
      mobile, alt_mobile, whatsapp_number, email,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_mobile,
      current_address, permanent_address, city, state, pincode, live_location,
      vehicle_type, vehicle_brand, vehicle_model, vehicle_number, vehicle_color,
      license_number, license_holder_name, license_issue_date, license_expiry_date,
      rc_book_number, insurance_number, insurance_expiry_date,
      aadhaar_number, pan_number,
      account_holder_name, bank_name, bank_account_number, ifsc_code, branch_name, upi_id,
      available_areas, available_time_morning, available_time_afternoon, available_time_evening, available_time_night,
      preferred_distance, delivery_radius, driving_experience,
      status
    } = req.body;

    const [existing] = await pool.execute('SELECT * FROM delivery_partners WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Delivery Partner not found.' });
    }
    const partner = existing[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray, fallback) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || fallback;
      }
      return fallback;
    };

    const normalizeValue = (val, fallback) => (val !== undefined && val !== null && val !== '') ? val : fallback;

    const [result] = await pool.execute(
      `UPDATE delivery_partners SET
        name = ?, mobile = ?, email = ?,
        gender = ?, date_of_birth = ?, age = ?, blood_group = ?,
        profile_photo = ?, cover_photo = ?,
        alt_mobile = ?, whatsapp_number = ?,
        emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_mobile = ?,
        current_address = ?, permanent_address = ?, city = ?, state = ?, pincode = ?, live_location = ?,
        vehicle_type = ?, vehicle_brand = ?, vehicle_model = ?, vehicle_number = ?, vehicle_color = ?,
        license_number = ?, license_holder_name = ?, license_issue_date = ?, license_expiry_date = ?,
        license_front_image = ?, license_back_image = ?,
        rc_book_number = ?, rc_book_image = ?,
        insurance_number = ?, insurance_expiry_date = ?, insurance_document_image = ?,
        aadhaar_number = ?, aadhaar_front_url = ?, aadhaar_back_url = ?,
        pan_number = ?, pan_card_url = ?,
        selfie_verification_url = ?, selfie_with_vehicle = ?, selfie_with_aadhaar = ?,
        vehicle_front_photo = ?, vehicle_back_photo = ?, police_verification_certificate = ?,
        account_holder_name = ?, bank_name = ?, bank_account_number = ?, ifsc_code = ?, branch_name = ?, upi_id = ?,
        available_areas = ?, available_time_morning = ?, available_time_afternoon = ?, available_time_evening = ?, available_time_night = ?,
        preferred_distance = ?, delivery_radius = ?, driving_experience = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        normalizeValue(first_name, '') && normalizeValue(last_name, '') ? `${normalizeValue(first_name, '')} ${normalizeValue(last_name, '')}`.trim() : partner.name,
        normalizeValue(mobile, partner.mobile),
        normalizeValue(email, partner.email),
        normalizeValue(gender, partner.gender),
        normalizeValue(date_of_birth, partner.date_of_birth),
        normalizeValue(age, partner.age),
        normalizeValue(blood_group, partner.blood_group),
        getFileFromArray(files.profile_photo, partner.profile_photo),
        getFileFromArray(files.cover_photo, partner.cover_photo),
        normalizeValue(alt_mobile, partner.alt_mobile),
        normalizeValue(whatsapp_number, partner.whatsapp_number),
        normalizeValue(emergency_contact_name, partner.emergency_contact_name),
        normalizeValue(emergency_contact_relationship, partner.emergency_contact_relationship),
        normalizeValue(emergency_contact_mobile, partner.emergency_contact_mobile),
        normalizeValue(current_address, partner.current_address),
        normalizeValue(permanent_address, partner.permanent_address),
        normalizeValue(city, partner.city),
        normalizeValue(state, partner.state),
        normalizeValue(pincode, partner.pincode),
        normalizeValue(live_location, partner.live_location),
        normalizeValue(vehicle_type, partner.vehicle_type),
        normalizeValue(vehicle_brand, partner.vehicle_brand),
        normalizeValue(vehicle_model, partner.vehicle_model),
        normalizeValue(vehicle_number, partner.vehicle_number),
        normalizeValue(vehicle_color, partner.vehicle_color),
        normalizeValue(license_number, partner.license_number),
        normalizeValue(license_holder_name, partner.license_holder_name),
        normalizeValue(license_issue_date, partner.license_issue_date),
        normalizeValue(license_expiry_date, partner.license_expiry_date),
        getFileFromArray(files.license_front_image, partner.license_front_image),
        getFileFromArray(files.license_back_image, partner.license_back_image),
        normalizeValue(rc_book_number, partner.rc_book_number),
        getFileFromArray(files.rc_book_image, partner.rc_book_image),
        normalizeValue(insurance_number, partner.insurance_number),
        normalizeValue(insurance_expiry_date, partner.insurance_expiry_date),
        getFileFromArray(files.insurance_document_image, partner.insurance_document_image),
        normalizeValue(aadhaar_number, partner.aadhaar_number),
        getFileFromArray(files.aadhaar_front_url, partner.aadhaar_front_url),
        getFileFromArray(files.aadhaar_back_url, partner.aadhaar_back_url),
        normalizeValue(pan_number, partner.pan_number),
        getFileFromArray(files.pan_card_url, partner.pan_card_url),
        getFileFromArray(files.selfie_verification_url, partner.selfie_verification_url),
        getFileFromArray(files.selfie_with_vehicle, partner.selfie_with_vehicle),
        getFileFromArray(files.selfie_with_aadhaar, partner.selfie_with_aadhaar),
        getFileFromArray(files.vehicle_front_photo, partner.vehicle_front_photo),
        getFileFromArray(files.vehicle_back_photo, partner.vehicle_back_photo),
        getFileFromArray(files.police_verification_certificate, partner.police_verification_certificate),
        normalizeValue(account_holder_name, partner.account_holder_name),
        normalizeValue(bank_name, partner.bank_name),
        normalizeValue(bank_account_number, partner.bank_account_number),
        normalizeValue(ifsc_code, partner.ifsc_code),
        normalizeValue(branch_name, partner.branch_name),
        normalizeValue(upi_id, partner.upi_id),
        normalizeValue(available_areas, partner.available_areas),
        normalizeBoolean(available_time_morning) ? 1 : 0,
        normalizeBoolean(available_time_afternoon) ? 1 : 0,
        normalizeBoolean(available_time_evening) ? 1 : 0,
        normalizeBoolean(available_time_night) ? 1 : 0,
        normalizeValue(preferred_distance, partner.preferred_distance),
        normalizeValue(delivery_radius, partner.delivery_radius),
        normalizeValue(driving_experience, partner.driving_experience),
        normalizeValue(status, partner.status),
        id
      ]
    );

    res.json({ message: 'Delivery Partner updated successfully.' });
  } catch (error) {
    console.error('❌ Error updating delivery partner:', error.message);
    res.status(500).json({ message: 'Error updating delivery partner.', error: error.message });
  }
};

exports.deleteDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM delivery_partners WHERE id = ?", [id]);
    res.json({ message: 'Delivery Partner deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute(
      `UPDATE delivery_partners SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    res.json({ message: 'Delivery Partner status updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery partner status.', error: error.message });
  }
};


