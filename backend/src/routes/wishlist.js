const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get wishlist for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM wishlist WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: 'Error fetching wishlist', error: err.message });
  }
});

// Add to wishlist
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, variant_color, variant_size, image, email, price, total_price } = req.body;
    
    if (!user_id || !product_id) {
      return res.status(400).json({ message: 'user_id and product_id are required' });
    }

    // Check if already exists
    const [existing] = await pool.execute(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const [result] = await pool.execute(
      'INSERT INTO wishlist (user_id, product_id, variant_color, variant_size, image, email, price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_id, variant_color || null, variant_size || null, image || null, email || null, price || 0, total_price || 0]
    );

    res.status(201).json({ message: 'Added to wishlist', id: result.insertId });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ message: 'Failed to add to wishlist', error: err.message });
  }
});

// Remove from wishlist
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await pool.execute('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ message: 'Failed to remove from wishlist', error: err.message });
  }
});

// Remove from wishlist by ID (Fallback)
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM wishlist WHERE id = ?', [id]);
      res.json({ message: 'Removed from wishlist' });
    } catch (err) {
      console.error('Error removing from wishlist by ID:', err);
      res.status(500).json({ message: 'Failed to remove from wishlist', error: err.message });
    }
  });

module.exports = router;
