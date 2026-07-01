const pool = require("../config/db");

// =============================
// Add Delivery Partner Review
// =============================
exports.addReview = async (req, res) => {
  try {
    const image = req.file ? req.file.filename : null;

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
    } = req.body;

    if (!user_id || !delivery_partner_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
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

        delivery_partner_id,
        delivery_partner_name,
        delivery_partner_phone,
        delivery_partner_email,

        franchise_admin_id,
        franchise_admin_name,

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