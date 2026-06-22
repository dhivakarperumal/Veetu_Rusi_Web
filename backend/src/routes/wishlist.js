const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get wishlist for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(`
      SELECT 
        w.id,
        w.user_id,
        w.product_id,
        w.variant_color,
        w.variant_size,
        w.image as wishlist_image,
        w.email,
        w.price,
        w.total_price,
        w.created_at,
        CASE WHEN w.user_id LIKE 'CHEF-%' OR w.user_id LIKE 'FRAN-%' THEN fp.name ELSE p.name END as name,
        CASE WHEN w.user_id LIKE 'CHEF-%' OR w.user_id LIKE 'FRAN-%' THEN fp.mrp ELSE p.mrp END as mrp,
        CASE WHEN w.user_id LIKE 'CHEF-%' OR w.user_id LIKE 'FRAN-%' THEN fp.offer_price ELSE p.offer_price END as offer_price,
        CASE WHEN w.user_id LIKE 'CHEF-%' OR w.user_id LIKE 'FRAN-%' THEN fp.images ELSE p.images END as product_images 
      FROM wishlist w 
      LEFT JOIN chef_products p ON w.product_id = p.id 
      LEFT JOIN franchise_products fp ON w.product_id = fp.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);
    
    // Ensure we have images - prioritize wishlist stored image, then product images
    const formattedRows = rows.map(row => {
      let image = row.wishlist_image || row.product_images || null;
      
      // Validate image - ensure it's a complete data URI, valid URL, or JSON array
      if (image && typeof image === 'string') {
        if (image.startsWith('data:') && image.length > 50) {
          // Valid data URI, keep it
        } else if (image.startsWith('http') && image.length > 10) {
          // Valid HTTP URL, keep it
        } else if (image.startsWith('[')) {
          // Valid JSON array string, keep it
        } else if (!image.includes('/') && image.length < 5) {
          // Invalid format or too short, remove it
          image = null;
        }
      }
      
      return {
        ...row,
        image: image
      };
    });
    
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: 'Error fetching wishlist', error: err.message });
  }
});

// Add to wishlist (Toggle: add if not exists, remove if exists)
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, variant_color, variant_size, image, email, price, total_price } = req.body;
    
    if (!user_id || !product_id) {
      return res.status(400).json({ message: 'user_id and product_id are required' });
    }

    // Validate and sanitize image data
    let sanitizedImage = null;
    if (image && typeof image === 'string') {
      // Only store if it's a valid data URI (at least 50 chars) or HTTP URL
      if ((image.startsWith('data:') && image.length > 50) || image.startsWith('http')) {
        sanitizedImage = image;
      }
    }

    // Check if already exists
    const [existing] = await pool.execute(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      // If already in wishlist, remove it (toggle behavior)
      await pool.execute(
        'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
        [user_id, product_id]
      );
      return res.status(200).json({ message: 'Removed from wishlist', action: 'removed' });
    }

    const [result] = await pool.execute(
      'INSERT INTO wishlist (user_id, product_id, variant_color, variant_size, image, email, price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_id, variant_color || null, variant_size || null, sanitizedImage, email || null, price || 0, total_price || 0]
    );

    res.status(201).json({ message: 'Added to wishlist', id: result.insertId, action: 'added' });
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
