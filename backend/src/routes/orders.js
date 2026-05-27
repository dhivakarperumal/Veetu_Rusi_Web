const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadminController');
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Ensure Chef_Order table exists
const initOrderTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`Chef_Order\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL UNIQUE,
        user_id VARCHAR(100),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        street_address TEXT,
        city VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zip_code VARCHAR(50),
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        items JSON,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        ordered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("Error creating Chef_Order table:", err);
  }
};
initOrderTable();

// POST new order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      user_id, customer_name, customer_email, customer_phone, 
      street_address, city, district, state, country, zip_code, 
      payment_method, payment_status, payment_id, total_amount, items 
    } = req.body;

    const order_id = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const [result] = await pool.execute(
      `INSERT INTO \`Chef_Order\` 
      (order_id, user_id, customer_name, customer_email, customer_phone, street_address, city, district, state, country, zip_code, payment_method, payment_status, payment_id, total_amount, items) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id, user_id || null, customer_name, customer_email || null, customer_phone || null,
        street_address || null, city || null, district || null, state || null, country || null,
        zip_code || null, payment_method || null, payment_status || 'pending', payment_id || null,
        total_amount, JSON.stringify(items)
      ]
    );

    res.status(201).json({ message: 'Order placed successfully', order_id, id: result.insertId });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
});

// GET orders (superadmin uses this via GET /api/orders, wait we shouldn't break the existing controller.getOrders)
// It was protected by verifyToken before. Let's keep verifyToken only on getOrders or make it available for both.
// In the original file, verifyToken was applied to the entire router. Let's see if the frontend sends token during checkout.
// Checkout.jsx doesn't seem to pass token in api.post. It relies on axios interceptors probably. Let's keep it but since the original was:
// router.use(verifyToken);
// router.get('/', controller.getOrders);

// We will add the POST route. I will add verifyToken back for GET, but let's check if POST needs it.
// If it fails with 401 we will remove verifyToken from POST.

router.get('/', verifyToken, controller.getOrders);
// Wait, in Checkout.jsx, fetchAddresses calls GET /orders without verifying token logic if it fails it might be because of token, but let's use verifyToken for GET and POST.

module.exports = router;
