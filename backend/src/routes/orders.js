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
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'Order Placed',
        ordered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("Error creating Chef_Order table:", err);
  }

  try { await pool.execute('ALTER TABLE `Chef_Order` DROP COLUMN franchise_user_id'); } catch (_) {}
  try { await pool.execute('ALTER TABLE `Chef_Order` DROP COLUMN franchise_user_name'); } catch (_) {}
  try { await pool.execute('ALTER TABLE `Chef_Order` DROP COLUMN franchise_user_email'); } catch (_) {}
  try { await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN IF NOT EXISTS created_by VARCHAR(100)'); } catch (_) {}
  try { await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100)'); } catch (_) {}
  try { await pool.execute('ALTER TABLE `Chef_Order` ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'); } catch (_) {}
};
initOrderTable();

// POST new order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      user_id, customer_name, customer_email, customer_phone, 
      street_address, city, district, state, country, zip_code, 
      payment_method, payment_status, payment_id, total_amount, items,
      franchise_user_id, created_by
    } = req.body;

    let finalCreatedBy = created_by || franchise_user_id || null;
    if (!finalCreatedBy && items && items.length > 0) {
      const firstProductId = items[0].product_id;
      if (firstProductId) {
        const [products] = await pool.execute(
          'SELECT franchise_user_id FROM chef_products WHERE id = ?',
          [firstProductId]
        );
        if (products.length > 0) {
          finalCreatedBy = products[0].franchise_user_id || null;
        } else {
          const [fProducts] = await pool.execute(
            'SELECT created_by FROM franchise_products WHERE id = ?',
            [firstProductId]
          );
          if (fProducts.length > 0) {
            finalCreatedBy = fProducts[0].created_by || null;
          }
        }
      }
    }

    const order_id = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const [result] = await pool.execute(
      `INSERT INTO \`Chef_Order\` 
      (order_id, user_id, customer_name, customer_email, customer_phone, street_address, city, district, state, country, zip_code, payment_method, payment_status, payment_id, total_amount, items, created_by, updated_by, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Order Placed')`,
      [
        order_id, user_id || null, customer_name, customer_email || null, customer_phone || null,
        street_address || null, city || null, district || null, state || null, country || null,
        zip_code || null, payment_method || null, payment_status || 'pending', payment_id || null,
        total_amount, JSON.stringify(items),
        finalCreatedBy, finalCreatedBy
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
router.put('/:id/status', verifyToken, controller.patchOrderStatus);

// GET personal orders for the logged-in user
router.get('/myorders', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user?.user_id;
    const currentId = req.user?.id;
    
    // Fallback if token doesn't have user_id
    if (!currentUserId && !currentId) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM Chef_Order WHERE user_id = ? OR user_id = ? ORDER BY ordered_date DESC',
      [currentUserId || currentId, currentId || currentUserId]
    );

    const parsedRows = rows.map(row => {
      let items = row.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      return { ...row, items };
    });

    res.json(parsedRows);
  } catch (err) {
    console.error("Error fetching my orders:", err);
    res.status(500).json({ message: 'Error retrieving your orders.', error: err.message });
  }
});

// GET single order by id (for popup in My Orders page)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM Chef_Order WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found.' });
    const order = rows[0];
    if (typeof order.items === 'string') {
      try { order.items = JSON.parse(order.items); } catch { order.items = []; }
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order.', error: err.message });
  }
});

module.exports = router;
