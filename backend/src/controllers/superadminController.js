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

    res.json({
      cards: {
        totalUsers,
        totalRestaurants,
        totalHomeChefs,
        totalDeliveryPartners,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue),
        pendingApprovals,
        activeFranchises,
        totalFranchises,
        expiredFranchises,
        expiringSoonFranchises
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
    // Ensure created_by columns exist (safe migration)
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}

    const currentUserId = req.user?.user_id || null;
    let rows;

    if (req.user?.role !== 'superadmin') {
      if (currentUserId) {
        const [filtered] = await pool.execute(
          "SELECT * FROM home_chefs WHERE created_by_user_id = ? OR created_by_id = ? ORDER BY created_at DESC",
          [currentUserId, req.user.id]
        );
        rows = filtered;
      } else if (req.user?.id) {
        const [filtered] = await pool.execute(
          "SELECT * FROM home_chefs WHERE created_by_id = ? ORDER BY created_at DESC",
          [req.user.id]
        );
        rows = filtered;
      } else {
        rows = [];
      }
    } else {
      const [all] = await pool.execute("SELECT * FROM home_chefs ORDER BY created_at DESC");
      rows = all;
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chefs.', error: error.message });
  }
};

exports.getHomeChefById = async (req, res) => {
  try {
    const chefId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [chefId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Home chef not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chef details.', error: error.message });
  }
};

exports.createHomeChef = async (req, res) => {
  try {
    // Ensure created_by and franchise columns exist (safe migration)
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS created_by_phone VARCHAR(50) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS franchise_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE home_chefs ADD COLUMN IF NOT EXISTS franchise_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}

    const {
      chef_unique_code, name, father_husband_name, gender, date_of_birth, age,
      mobile, alt_mobile, whatsapp_number, email, emergency_contact,
      door_number, street_name, area_name, landmark, city, district, state, pincode,
      latitude, longitude, map_link, kitchen_name, kitchen_address, kitchen_type,
      seating_available, dining_available, takeaway_available, delivery_available,
      specialty_food, cuisine_type, signature_dish, veg_nonveg, experience_years,
      cooking_style, preparation_time, daily_order_capacity, available_days,
      opening_time, closing_time, holiday_schedule, busy_hours, instant_order, pre_order,
      aadhaar_number, pan_number, fssai_number, gst_number, bank_account_number,
      ifsc_code, account_holder_name, upi_id, username, password, otp_verified,
      email_verified, login_status, verification_status, approval_status,
      rejection_reason, block_reason, address,
      fssai_available, gst_available, instagram_url, facebook_url, youtube_url, website_url,
      delivery_radius, preorder_available, cutoff_time, about_me, cooking_story, why_choose_me, languages_known
    } = req.body;

    let createdById = req.user?.id || null;
    let createdByUserId = req.user?.user_id || null;
    let createdByName = req.user?.full_name || null;
    let createdByEmail = req.user?.email || null;
    let createdByPhone = req.user?.phone || null;

    // Fetch creator details from DB to ensure all fields are populated
    if (createdById && (!createdByName || !createdByPhone)) {
      const [uRows] = await pool.execute(
        'SELECT user_id, full_name, email, mobile_number FROM users WHERE id = ?',
        [createdById]
      );
      if (uRows.length) {
        createdByUserId = uRows[0].user_id || createdByUserId;
        createdByName = uRows[0].full_name || createdByName;
        createdByEmail = uRows[0].email || createdByEmail;
        createdByPhone = uRows[0].mobile_number || createdByPhone;
      }
    }

    // Fallback to a system admin if creator info is still missing
    if (!createdById) {
      try {
        const [adminRows] = await pool.execute("SELECT id, user_id, full_name AS full_name, email, mobile_number FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
        if (adminRows.length) {
          const a = adminRows[0];
          createdById = a.id;
          createdByUserId = a.user_id || createdByUserId;
          createdByName = a.full_name || 'System Admin';
          createdByEmail = a.email || null;
          createdByPhone = a.mobile_number || null;
        }
      } catch (e) {}
    }

    let resolvedFranchiseId = null;
    let resolvedFranchiseUserId = null;
    if (createdByUserId) {
      try {
        const [fRows] = await pool.execute('SELECT franchise_id, franch_user_id, user_id FROM franchise_owners WHERE user_id = ? OR franch_user_id = ? LIMIT 1', [createdByUserId, createdByUserId]);
        if (fRows.length > 0) {
          resolvedFranchiseId = fRows[0].franchise_id;
          resolvedFranchiseUserId = fRows[0].franch_user_id || fRows[0].user_id || createdByUserId;
        }
      } catch(err) {
        console.error('Error fetching franchise owner details:', err);
      }
    }


    // chef_unique_code is removed as it does not exist in the database schema

    // Auto-calculate age from date_of_birth
    const calculateAgeFromDOB = (dob) => {
      if (!dob) return null;
      const birthDate = new Date(dob);
      const today = new Date();
      let calcAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calcAge--;
      }
      return calcAge > 0 ? calcAge : null;
    };
    const calculatedAge = calculateAgeFromDOB(date_of_birth);

    const profile_photo = (req.files && req.files.profile_photo ? req.files.profile_photo[0].filename : null) || req.body.profile_photo || null;
    const cover_banner = (req.files && req.files.cover_banner ? req.files.cover_banner[0].filename : null) || req.body.cover_banner || null;
    const aadhaar_front_url = (req.files && req.files.aadhaar_front_url ? req.files.aadhaar_front_url[0].filename : null) || req.body.aadhaar_front_url || null;
    const aadhaar_back_url = (req.files && req.files.aadhaar_back_url ? req.files.aadhaar_back_url[0].filename : null) || req.body.aadhaar_back_url || null;
    const pan_card_url = (req.files && req.files.pan_card_url ? req.files.pan_card_url[0].filename : null) || req.body.pan_card_url || null;
    const fssai_certificate_url = (req.files && req.files.fssai_certificate_url ? req.files.fssai_certificate_url[0].filename : null) || req.body.fssai_certificate_url || null;
    const gst_certificate_url = (req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null) || req.body.gst_certificate_url || null;
    const signature_url = (req.files && req.files.signature_url ? req.files.signature_url[0].filename : null) || req.body.signature_url || null;
    const kitchen_photo1 = (req.files && req.files.kitchen_photo1 ? req.files.kitchen_photo1[0].filename : null) || req.body.kitchen_photo1 || null;
    const kitchen_photo2 = (req.files && req.files.kitchen_photo2 ? req.files.kitchen_photo2[0].filename : null) || req.body.kitchen_photo2 || null;
    const kitchen_photo3 = (req.files && req.files.kitchen_photo3 ? req.files.kitchen_photo3[0].filename : null) || req.body.kitchen_photo3 || null;
    const cooking_area_photo = (req.files && req.files.cooking_area_photo ? req.files.cooking_area_photo[0].filename : null) || req.body.cooking_area_photo || null;
    const storage_area_photo = (req.files && req.files.storage_area_photo ? req.files.storage_area_photo[0].filename : null) || req.body.storage_area_photo || null;
    const selfie_verification_url = (req.files && req.files.selfie_verification_url ? req.files.selfie_verification_url[0].filename : null) || req.body.selfie_verification_url || null;
    
    const kitchen_photos = req.files && req.files.kitchen_photos ? req.files.kitchen_photos.map(f => f.filename).join(',') : (req.body.kitchen_photos ? (Array.isArray(req.body.kitchen_photos) ? JSON.stringify(req.body.kitchen_photos) : req.body.kitchen_photos) : null);
    const kitchen_videos = req.files && req.files.kitchen_videos ? req.files.kitchen_videos.map(f => f.filename).join(',') : (req.body.kitchen_videos ? (Array.isArray(req.body.kitchen_videos) ? JSON.stringify(req.body.kitchen_videos) : req.body.kitchen_videos) : null);

    const fullAddress = address || [door_number, street_name, area_name, landmark, city, district, state, pincode].filter(Boolean).join(', ') || '';
    const hashedPw = password ? hashPassword(password) : null;

    const sql = `INSERT INTO home_chefs (
        name, mobile, email, address, fssai_number, aadhaar_url, pan_url, status,
        created_by_id, created_by_user_id, created_by_name, created_by_email, created_by_phone,
        franchise_id, franchise_user_id,
        father_husband_name, gender, date_of_birth, age,
        profile_photo, cover_banner, alt_mobile, whatsapp_number, emergency_contact,
        door_number, street_name, area_name, landmark, city, district, state, pincode,
        latitude, longitude, map_link, kitchen_name, kitchen_address, kitchen_type,
        kitchen_photos, kitchen_videos, seating_available, dining_available, takeaway_available, delivery_available,
        specialty_food, cuisine_type, signature_dish, veg_nonveg, experience_years,
        cooking_style, preparation_time, daily_order_capacity, available_days,
        opening_time, closing_time, holiday_schedule, busy_hours, instant_order, pre_order,
        aadhaar_number, pan_number, gst_number, bank_account_number,
        ifsc_code, account_holder_name, upi_id, username, password, otp_verified,
        email_verified, last_login, device_details, login_status, verification_status, approval_status,
        approved_by_admin, approval_date, rejection_reason, block_reason,
        aadhaar_front_url, aadhaar_back_url, pan_card_url, fssai_certificate_url, gst_certificate_url, signature_url, kitchen_photo1, kitchen_photo2, kitchen_photo3, cooking_area_photo, storage_area_photo, selfie_verification_url,
        instagram_url, facebook_url, youtube_url, website_url, fssai_available, gst_available,
        delivery_radius, preorder_available, cutoff_time, about_me, cooking_story, why_choose_me, languages_known
      ) VALUES (${Array(104).fill('?').join(', ')})`;

    const params = [
      name,
      mobile,
      email,
      fullAddress,
      fssai_number || null,
      null, // aadhaar_url
      null, // pan_url
      approval_status || 'Pending', // status
      createdById,
      createdByUserId,
      createdByName,
      createdByEmail,
      createdByPhone,
      resolvedFranchiseId,
      resolvedFranchiseUserId,
      father_husband_name || null,
      gender || null,
      date_of_birth || null,
      calculatedAge !== null ? calculatedAge : (age ? parseInt(age) : null),
      profile_photo,
      cover_banner,
      alt_mobile || null,
      whatsapp_number || null,
      emergency_contact || null,
      door_number || null,
      street_name || null,
      area_name || null,
      landmark || null,
      city || null,
      district || null,
      state || null,
      pincode || null,
      latitude || null,
      longitude || null,
      map_link || null,
      kitchen_name || null,
      kitchen_address || null,
      kitchen_type || 'Home Kitchen',
      kitchen_photos,
      kitchen_videos,
      seating_available === 'true' || seating_available === true ? 1 : 0,
      dining_available === 'true' || dining_available === true ? 1 : 0,
      takeaway_available === 'true' || takeaway_available === true ? 1 : 0,
      delivery_available === 'true' || delivery_available === true ? 1 : 0,
      specialty_food || null,
      cuisine_type || 'South Indian',
      signature_dish || null,
      veg_nonveg || 'Veg',
      experience_years ? parseInt(experience_years) : null,
      cooking_style || null,
      preparation_time || null,
      daily_order_capacity ? parseInt(daily_order_capacity) : null,
      available_days || null,
      opening_time || null,
      closing_time || null,
      holiday_schedule || null,
      busy_hours || null,
      instant_order === 'true' || instant_order === true ? 1 : 0,
      pre_order === 'true' || pre_order === true ? 1 : 0,
      aadhaar_number || null,
      pan_number || null,
      gst_number || null,
      bank_account_number || null,
      ifsc_code || null,
      account_holder_name || null,
      upi_id || null,
      username || null,
      hashedPw,
      otp_verified === 'true' || otp_verified === true ? 1 : 0,
      email_verified === 'true' || email_verified === true ? 1 : 0,
      null, // last_login
      null, // device_details
      login_status || 'Active',
      verification_status || 'Pending',
      approval_status || 'Pending',
      null, // approved_by_admin
      null, // approval_date
      rejection_reason || null,
      block_reason || null,
      aadhaar_front_url,
      aadhaar_back_url,
      pan_card_url,
      fssai_certificate_url,
      gst_certificate_url,
      signature_url,
      kitchen_photo1,
      kitchen_photo2,
      kitchen_photo3,
      cooking_area_photo,
      storage_area_photo,
      selfie_verification_url,
      instagram_url || null,
      facebook_url || null,
      youtube_url || null,
      website_url || null,
      fssai_available || 'No',
      gst_available || 'No',
      delivery_radius || '5 KM',
      preorder_available === 'true' || preorder_available === true ? 1 : 0,
      cutoff_time || null,
      about_me || null,
      cooking_story || null,
      why_choose_me || null,
      languages_known || null
    ];

    // Debug checks
    try {
      const colsMatch = sql.match(/INSERT INTO\s+home_chefs\s*\(([^)]*)\)\s*VALUES/i);
      const colsCount = colsMatch ? colsMatch[1].split(',').filter(c => c.trim()).length : null;
      const placeholders = (sql.match(/\?/g) || []).length;
      if (colsCount !== placeholders) console.error('home_chefs: columns vs placeholders mismatch', colsCount, placeholders);
      if (placeholders !== params.length) console.error('home_chefs: placeholders vs params length mismatch', placeholders, params.length);
      console.log('home_chefs insert debug:', { colsCount, placeholders, paramsLength: params.length });
    } catch (e) { console.error('Debug check failed', e); }

    const [result] = await pool.execute(sql, params);

    await syncUserForEntity('home_chefs', result.insertId, 'chef');
    res.status(201).json({ message: 'Home chef application submitted.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating home chef.', error: error.message });
  }
};

