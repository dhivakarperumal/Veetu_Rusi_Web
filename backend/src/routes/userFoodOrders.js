const express = require('express');
const router = express.Router();
const controller = require('../controllers/userFoodOrderController');
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { getIo } = require('../utils/socket');

const initUserFoodOrderTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_food_order_table (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id VARCHAR(100) NOT NULL UNIQUE,
        user_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        street_address TEXT,
        city VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zip_code VARCHAR(50),
        delivery_date DATE,
        delivery_time VARCHAR(50),
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'Pending',
        total_amount DECIMAL(10,2) DEFAULT 0,
        items JSON,
        delivery_partner VARCHAR(255),
        chef_user_id VARCHAR(255),
        chef_id VARCHAR(255),
        chef_name VARCHAR(255),
        chef_email VARCHAR(255),
        chef_phone VARCHAR(20),
        franchise_user_id VARCHAR(255),
        franchise_id VARCHAR(255),
        franchise_name VARCHAR(255),
        franchise_email VARCHAR(255),
        franchise_phone VARCHAR(20),
        ordered_by_name VARCHAR(255),
        ordered_by_email VARCHAR(255),
        ordered_by_phone VARCHAR(20),
        status VARCHAR(50) DEFAULT 'New Order',
        ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_user_id (user_id),
        KEY idx_chef_user_id (chef_user_id),
        KEY idx_franchise_user_id (franchise_user_id),
        KEY idx_status (status),
        KEY idx_ordered_at (ordered_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.error('Error creating user_food_order_table:', err.message || err);
  }
};

initUserFoodOrderTable();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, chef_id, franchise_user_id, franchise_id, ordered_by_user_id, user_id, search } = req.query;
    const orders = await controller.getAllOrders({
      role: req.user?.role,
      userId: req.user?.user_id,
      numericId: req.user?.id,
      status,
      chef_id,
      franchise_user_id,
      franchise_id,
      user_id,
      ordered_by_user_id,
      search
    });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all food orders:', err);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

router.get('/delivery-partners/active', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id, name, mobile, vehicle_type FROM delivery_partners WHERE status = "Approved"');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching delivery partners:', err);
    res.status(500).json({ message: 'Error fetching delivery partners', error: err.message });
  }
});

router.get('/tracking/:order_id', verifyToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM delivery_live_tracking WHERE order_id = ?', [order_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tracking data not found for this order' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching tracking data:', err);
    res.status(500).json({ message: 'Error fetching tracking data', error: err.message });
  }
});

