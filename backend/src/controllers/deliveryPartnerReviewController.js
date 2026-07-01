const pool = require("../config/db");

const ensureReviewTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliverypartner_review (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      rating DECIMAL(2,1) NOT NULL,
      comment LONGTEXT,
      image VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Pending',
      delivery_partner_id VARCHAR(255) NOT NULL,
      delivery_partner_name VARCHAR(255),
      delivery_partner_phone VARCHAR(50),
      delivery_partner_email VARCHAR(255),
      admin_reply LONGTEXT,
      franchise_admin_id VARCHAR(255),
      franchise_admin_name VARCHAR(255),
      created_by VARCHAR(255),
      updated_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_delivery_partner_id (delivery_partner_id),
      KEY idx_user_id (user_id),
      KEY idx_status (status),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// =============================
// Add Delivery Partner Review
// =============================
exports.addReview = async (req, res) => {
  try {
    await ensureReviewTable();

    const image = req.file ? req.file.filename : null;

    const payload = req.body || {};

    const {
      user_id,
      user_name,
      user_email,

      rating,
      comment,

      delivery_partner_id,
      delivery_partner_name,
      delivery_partner_phone,
      delivery_partner_email,

      franchise_admin_id,
      franchise_admin_name,

      created_by,
      updated_by,
    } = payload;

    const normalizedDeliveryPartnerId = delivery_partner_id || payload.delivery_partner_user_id || payload.delivery_partner || payload.dp_id || null;
    const normalizedDeliveryPartnerName = delivery_partner_name || payload.delivery_partner_name || payload.delivery_partner || null;
    const normalizedDeliveryPartnerPhone = delivery_partner_phone || payload.delivery_partner_phone || payload.delivery_partner_mobile || null;
    const normalizedDeliveryPartnerEmail = delivery_partner_email || payload.delivery_partner_email || payload.delivery_partnerEmail || payload.dp_email || payload.partner_email || null;
    const normalizedFranchiseAdminId = franchise_admin_id || payload.franchise_user_id || payload.franchise_id || payload.franchise_admin_id || null;
    const normalizedFranchiseAdminName = franchise_admin_name || payload.franchise_name || payload.franchise_admin_name || payload.franchise_admin || payload.franchiseAdminName || null;

    if (!user_id || !normalizedDeliveryPartnerId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    let resolvedDeliveryPartnerEmail = normalizedDeliveryPartnerEmail;
    let resolvedDeliveryPartnerName = normalizedDeliveryPartnerName;
    let resolvedDeliveryPartnerPhone = normalizedDeliveryPartnerPhone;
    let resolvedFranchiseAdminName = normalizedFranchiseAdminName;

    if (normalizedDeliveryPartnerId) {
      const [partnerRows] = await pool.query(
        `SELECT name, mobile, email FROM delivery_partners WHERE user_id = ? OR delivery_partner_user_id = ? OR id = ? LIMIT 1`,
        [normalizedDeliveryPartnerId, normalizedDeliveryPartnerId, normalizedDeliveryPartnerId]
      );

      if (partnerRows.length > 0) {
        const partner = partnerRows[0];
        resolvedDeliveryPartnerName = resolvedDeliveryPartnerName || partner.name || null;
        resolvedDeliveryPartnerPhone = resolvedDeliveryPartnerPhone || partner.mobile || null;
        resolvedDeliveryPartnerEmail = resolvedDeliveryPartnerEmail || partner.email || null;
      }
    }

    if (!resolvedFranchiseAdminName && normalizedFranchiseAdminId) {
      const [userRows] = await pool.query(
        `SELECT full_name FROM users WHERE user_id = ? OR id = ? LIMIT 1`,
        [normalizedFranchiseAdminId, normalizedFranchiseAdminId]
      );

      if (userRows.length > 0) {
        resolvedFranchiseAdminName = userRows[0].full_name || null;
      }
    }

    const [result] = await pool.query(
      `
      INSERT INTO deliverypartner_review
      (
        user_id,
        user_name,
        user_email,

        rating,
        comment,
        image,

        status,

        delivery_partner_id,
        delivery_partner_name,
        delivery_partner_phone,
        delivery_partner_email,

        admin_reply,

        franchise_admin_id,
        franchise_admin_name,

        created_by,
        updated_by
      )
      VALUES
      (
        ?,?,?,?,?,?,
        'Pending',
        ?,?,?,?,
        '',
        ?,?,
        ?,?
      )
      `,
      [
        user_id,
        user_name,
        user_email,

        rating,
        comment,
        image || null,

        normalizedDeliveryPartnerId,
        resolvedDeliveryPartnerName,
        resolvedDeliveryPartnerPhone,
        resolvedDeliveryPartnerEmail,

        normalizedFranchiseAdminId,
        resolvedFranchiseAdminName,

        created_by,
        updated_by,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Delivery partner review submitted successfully.",
      review_id: result.insertId,
    });
  } catch (error) {
    console.error("Add Review Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get All Reviews
// =============================
exports.getReviews = async (req, res) => {
  try {
    await ensureReviewTable();

    const [rows] = await pool.query(`
      SELECT *
      FROM deliverypartner_review
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get Single Review
// =============================
exports.getReviewById = async (req, res) => {
  try {
    await ensureReviewTable();

    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM deliverypartner_review
      WHERE id=?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Update Review
// =============================
exports.updateReview = async (req, res) => {
  try {
    await ensureReviewTable();

    const { id } = req.params;

    const image = req.file ? req.file.filename : null;

    const {
      rating,
      comment,
      updated_by,
    } = req.body;

    await pool.query(
      `
      UPDATE deliverypartner_review
      SET
        rating=?,
        comment=?,
        image=?,
        updated_by=?,
        updated_at=NOW()
      WHERE id=?
      `,
      [
        rating,
        comment,
        updated_by,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Review updated successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Admin Reply
// =============================
exports.replyReview = async (req, res) => {
  try {
    await ensureReviewTable();

    const { id } = req.params;

    const { admin_reply } = req.body;

    await pool.query(
      `
      UPDATE deliverypartner_review
      SET
        admin_reply=?,
        updated_at=NOW()
      WHERE id=?
      `,
      [admin_reply, id]
    );

    res.json({
      success: true,
      message: "Reply added successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Delete Review
// =============================
exports.deleteReview = async (req, res) => {
  try {
    await ensureReviewTable();

    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM deliverypartner_review
      WHERE id=?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};