exports.updateHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chef_unique_code, name, father_husband_name, gender, date_of_birth, age,
      mobile, alt_mobile, whatsapp_number, email, emergency_contact,
      door_number, street_name, area_name, landmark, city, district, state, pincode,
      latitude, longitude, map_link, kitchen_name, kitchen_address, kitchen_type,
      seating_available, dining_available, takeaway_available, delivery_available,
      specialty_food, cuisine_type, signature_dish, veg_nonveg, experience_years,
      cooking_style, preparation_time, daily_order_capacity, available_days,
      opening_time, closing_time, holiday_schedule, busy_hours, instant_order, pre_order,
      aadhaar_number, pan_number, fssai_number, gst_number, bank_account_number,
      ifsc_code, account_holder_name, upi_id, username, password, otp_verified,
      email_verified, login_status, verification_status, approval_status,
      rejection_reason, block_reason, address,
      fssai_available, gst_available, instagram_url, facebook_url, youtube_url, website_url,
      delivery_radius, preorder_available, cutoff_time, about_me, cooking_story, why_choose_me, languages_known
    } = req.body;

    const profile_photo = (req.files && req.files.profile_photo ? req.files.profile_photo[0].filename : null) || req.body.profile_photo || null;
    const cover_banner = (req.files && req.files.cover_banner ? req.files.cover_banner[0].filename : null) || req.body.cover_banner || null;
    const aadhaar_front_url = (req.files && req.files.aadhaar_front_url ? req.files.aadhaar_front_url[0].filename : null) || req.body.aadhaar_front_url || null;
    const aadhaar_back_url = (req.files && req.files.aadhaar_back_url ? req.files.aadhaar_back_url[0].filename : null) || req.body.aadhaar_back_url || null;
    const pan_card_url = (req.files && req.files.pan_card_url ? req.files.pan_card_url[0].filename : null) || req.body.pan_card_url || null;
    const fssai_certificate_url = (req.files && req.files.fssai_certificate_url ? req.files.fssai_certificate_url[0].filename : null) || req.body.fssai_certificate_url || null;
    const gst_certificate_url = (req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null) || req.body.gst_certificate_url || null;
    const signature_url = (req.files && req.files.signature_url ? req.files.signature_url[0].filename : null) || req.body.signature_url || null;
    const kitchen_photo1 = (req.files && req.files.kitchen_photo1 ? req.files.kitchen_photo1[0].filename : null) || req.body.kitchen_photo1 || null;
    const kitchen_photo2 = (req.files && req.files.kitchen_photo2 ? req.files.kitchen_photo2[0].filename : null) || req.body.kitchen_photo2 || null;
    const kitchen_photo3 = (req.files && req.files.kitchen_photo3 ? req.files.kitchen_photo3[0].filename : null) || req.body.kitchen_photo3 || null;
    const cooking_area_photo = (req.files && req.files.cooking_area_photo ? req.files.cooking_area_photo[0].filename : null) || req.body.cooking_area_photo || null;
    const storage_area_photo = (req.files && req.files.storage_area_photo ? req.files.storage_area_photo[0].filename : null) || req.body.storage_area_photo || null;
    const selfie_verification_url = (req.files && req.files.selfie_verification_url ? req.files.selfie_verification_url[0].filename : null) || req.body.selfie_verification_url || null;
    
    const kitchen_photos = req.files && req.files.kitchen_photos ? req.files.kitchen_photos.map(f => f.filename).join(',') : (req.body.kitchen_photos ? (Array.isArray(req.body.kitchen_photos) ? JSON.stringify(req.body.kitchen_photos) : req.body.kitchen_photos) : null);
    const kitchen_videos = req.files && req.files.kitchen_videos ? req.files.kitchen_videos.map(f => f.filename).join(',') : (req.body.kitchen_videos ? (Array.isArray(req.body.kitchen_videos) ? JSON.stringify(req.body.kitchen_videos) : req.body.kitchen_videos) : null).body.kitchen_videos ? (Array.isArray(req.body.kitchen_videos) ? JSON.stringify(req.body.kitchen_videos) : req.body.kitchen_videos) : null);

    const fullAddress = address || [door_number, street_name, area_name, landmark, city, district, state, pincode].filter(Boolean).join(', ') || '';

    const calculateAgeFromDOB = (dob) => {
      if (!dob) return null;
      const today = new Date();
      const birthDate = new Date(dob);
      if (isNaN(birthDate)) return null;
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      return calculatedAge;
    };
    
    const calculatedAgeForUpdate = calculateAgeFromDOB(date_of_birth);

    let query = `UPDATE home_chefs SET 
      name = ?, father_husband_name = ?, gender = ?, date_of_birth = ?, age = ?,
      mobile = ?, alt_mobile = ?, whatsapp_number = ?, email = ?, emergency_contact = ?,
      door_number = ?, street_name = ?, area_name = ?, landmark = ?, city = ?, district = ?, state = ?, pincode = ?,
      latitude = ?, longitude = ?, map_link = ?, kitchen_name = ?, kitchen_address = ?, kitchen_type = ?,
      seating_available = ?, dining_available = ?, takeaway_available = ?, delivery_available = ?,
      specialty_food = ?, cuisine_type = ?, signature_dish = ?, veg_nonveg = ?, experience_years = ?,
      cooking_style = ?, preparation_time = ?, daily_order_capacity = ?, available_days = ?,
      opening_time = ?, closing_time = ?, holiday_schedule = ?, busy_hours = ?, instant_order = ?, pre_order = ?,
      aadhaar_number = ?, pan_number = ?, fssai_number = ?, gst_number = ?, bank_account_number = ?,
      ifsc_code = ?, account_holder_name = ?, upi_id = ?, username = ?, otp_verified = ?,
      email_verified = ?, login_status = ?, verification_status = ?, approval_status = ?, status = ?,
      rejection_reason = ?, block_reason = ?, address = ?`;

    let params = [
      name, father_husband_name || null, gender || null, date_of_birth || null, calculatedAgeForUpdate !== null ? calculatedAgeForUpdate : (age ? parseInt(age) : null),
      mobile, alt_mobile || null, whatsapp_number || null, email, emergency_contact || null,
      door_number || null, street_name || null, area_name || null, landmark || null, city || null, district || null, state || null, pincode || null,
      latitude || null, longitude || null, map_link || null, kitchen_name || null, kitchen_address || null, kitchen_type || 'Home Kitchen',
      seating_available === 'true' || seating_available === true ? 1 : 0,
      dining_available === 'true' || dining_available === true ? 1 : 0,
      takeaway_available === 'true' || takeaway_available === true ? 1 : 0,
      delivery_available === 'true' || delivery_available === true ? 1 : 0,
      specialty_food || null, cuisine_type || 'South Indian', signature_dish || null, veg_nonveg || 'Veg', experience_years ? parseInt(experience_years) : null,
      cooking_style || null, preparation_time || null, daily_order_capacity ? parseInt(daily_order_capacity) : null, available_days || null,
      opening_time || null, closing_time || null, holiday_schedule || null, busy_hours || null,
      instant_order === 'true' || instant_order === true ? 1 : 0,
      pre_order === 'true' || pre_order === true ? 1 : 0,
      aadhaar_number || null, pan_number || null, fssai_number || null, gst_number || null, bank_account_number || null,
      ifsc_code || null, account_holder_name || null, upi_id || null, username || null,
      otp_verified === 'true' || otp_verified === true ? 1 : 0,
      email_verified === 'true' || email_verified === true ? 1 : 0,
      login_status || 'Active', verification_status || 'Pending', approval_status || 'Pending', approval_status || 'Pending',
      rejection_reason || null, block_reason || null, fullAddress
    ];

    if (profile_photo) { query += `, profile_photo = ?`; params.push(profile_photo); }
    if (cover_banner) { query += `, cover_banner = ?`; params.push(cover_banner); }
    if (aadhaar_front_url) { query += `, aadhaar_front_url = ?`; params.push(aadhaar_front_url); }
    if (aadhaar_back_url) { query += `, aadhaar_back_url = ?`; params.push(aadhaar_back_url); }
    if (pan_card_url) { query += `, pan_card_url = ?`; params.push(pan_card_url); }
    if (fssai_certificate_url) { query += `, fssai_certificate_url = ?`; params.push(fssai_certificate_url); }
    if (gst_certificate_url) { query += `, gst_certificate_url = ?`; params.push(gst_certificate_url); }
    if (signature_url) { query += `, signature_url = ?`; params.push(signature_url); }
    if (kitchen_photo1) { query += `, kitchen_photo1 = ?`; params.push(kitchen_photo1); }
    if (kitchen_photo2) { query += `, kitchen_photo2 = ?`; params.push(kitchen_photo2); }
    if (kitchen_photo3) { query += `, kitchen_photo3 = ?`; params.push(kitchen_photo3); }
    if (cooking_area_photo) { query += `, cooking_area_photo = ?`; params.push(cooking_area_photo); }
    if (storage_area_photo) { query += `, storage_area_photo = ?`; params.push(storage_area_photo); }
    if (selfie_verification_url) { query += `, selfie_verification_url = ?`; params.push(selfie_verification_url); }
    if (kitchen_photos) { query += `, kitchen_photos = ?`; params.push(kitchen_photos); }
    if (kitchen_videos) { query += `, kitchen_videos = ?`; params.push(kitchen_videos); }

    // Social Media & Profile Fields
    if (instagram_url) { query += `, instagram_url = ?`; params.push(instagram_url); }
    if (facebook_url) { query += `, facebook_url = ?`; params.push(facebook_url); }
    if (youtube_url) { query += `, youtube_url = ?`; params.push(youtube_url); }
    if (website_url) { query += `, website_url = ?`; params.push(website_url); }

    // Business Flags & Delivery
    if (fssai_available) { query += `, fssai_available = ?`; params.push(fssai_available); }
    if (gst_available) { query += `, gst_available = ?`; params.push(gst_available); }
    if (delivery_radius) { query += `, delivery_radius = ?`; params.push(delivery_radius); }
    if (preorder_available !== undefined) { query += `, preorder_available = ?`; params.push(preorder_available === 'true' || preorder_available === true ? 1 : 0); }
    if (cutoff_time) { query += `, cutoff_time = ?`; params.push(cutoff_time); }

    // Creator Profile
    if (about_me) { query += `, about_me = ?`; params.push(about_me); }
    if (cooking_story) { query += `, cooking_story = ?`; params.push(cooking_story); }
    if (why_choose_me) { query += `, why_choose_me = ?`; params.push(why_choose_me); }
    if (languages_known) { query += `, languages_known = ?`; params.push(languages_known); }

    if (password) {
      query += `, password = ?`;
      params.push(hashPassword(password));
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);
    await syncUserForEntity('home_chefs', id, 'chef');
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
    await syncUserForEntity('home_chefs', id, 'chef');
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