// One-time repair: fix all NULL names in delivery_live_tracking
router.get('/tracking-repair/fix-nulls', verifyToken, async (req, res) => {
  try {
    // Get all tracking records with NULL name
    const [nullRows] = await pool.execute(
      `SELECT dlt.id, dlt.order_id, dlt.delivery_partner_user_id, ufo.delivery_partner as dp_raw
       FROM delivery_live_tracking dlt
       LEFT JOIN user_food_order_table ufo ON ufo.order_id = dlt.order_id
       WHERE dlt.delivery_partner_name IS NULL OR dlt.delivery_partner_name = ''`
    );

    let fixed = 0;
    for (const row of nullRows) {
      const searchId = row.delivery_partner_user_id || row.dp_raw;
      if (!searchId) continue;

      const [partnerResult] = await pool.execute(
        `SELECT dp.name, dp.mobile, dp.user_id
         FROM delivery_partners dp
         LEFT JOIN users u ON u.user_id = dp.user_id
         WHERE dp.user_id = ? OR dp.delivery_partner_user_id = ? OR u.id = ? OR dp.id = ?
         LIMIT 1`,
        [searchId, searchId, searchId, searchId]
      );

      if (partnerResult.length > 0) {
        const { name, mobile, user_id } = partnerResult[0];
        await pool.execute(
          `UPDATE delivery_live_tracking 
           SET delivery_partner_name = ?, delivery_partner_phone = ?, delivery_partner_user_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [name, mobile, user_id || searchId, row.id]
        );
        fixed++;
        console.log(`✅ Fixed tracking record ${row.id} for order ${row.order_id} → ${name}`);
      }
    }

    res.json({ message: `Repaired ${fixed} of ${nullRows.length} NULL tracking records.` });
  } catch (err) {
    console.error('Error repairing tracking data:', err);
    res.status(500).json({ message: 'Error repairing tracking data', error: err.message });
  }
});


router.post('/', verifyToken, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.body.user_id || req.user?.user_id || req.user?.id || null
    };

    if (!payload.items || !payload.items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Group items by chef_user_id
    const itemsByChef = payload.items.reduce((acc, item) => {
      const chefId = item.chef_user_id || item.created_by || item.created_by_user_id || item.chef_id || 'unknown';
      if (!acc[chefId]) {
        acc[chefId] = {
          chef_user_id: chefId,
          chef_id: item.chef_id || '',
          chef_name: item.chef_name || item.created_by_name || '',
          chef_email: item.chef_email || item.created_by_email || '',
          chef_phone: item.chef_phone || item.created_by_phone || '',
          franchise_user_id: item.franchise_user_id || '',
          franchise_id: item.franchise_id || '',
          franchise_name: item.franchise_name || '',
          franchise_email: item.franchise_email || '',
          franchise_phone: item.franchise_phone || '',
          items: [],
          total_amount: 0
        };
      }
      acc[chefId].items.push(item);
      acc[chefId].total_amount += parseFloat(item.price || 0) * (item.quantity || 1);
      return acc;
    }, {});

    const createdOrders = [];
    const io = getIo();

    for (const chefGroup of Object.values(itemsByChef)) {
      // Strip large base64 images from items to prevent max_allowed_packet errors in MySQL
      const safeItems = chefGroup.items.map(item => {
        const safeItem = { ...item };
        if (safeItem.image && typeof safeItem.image === 'string' && safeItem.image.length > 500) {
          // If it's a large base64 string, remove it to save DB space and prevent errors
          delete safeItem.image;
        }
        return safeItem;
      });

      const orderPayload = {
        ...payload,
        items: safeItems,
        total_amount: chefGroup.total_amount,
        chef_user_id: chefGroup.chef_user_id === 'unknown' ? null : chefGroup.chef_user_id,
        chef_id: chefGroup.chef_id,
        chef_name: chefGroup.chef_name,
        chef_email: chefGroup.chef_email,
        chef_phone: chefGroup.chef_phone,
        franchise_user_id: chefGroup.franchise_user_id,
        franchise_id: chefGroup.franchise_id,
        franchise_name: chefGroup.franchise_name,
        franchise_email: chefGroup.franchise_email,
        franchise_phone: chefGroup.franchise_phone,
      };

      const result = await controller.addUserFoodOrder(orderPayload);
      createdOrders.push(result);

      // 🔔 Emit socket event to notify chef of new order
      try {
        if (io && orderPayload.chef_user_id) {
          const chefRoom = `chef:${orderPayload.chef_user_id}`;
          const orderData = {
            id: result.insertId,
            order_id: result.order_id,
            customer_name: orderPayload.customer_name || 'Customer',
            customer_phone: orderPayload.customer_phone || '',
            customer_email: orderPayload.customer_email || '',
            total_amount: orderPayload.total_amount || 0,
            chef_total_amount: orderPayload.total_amount || 0,
            status: 'New Order',
            items: orderPayload.items || [],
            street_address: orderPayload.street_address || '',
            city: orderPayload.city || '',
            district: orderPayload.district || '',
            state: orderPayload.state || '',
            delivery_date: orderPayload.delivery_date || '',
            delivery_time: orderPayload.delivery_time || '',
            created_at: new Date().toISOString()
          };
          
          console.log(`📤 Emitting new_order event to chef:${orderPayload.chef_user_id}`, orderData);
          io.to(chefRoom).emit('new_order', orderData);
        }
      } catch (socketErr) {
        console.error('Failed to emit socket event:', socketErr.message || socketErr);
      }
    }

    if (payload.user_id) {
      try {
        await pool.execute('DELETE FROM user_food_cart WHERE user_id = ?', [payload.user_id]);
      } catch (clearErr) {
        console.error('Failed to clear food cart after order:', clearErr.message || clearErr);
      }
    }

    res.status(201).json({ 
      message: 'Order placed successfully', 
      orders: createdOrders,
      order_id: createdOrders[0]?.order_id, // Backward compatibility
      id: createdOrders[0]?.insertId // Backward compatibility
    });
  } catch (err) {
    console.error('Error placing user food order:', err);
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
});

router.get('/chef', verifyToken, async (req, res) => {
  try {
    const chefUserId = req.user?.user_id || req.user?.id;
    if (!chefUserId) {
      return res.status(403).json({ message: 'Chef authentication required' });
    }

    const rows = await controller.getChefOrders(chefUserId);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching chef orders:', err);
    res.status(500).json({ message: 'Error fetching chef orders', error: err.message });
  }
});

router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(403).json({ message: 'User authentication required' });
    }

    const rows = await controller.getUserOrders(userId);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Error fetching user orders', error: err.message });
  }
});

router.get('/franchise/all', verifyToken, async (req, res) => {
  try {
    const franchiseUserId = req.user?.user_id || req.user?.id;
    if (!franchiseUserId) {
      return res.status(403).json({ message: 'Franchise admin authentication required' });
    }

    const rows = await controller.getFranchiseAdminOrders(franchiseUserId);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching franchise orders:', err);
    res.status(500).json({ message: 'Error fetching franchise orders', error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await controller.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order by id:', err);
    res.status(500).json({ message: 'Error retrieving order', error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await controller.updateOrder(id, req.body);
    
    // Check if delivery partner was assigned
    if (req.body.delivery_partner) {
      const deliveryBoyId = req.body.delivery_partner;
      const [orderRows] = await pool.execute('SELECT order_id FROM user_food_order_table WHERE id = ?', [id]);
      if (orderRows.length > 0) {
        const realOrderId = orderRows[0].order_id;

        // Search by user_id, delivery_partner_user_id, integer users.id, or auto-inc dp.id
        const [partnerResult] = await pool.execute(
          `SELECT dp.name, dp.mobile, dp.user_id
           FROM delivery_partners dp
           LEFT JOIN users u ON u.user_id = dp.user_id
           WHERE dp.user_id = ? OR dp.delivery_partner_user_id = ? OR u.id = ? OR dp.id = ?
           LIMIT 1`,
          [deliveryBoyId, deliveryBoyId, deliveryBoyId, deliveryBoyId]
        );
        
        const partnerName = partnerResult[0]?.name || '';
        const partnerPhone = partnerResult[0]?.mobile || '';
        const partnerUserId = partnerResult[0]?.user_id || deliveryBoyId;

        await pool.execute(
          `INSERT INTO delivery_live_tracking (order_id, delivery_partner_user_id, delivery_partner_name, delivery_partner_phone)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             delivery_partner_user_id = VALUES(delivery_partner_user_id),
             delivery_partner_name = VALUES(delivery_partner_name),
             delivery_partner_phone = VALUES(delivery_partner_phone),
             updated_at = CURRENT_TIMESTAMP`,
          [realOrderId, partnerUserId, partnerName, partnerPhone]
        );
      }
    }

    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Error updating order', error: err.message });
  }
});

router.patch('/status/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    await controller.updateOrderStatus(id, status);
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Error updating order status', error: err.message });
  }
});

module.exports = router;
