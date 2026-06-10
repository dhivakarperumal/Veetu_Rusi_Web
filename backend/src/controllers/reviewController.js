const pool = require('../config/db');

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return value; }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [id]);

    const reviews = rows.map(r => ({
      ...r,
      review_image: parseJsonField(r.review_image)
    }));

    // compute stats
    const total = reviews.length;
    const avg = total === 0 ? 0 : (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total);
    const stats = {
      total_reviews: total,
      average_rating: Number(avg.toFixed(1)),
      five_star: reviews.filter(r => r.rating === 5).length,
      four_star: reviews.filter(r => r.rating === 4).length,
      three_star: reviews.filter(r => r.rating === 3).length,
      two_star: reviews.filter(r => r.rating === 2).length,
      one_star: reviews.filter(r => r.rating === 1).length,
    };

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const { status, rating, search } = req.query;
    const params = [];
    let query = `
      SELECT r.*, COALESCE(cp.name, fp.name) AS product_name
      FROM reviews r
      LEFT JOIN chef_products cp ON r.product_id = cp.id
      LEFT JOIN franchise_products fp ON r.product_id = fp.id
      WHERE 1=1
    `;

    if (status && status !== 'All') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (rating) {
      query += ' AND r.rating = ?';
      params.push(Number(rating));
    }

    if (search) {
      const term = `%${search}%`;
      query += ' AND (r.user_name LIKE ? OR r.user_email LIKE ? OR r.comment LIKE ? OR CAST(r.product_id AS CHAR) LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.execute(query, params);
    const reviews = rows.map(r => ({
      ...r,
      review_image: parseJsonField(r.review_image)
    }));

    const total = reviews.length;
    const avg = total === 0 ? 0 : (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total);
    const stats = {
      total_reviews: total,
      average_rating: Number(avg.toFixed(1)),
      pending_count: reviews.filter(r => r.status === 'Pending').length,
      five_star: reviews.filter(r => r.rating === 5).length,
      four_star: reviews.filter(r => r.rating === 4).length,
      three_star: reviews.filter(r => r.rating === 3).length,
      two_star: reviews.filter(r => r.rating === 2).length,
      one_star: reviews.filter(r => r.rating === 1).length,
    };

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Missing status value' });
    }

    await pool.execute('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Review status updated' });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ message: 'Failed to update review status', error: error.message });
  }
};

exports.updateReviewReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;

    await pool.execute('UPDATE reviews SET admin_reply = ? WHERE id = ?', [admin_reply || null, id]);
    res.json({ message: 'Review reply updated' });
  } catch (error) {
    console.error('Error updating review reply:', error);
    res.status(500).json({ message: 'Failed to update review reply', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

exports.checkUserReview = async (req, res) => {
  try {
    const { productId, userId } = req.params;
    const [rows] = await pool.execute('SELECT id FROM reviews WHERE product_id = ? AND (user_id = ? OR user_id = ?) LIMIT 1', [productId, userId, userId]);
    res.json({ hasReviewed: rows.length > 0 });
  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({ message: 'Failed to check review', error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const {
      product_id, user_id, user_name, user_email, rating, comment, review_image, status, admin_reply
    } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // prevent duplicate review by same user for same product
    if (user_id) {
      const [existing] = await pool.execute('SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1', [product_id, user_id]);
      if (existing.length > 0) return res.status(400).json({ message: 'You have already submitted a review for this product' });
    }

    const finalStatus = status || 'Published';

    const [result] = await pool.execute(
      `INSERT INTO reviews (product_id, user_id, user_name, user_email, rating, comment, review_image, status, admin_reply, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [product_id, user_id || null, user_name || null, user_email || null, rating, comment || null, review_image || null, finalStatus, admin_reply || null]
    );

    res.status(201).json({ message: 'Review created', id: result.insertId });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};