// ==================== DELIVERY PARTNER MANAGEMENT ====================
exports.getDeliveryPartners = async (req, res) => {
  try {
    // Ensure created_by columns exist (safe migration)
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}

    const currentUserId = req.user?.user_id || null;
    let rows;

    if (req.user?.role !== 'superadmin') {
      if (currentUserId) {
        const [filtered] = await pool.execute(
          "SELECT * FROM delivery_partners WHERE created_by_user_id = ? OR created_by_id = ? ORDER BY created_at DESC",
          [currentUserId, req.user.id]
        );
        rows = filtered;
      } else if (req.user?.id) {
        const [filtered] = await pool.execute(
          "SELECT * FROM delivery_partners WHERE created_by_id = ? ORDER BY created_at DESC",
          [req.user.id]
        );
        rows = filtered;
      } else {
        rows = [];
      }
    } else {
      const [all] = await pool.execute("SELECT * FROM delivery_partners ORDER BY created_at DESC");
      rows = all;
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partners.', error: error.message });
  }
};

exports.createDeliveryPartner = async (req, res) => {
  try {
    // Ensure created_by columns exist (safe migration)
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS created_by_phone VARCHAR(50) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approved_by_id INT DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approved_by_user_id VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approved_by_email VARCHAR(255) DEFAULT NULL"); } catch (_) {}
    try { await pool.execute("ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS approval_date DATETIME DEFAULT NULL"); } catch (_) {}

    const b = { ...(req.body || {}) };

    // Basic validation
    if (!b.name || !b.mobile) {
      return res.status(400).json({ message: 'Name and mobile are required to create a delivery partner.' });
    }

    // If files were uploaded via multer, map their filenames into the body fields
    if (req.files) {
      const fileFields = [
        'profile_photo','cover_photo','aadhaar_front_url','aadhaar_back_url','pan_card_url','selfie_verification_url','selfie_with_vehicle','selfie_with_aadhaar','police_verification_certificate',
        'vehicle_front_photo','vehicle_back_photo','rc_book_image','insurance_document_image','license_front_image','license_back_image'
      ];
      fileFields.forEach((f) => {
        if (req.files[f] && req.files[f][0]) {
          b[f] = req.files[f][0].filename;
        }
      });
    }

    // Auto-generate delivery_partner_code: DP-YYYYMMDD-XXXXX
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = String(Math.floor(10000 + Math.random() * 90000));
    const delivery_partner_code = b.delivery_partner_code || `DP-${datePart}-${randomPart}`;

    const hashedPw = b.password ? hashPassword(b.password) : null;

    // Attach current user info (created_by) when available
    let created_by_id = null, created_by_user_id = null, created_by_name = null, created_by_email = null, created_by_phone = null;
    if (req.user && req.user.id) {
      const [uRows] = await pool.execute('SELECT id, user_id, full_name AS name, email, mobile_number AS phone FROM users WHERE id = ?', [req.user.id]);
      if (uRows.length) {
        const cu = uRows[0];
        created_by_id = cu.id;
        created_by_user_id = cu.user_id || null;
        created_by_name = cu.name || null;
        created_by_email = cu.email || null;
        created_by_phone = cu.phone || null;
      }
    }
    // Fallback: if no request user (e.g. seeded data or missing auth), use a system admin as creator
    if (!created_by_id) {
      try {
        const [adminRows] = await pool.execute("SELECT id, user_id, full_name AS name, email, mobile_number AS phone FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
        if (adminRows.length) {
          const au = adminRows[0];
          created_by_id = au.id;
          created_by_user_id = au.user_id || null;
          created_by_name = au.name || 'System Admin';
          created_by_email = au.email || null;
          created_by_phone = au.phone || null;
        }
      } catch (e) {
        // ignore fallback errors
      }
    }

    // If status is Approved at creation, set approver metadata
    let approved_by_id = null, approved_by_user_id = null, approved_by_name = null, approved_by_email = null, approval_date = null;
    if ((b.status || '').toLowerCase() === 'approved') {
      approval_date = new Date();
      if (req.user && req.user.id) {
        const [uRows2] = await pool.execute('SELECT id, user_id, full_name AS name, email FROM users WHERE id = ?', [req.user.id]);
        if (uRows2.length) {
          const au = uRows2[0];
          approved_by_id = au.id;
          approved_by_user_id = au.user_id || null;
          approved_by_name = au.name || null;
          approved_by_email = au.email || null;
        }
      }
      if (!approved_by_id) {
        try {
          const [adminRows2] = await pool.execute("SELECT id, user_id, full_name AS name, email FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
          if (adminRows2.length) {
            const au = adminRows2[0];
            approved_by_id = au.id;
            approved_by_user_id = au.user_id || null;
            approved_by_name = au.name || 'System Admin';
            approved_by_email = au.email || null;
          }
        } catch (e) {}
      }
    }

    const params = [
      delivery_partner_code, b.name || null, b.father_husband_name || null, b.gender || 'Male', b.date_of_birth || null, b.age || null, b.profile_photo || null, b.cover_photo || null, b.marital_status || 'Single', b.blood_group || null,
      b.mobile || null, b.alt_mobile || null, b.whatsapp_number || null, b.email || null, b.emergency_contact || null,
      b.door_number || null, b.street_name || null, b.current_address || null, b.permanent_address || null, b.area_name || null, b.landmark || null, b.city || null, b.district || null, b.state || null, b.pincode || null, b.country || 'India', b.latitude || null, b.longitude || null, b.live_location || null, b.map_link || null,
      b.username || null, hashedPw, b.otp_verified ? 1 : 0, b.email_verified ? 1 : 0, b.device_id || null, b.login_status || 'Active', b.account_status || 'Pending',
      b.vehicle_type || null, b.vehicle_brand || null, b.vehicle_model || null, b.vehicle_color || null, b.vehicle_number || null, b.rc_book_number || null, b.insurance_number || null, b.insurance_expiry_date || null, b.pollution_certificate_number || null,
      b.vehicle_front_photo || null, b.vehicle_back_photo || null, b.rc_book_image || null, b.insurance_document_image || null,
      b.license_number || null, b.license_holder_name || null, b.license_issue_date || null, b.license_expiry_date || null, b.license_front_image || null, b.license_back_image || null, b.driving_experience || null,
      b.aadhaar_number || null, b.pan_number || null, b.aadhaar_front_url || null, b.aadhaar_back_url || null, b.pan_card_url || null, b.selfie_verification_url || null, b.selfie_with_vehicle || null, b.selfie_with_aadhaar || null, b.police_verification_certificate || null, b.background_verification_status || 'Pending', b.kyc_verification_status || 'Pending',
      b.bank_name || null, b.account_holder_name || null, b.bank_account_number || null, b.ifsc_code || null, b.branch_name || null, b.upi_id || null,
      b.wallet_balance || 0, b.pending_earnings || 0, b.total_earnings || b.earnings || 0, b.daily_earnings || 0, b.weekly_earnings || 0, b.monthly_earnings || 0, b.incentive_amount || 0, b.bonus_amount || 0,
      b.online_status || 'Offline', b.availability_schedule || null, b.working_days || null, b.shift_timing || null, b.current_location || null, b.break_time_status || null,
      b.assigned_delivery_area || null, b.delivery_radius || null, b.preferred_delivery_zone || null, b.preferred_distance || '3 KM', b.city_coverage || null, b.area_coverage || null, b.zone_status || 'Active',
      b.emergency_contact_name || null, b.emergency_contact_relationship || null, b.emergency_contact_mobile || null,
      b.available_time_morning ? 1 : 0, b.available_time_afternoon ? 1 : 0, b.available_time_evening ? 1 : 0, b.available_time_night ? 1 : 0,
      b.face_verified ? 1 : 0, b.location_verified ? 1 : 0,
      // created_by fields
      created_by_id, created_by_user_id, created_by_name, created_by_email, created_by_phone,
      b.status || 'Pending'
    ];

    // Append approver fields if any
    if (approved_by_id !== null) {
      params.push(approved_by_id, approved_by_user_id, approved_by_name, approved_by_email, approval_date);
    }

    const placeholders = params.map(() => '?').join(', ');
    const cols = `delivery_partner_code, name, father_husband_name, gender, date_of_birth, age, profile_photo, cover_photo, marital_status, blood_group,
        mobile, alt_mobile, whatsapp_number, email, emergency_contact,
        door_number, street_name, current_address, permanent_address, area_name, landmark, city, district, state, pincode, country, latitude, longitude, live_location, map_link,
        username, password, otp_verified, email_verified, device_id, login_status, account_status,
        vehicle_type, vehicle_brand, vehicle_model, vehicle_color, vehicle_number, rc_book_number, insurance_number, insurance_expiry_date, pollution_certificate_number,
        vehicle_front_photo, vehicle_back_photo, rc_book_image, insurance_document_image,
        license_number, license_holder_name, license_issue_date, license_expiry_date, license_front_image, license_back_image, driving_experience,
        aadhaar_number, pan_number, aadhaar_front_url, aadhaar_back_url, pan_card_url, selfie_verification_url, selfie_with_vehicle, selfie_with_aadhaar, police_verification_certificate, background_verification_status, kyc_verification_status,
        bank_name, account_holder_name, bank_account_number, ifsc_code, branch_name, upi_id,
        wallet_balance, pending_earnings, total_earnings, daily_earnings, weekly_earnings, monthly_earnings, incentive_amount, bonus_amount,
        online_status, availability_schedule, working_days, shift_timing, current_location, break_time_status,
        assigned_delivery_area, delivery_radius, preferred_delivery_zone, preferred_distance, city_coverage, area_coverage, zone_status,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_mobile,
        available_time_morning, available_time_afternoon, available_time_evening, available_time_night,
        face_verified, location_verified,
        created_by_id, created_by_user_id, created_by_name, created_by_email, created_by_phone,
        status${approved_by_id !== null ? ', approved_by_id, approved_by_user_id, approved_by_name, approved_by_email, approval_date' : ''}`;

    const [result] = await pool.execute(`INSERT INTO delivery_partners (${cols}) VALUES (${placeholders})`, params);
    // sync user only if record status requires it (syncUserForEntity will noop otherwise)
    await syncUserForEntity('delivery_partners', result.insertId, 'delivery_partner');
    res.status(201).json({ message: 'Delivery partner registered.', id: result.insertId, delivery_partner_code });
  } catch (error) {
    res.status(500).json({ message: 'Error registering delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;

    if (req.files) {
      const fileFields = [
        'profile_photo','cover_photo','aadhaar_front_url','aadhaar_back_url','pan_card_url','selfie_verification_url','selfie_with_vehicle','selfie_with_aadhaar','police_verification_certificate',
        'vehicle_front_photo','vehicle_back_photo','rc_book_image','insurance_document_image','license_front_image','license_back_image'
      ];
      fileFields.forEach((f) => {
        if (req.files[f] && req.files[f][0]) {
          b[f] = req.files[f][0].filename;
        }
      });
    }

    let query = `UPDATE delivery_partners SET
      name = ?, father_husband_name = ?, gender = ?, date_of_birth = ?, age = ?, marital_status = ?, blood_group = ?,
      mobile = ?, alt_mobile = ?, whatsapp_number = ?, email = ?, emergency_contact = ?,
      door_number = ?, street_name = ?, current_address = ?, permanent_address = ?, area_name = ?, landmark = ?, city = ?, district = ?, state = ?, pincode = ?, country = ?, latitude = ?, longitude = ?, live_location = ?, map_link = ?,
      username = ?, otp_verified = ?, email_verified = ?, device_id = ?, login_status = ?, account_status = ?,
      vehicle_type = ?, vehicle_brand = ?, vehicle_model = ?, vehicle_color = ?, vehicle_number = ?, rc_book_number = ?, insurance_number = ?, insurance_expiry_date = ?, pollution_certificate_number = ?,
      vehicle_front_photo = ?, vehicle_back_photo = ?, rc_book_image = ?, insurance_document_image = ?,
      license_number = ?, license_holder_name = ?, license_issue_date = ?, license_expiry_date = ?, license_front_image = ?, license_back_image = ?, driving_experience = ?,
      aadhaar_number = ?, pan_number = ?, aadhaar_front_url = ?, aadhaar_back_url = ?, pan_card_url = ?, selfie_verification_url = ?, selfie_with_vehicle = ?, selfie_with_aadhaar = ?, police_verification_certificate = ?, background_verification_status = ?, kyc_verification_status = ?,
      bank_name = ?, account_holder_name = ?, bank_account_number = ?, ifsc_code = ?, branch_name = ?, upi_id = ?,
      wallet_balance = ?, pending_earnings = ?, total_earnings = ?, daily_earnings = ?, weekly_earnings = ?, monthly_earnings = ?, incentive_amount = ?, bonus_amount = ?, total_deliveries = ?,
      online_status = ?, availability_schedule = ?, working_days = ?, shift_timing = ?, current_location = ?, break_time_status = ?,
      assigned_delivery_area = ?, delivery_radius = ?, preferred_delivery_zone = ?, preferred_distance = ?, city_coverage = ?, area_coverage = ?, zone_status = ?,
      emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_mobile = ?,
      available_time_morning = ?, available_time_afternoon = ?, available_time_evening = ?, available_time_night = ?,
      face_verified = ?, location_verified = ?,
      status = ?`;

    let params = [
      b.name || null, b.father_husband_name || null, b.gender || 'Male', b.date_of_birth || null, b.age || null, b.marital_status || 'Single', b.blood_group || null,
      b.mobile || null, b.alt_mobile || null, b.whatsapp_number || null, b.email || null, b.emergency_contact || null,
      b.door_number || null, b.street_name || null, b.current_address || null, b.permanent_address || null, b.area_name || null, b.landmark || null, b.city || null, b.district || null, b.state || null, b.pincode || null, b.country || 'India', b.latitude || null, b.longitude || null, b.live_location || null, b.map_link || null,
      b.username || null, normalizeBoolean(b.otp_verified) ? 1 : 0, normalizeBoolean(b.email_verified) ? 1 : 0, b.device_id || null, b.login_status || 'Active', b.account_status || 'Pending',
      b.vehicle_type || null, b.vehicle_brand || null, b.vehicle_model || null, b.vehicle_color || null, b.vehicle_number || null, b.rc_book_number || null, b.insurance_number || null, b.insurance_expiry_date || null, b.pollution_certificate_number || null,
      b.vehicle_front_photo || null, b.vehicle_back_photo || null, b.rc_book_image || null, b.insurance_document_image || null,
      b.license_number || null, b.license_holder_name || null, b.license_issue_date || null, b.license_expiry_date || null, b.license_front_image || null, b.license_back_image || null, b.driving_experience || null,
      b.aadhaar_number || null, b.pan_number || null, b.aadhaar_front_url || null, b.aadhaar_back_url || null, b.pan_card_url || null, b.selfie_verification_url || null, b.selfie_with_vehicle || null, b.selfie_with_aadhaar || null, b.police_verification_certificate || null, b.background_verification_status || 'Pending', b.kyc_verification_status || 'Pending',
      b.bank_name || null, b.account_holder_name || null, b.bank_account_number || null, b.ifsc_code || null, b.branch_name || null, b.upi_id || null,
      b.wallet_balance || 0, b.pending_earnings || 0, b.total_earnings || b.earnings || 0, b.daily_earnings || 0, b.weekly_earnings || 0, b.monthly_earnings || 0, b.incentive_amount || 0, b.bonus_amount || 0, b.total_deliveries || 0,
      b.online_status || 'Offline', b.availability_schedule || null, b.working_days || null, b.shift_timing || null, b.current_location || null, b.break_time_status || null,
      b.assigned_delivery_area || null, b.delivery_radius || null, b.preferred_delivery_zone || null, b.preferred_distance || '3 KM', b.city_coverage || null, b.area_coverage || null, b.zone_status || 'Active',
      b.emergency_contact_name || null, b.emergency_contact_relationship || null, b.emergency_contact_mobile || null,
      normalizeBoolean(b.available_time_morning) ? 1 : 0, normalizeBoolean(b.available_time_afternoon) ? 1 : 0, normalizeBoolean(b.available_time_evening) ? 1 : 0, normalizeBoolean(b.available_time_night) ? 1 : 0,
      normalizeBoolean(b.face_verified) ? 1 : 0, normalizeBoolean(b.location_verified) ? 1 : 0,
      b.status || 'Pending'
    ];

    // If status being set to Approved, record approver metadata
    if ((b.status || '').toLowerCase() === 'approved') {
      let approved_by_id = null, approved_by_user_id = null, approved_by_name = null, approved_by_email = null, approval_date = new Date();
      if (req.user && req.user.id) {
        const [uRows] = await pool.execute('SELECT id, user_id, full_name AS name, email FROM users WHERE id = ?', [req.user.id]);
        if (uRows.length) {
          const au = uRows[0];
          approved_by_id = au.id;
          approved_by_user_id = au.user_id || null;
          approved_by_name = au.name || null;
          approved_by_email = au.email || null;
        }
      }
      if (!approved_by_id) {
        try {
          const [adminRows] = await pool.execute("SELECT id, user_id, full_name AS name, email FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
          if (adminRows.length) {
            const au = adminRows[0];
            approved_by_id = au.id;
            approved_by_user_id = au.user_id || null;
            approved_by_name = au.name || 'System Admin';
            approved_by_email = au.email || null;
          }
        } catch (e) {}
      }

      query += `, approved_by_id = ?, approved_by_user_id = ?, approved_by_name = ?, approved_by_email = ?, approval_date = ?`;
      params.push(approved_by_id, approved_by_user_id, approved_by_name, approved_by_email, approval_date);
    }

    if (b.password) {
      query += `, password = ?`;
      params.push(hashPassword(b.password));
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);
    const syncResult = await syncUserForEntity('delivery_partners', id, 'delivery_partner');
    if (syncResult && syncResult.created) {
      res.json({ message: 'Delivery partner profile updated and user created.', user: syncResult.user, password: syncResult.plainPassword });
    } else {
      res.json({ message: 'Delivery partner profile updated.' });
    }
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
    const [rows] = await pool.execute("SELECT id, franchise_id, franch_user_id, franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, start_date, expiry_date, territory_pincodes, created_at, login_password IS NOT NULL AS password_preset FROM franchise_owners ORDER BY created_at DESC");
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
    try { await pool.execute("ALTER TABLE franchise_owners ADD COLUMN IF NOT EXISTS created_by_phone VARCHAR(50) DEFAULT NULL"); } catch (_) {}

    const { 
      franchise_name, owner_name, mobile, email, city, state, commission_percentage, status, password,
      business_registration_number, gst_number, pan_number, start_date, expiry_date,
      alt_mobile, whatsapp_number, website_url, emergency_contact_number,
      territory_pincodes, aadhaar_number,
      door_number, street_name, area, landmark, district, pincode, latitude, longitude, map_link,
      username, role, otp_verified, email_verified, login_status
    } = req.body;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const gst_certificate_url = req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null;
    const fssai_license_url = req.files && req.files.fssai_license_url ? req.files.fssai_license_url[0].filename : null;
    const shop_license_url = req.files && req.files.shop_license_url ? req.files.shop_license_url[0].filename : null;
    const vehicle_rc_url = req.files && req.files.vehicle_rc_url ? req.files.vehicle_rc_url[0].filename : null;
    const driving_license_url = req.files && req.files.driving_license_url ? req.files.driving_license_url[0].filename : null;
    const bank_passbook_url = req.files && req.files.bank_passbook_url ? req.files.bank_passbook_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;

    // Hash password if provided, else store null (will be auto-generated at approval)
    const hashedPw = password ? hashPassword(password) : null;
    const plainPw  = password || null;

    let created_by_id = null, created_by_user_id = null, created_by_name = null, created_by_email = null, created_by_phone = null;
    if (req.user && req.user.id) {
      const [uRows] = await pool.execute('SELECT id, user_id, full_name AS name, email, mobile_number AS phone FROM users WHERE id = ?', [req.user.id]);
      if (uRows.length) {
        const cu = uRows[0];
        created_by_id = cu.id;
        created_by_user_id = cu.user_id || null;
        created_by_name = cu.name || null;
        created_by_email = cu.email || null;
        created_by_phone = cu.phone || null;
      }
    }

    const insertData = {
      franchise_name,
      owner_name,
      mobile,
      email,
      city,
      state,
      commission_percentage: commission_percentage || 10.00,
      status: status || 'Pending',
      login_password: hashedPw,
      business_registration_number: business_registration_number || null,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
      aadhaar_number: aadhaar_number || null,
      start_date: start_date || null,
      expiry_date: expiry_date || null,
      alt_mobile: alt_mobile || null,
      whatsapp_number: whatsapp_number || null,
      website_url: website_url || null,
      emergency_contact_number: emergency_contact_number || null,
      door_number: door_number || null,
      street_name: street_name || null,
      area: area || null,
      landmark: landmark || null,
      district: district || null,
      territory_pincodes: territory_pincodes || null,
      pincode: pincode || null,
      latitude: latitude || null,
      longitude: longitude || null,
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
      gst_certificate_url,
      fssai_license_url,
      shop_license_url,
      vehicle_rc_url,
      driving_license_url,
      bank_passbook_url,
      signature_url,
      created_by_id,
      created_by_user_id,
      created_by_name,
      created_by_email,
      created_by_phone
    };

      // Filter out created_by fields that might not exist in older databases
      const safeInsertData = {};
      const allowedFields = [
        'franchise_name', 'owner_name', 'mobile', 'email', 'city', 'state',
        'commission_percentage', 'status', 'login_password', 'business_registration_number',
        'gst_number', 'pan_number', 'aadhaar_number', 'start_date', 'expiry_date', 'alt_mobile',
        'whatsapp_number', 'website_url', 'emergency_contact_number', 'door_number',
        'street_name', 'area', 'landmark', 'district', 'territory_pincodes', 'pincode',
        'latitude', 'longitude', 'map_link', 'username', 'role', 'otp_verified',
        'email_verified', 'login_status', 'logo_url', 'banner_url', 'aadhaar_url',
        'pan_url', 'gst_certificate_url', 'fssai_license_url', 'shop_license_url',
        'vehicle_rc_url', 'driving_license_url', 'bank_passbook_url', 'signature_url'
      ];
    
      allowedFields.forEach(field => {
        if (field in insertData) {
          safeInsertData[field] = insertData[field];
        }
      });
    
      // Try to add created_by fields, but don't fail if they don't exist
      if (created_by_id) safeInsertData.created_by_id = created_by_id;
      if (created_by_user_id) safeInsertData.created_by_user_id = created_by_user_id;
      if (created_by_name) safeInsertData.created_by_name = created_by_name;
      if (created_by_email) safeInsertData.created_by_email = created_by_email;
      if (created_by_phone) safeInsertData.created_by_phone = created_by_phone;

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

    // Update franchise: Active + link UUID + update login_password
    await pool.execute(
      "UPDATE franchise_owners SET status = 'Active', franch_user_id = ?, login_password = ?, start_date = ?, expiry_date = ? WHERE id = ?",
      [userId, hashedPw, defaultStartDate, defaultExpiryDate, id]
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
      franchise_name, owner_name, mobile, email, city, state, commission_percentage, status,
      business_registration_number, gst_number, pan_number, start_date, expiry_date,
      alt_mobile, whatsapp_number, website_url, emergency_contact_number,
      territory_pincodes, aadhaar_number,
      door_number, street_name, area, landmark, district, pincode, latitude, longitude, map_link,
      username, role, otp_verified, email_verified, login_status
    } = req.body;

    const [existingFranchiseRows] = await pool.execute('SELECT email, franch_user_id FROM franchise_owners WHERE id = ?', [id]);
    if (!existingFranchiseRows.length) {
      return res.status(404).json({ message: 'Franchise not found.' });
    }
    const oldEmail = existingFranchiseRows[0].email;
    const franchiseUserId = existingFranchiseRows[0].franch_user_id;

    const logo_url = req.files && req.files.logo_url ? req.files.logo_url[0].filename : null;
    const banner_url = req.files && req.files.banner_url ? req.files.banner_url[0].filename : null;
    const aadhaar_url = req.files && req.files.aadhaar_url ? req.files.aadhaar_url[0].filename : null;
    const pan_url = req.files && req.files.pan_url ? req.files.pan_url[0].filename : null;
    const gst_certificate_url = req.files && req.files.gst_certificate_url ? req.files.gst_certificate_url[0].filename : null;
    const fssai_license_url = req.files && req.files.fssai_license_url ? req.files.fssai_license_url[0].filename : null;
    const shop_license_url = req.files && req.files.shop_license_url ? req.files.shop_license_url[0].filename : null;
    const vehicle_rc_url = req.files && req.files.vehicle_rc_url ? req.files.vehicle_rc_url[0].filename : null;
    const driving_license_url = req.files && req.files.driving_license_url ? req.files.driving_license_url[0].filename : null;
    const bank_passbook_url = req.files && req.files.bank_passbook_url ? req.files.bank_passbook_url[0].filename : null;
    const signature_url = req.files && req.files.signature_url ? req.files.signature_url[0].filename : null;

    let query = `UPDATE franchise_owners SET 
      franchise_name = ?, owner_name = ?, mobile = ?, email = ?, city = ?, state = ?, commission_percentage = ?, status = ?,
      business_registration_number = ?, gst_number = ?, pan_number = ?, aadhaar_number = ?, start_date = ?, expiry_date = ?,
      alt_mobile = ?, whatsapp_number = ?, website_url = ?, emergency_contact_number = ?,
      door_number = ?, street_name = ?, area = ?, landmark = ?, district = ?, territory_pincodes = ?, pincode = ?, latitude = ?, longitude = ?, map_link = ?,
      username = ?, role = ?, otp_verified = ?, email_verified = ?, login_status = ?`;

    let params = [
      franchise_name, owner_name, mobile, email, city, state, commission_percentage, status,
      business_registration_number || null, gst_number || null, pan_number || null, aadhaar_number || null, start_date || null, expiry_date || null,
      alt_mobile || null, whatsapp_number || null, website_url || null, emergency_contact_number || null,
      door_number || null, street_name || null, area || null, landmark || null, district || null, territory_pincodes || null, pincode || null, latitude || null, longitude || null, map_link || null,
      username || null, role || 'Admin', otp_verified !== undefined ? (otp_verified ? 1 : 0) : 0, email_verified !== undefined ? (email_verified ? 1 : 0) : 0, login_status || 'Active'
    ];

    if (logo_url) { query += `, logo_url = ?`; params.push(logo_url); }
    if (banner_url) { query += `, banner_url = ?`; params.push(banner_url); }
    if (aadhaar_url) { query += `, aadhaar_url = ?`; params.push(aadhaar_url); }
    if (pan_url) { query += `, pan_url = ?`; params.push(pan_url); }
    if (gst_certificate_url) { query += `, gst_certificate_url = ?`; params.push(gst_certificate_url); }
    if (fssai_license_url) { query += `, fssai_license_url = ?`; params.push(fssai_license_url); }
    if (shop_license_url) { query += `, shop_license_url = ?`; params.push(shop_license_url); }
    if (vehicle_rc_url) { query += `, vehicle_rc_url = ?`; params.push(vehicle_rc_url); }
    if (driving_license_url) { query += `, driving_license_url = ?`; params.push(driving_license_url); }
    if (bank_passbook_url) { query += `, bank_passbook_url = ?`; params.push(bank_passbook_url); }
    if (signature_url) { query += `, signature_url = ?`; params.push(signature_url); }

    query += ` WHERE id = ?`;
    params.push(id);

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
