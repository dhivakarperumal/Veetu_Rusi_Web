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
      product_id, user_id, user_name, user_email, rating, comment, review_image
    } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // prevent duplicate review by same user for same product
    if (user_id) {
      const [existing] = await pool.execute('SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1', [product_id, user_id]);
      if (existing.length > 0) return res.status(400).json({ message: 'You have already submitted a review for this product' });
    }

    const [result] = await pool.execute(
      `INSERT INTO reviews (product_id, user_id, user_name, user_email, rating, comment, review_image, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [product_id, user_id || null, user_name || null, user_email || null, rating, comment || null, review_image || null]
    );

    res.status(201).json({ message: 'Review created', id: result.insertId });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};
