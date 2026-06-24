const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Ensure Chef_cart table exists
const initCartTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`Chef_cart\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        product_id INT NOT NULL,
        variant_color VARCHAR(255),
        variant_size VARCHAR(255),
        image LONGTEXT,
        email VARCHAR(255),
        price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        quantity INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("Error creating Chef_cart table:", err);
  }
};
initCartTable();

// Get cart for a user
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM \`Chef_cart\` WHERE user_id = ?', [user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
});

// Add to cart
router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, variant_color, variant_size, image, email, price, total_price, quantity } = req.body;
    const normalizedVariantSize = variant_size || '';
    
    // Check if the exact product variant already exists in cart for this user
    const [existing] = await pool.execute(
      'SELECT * FROM \`Chef_cart\` WHERE user_id = ? AND product_id = ? AND COALESCE(variant_size, \'\') = ?',
      [user_id, product_id, normalizedVariantSize]
    );

    if (existing.length > 0) {
      // Update quantity and total_price
      const cartItem = existing[0];
      const newQuantity = cartItem.quantity + quantity;
      const newTotalPrice = cartItem.price * newQuantity;
      
      await pool.execute(
        'UPDATE \`Chef_cart\` SET quantity = ?, total_price = ? WHERE id = ?',
        [newQuantity, newTotalPrice, cartItem.id]
      );
      return res.status(200).json({ message: 'Cart updated', cartItemId: cartItem.id });
    } else {
      // Insert new
      const [result] = await pool.execute(
        'INSERT INTO \`Chef_cart\` (user_id, product_id, variant_color, variant_size, image, email, price, total_price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, product_id, variant_color || '', variant_size || '', image || '', email || '', price || 0, total_price || 0, quantity || 1]
      );
      return res.status(201).json({ message: 'Added to cart', cartItemId: result.insertId });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
});

// Update cart quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    const total_price = quantity * price;
    
    await pool.execute(
      'UPDATE \`Chef_cart\` SET quantity = ?, total_price = ? WHERE id = ?',
      [quantity, total_price, id]
    );
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart', error: err.message });
  }
});

// Remove from cart
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM \`Chef_cart\` WHERE id = ?', [id]);
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing from cart', error: err.message });
  }
});

// Clear cart for a user
router.delete('/clear/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    await pool.execute('DELETE FROM \`Chef_cart\` WHERE user_id = ?', [user_id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing cart', error: err.message });
  }
});

module.exports = router;
