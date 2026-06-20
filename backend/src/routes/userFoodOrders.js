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
        status VARCHAR(50) DEFAULT 'Pending',
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

router.post('/', verifyToken, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.body.user_id || req.user?.user_id || req.user?.id || null
    };

    const result = await controller.addUserFoodOrder(payload);

    if (payload.user_id) {
      try {
        await pool.execute('DELETE FROM user_food_cart WHERE user_id = ?', [payload.user_id]);
      } catch (clearErr) {
        console.error('Failed to clear food cart after order:', clearErr.message || clearErr);
      }
    }

    // 🔔 Emit socket event to notify chef of new order
    try {
      const io = getIo();
      if (io && payload.chef_user_id) {
        const chefRoom = `chef:${payload.chef_user_id}`;
        const orderData = {
          id: result.insertId,
          order_id: result.order_id,
          customer_name: payload.customer_name || 'Customer',
          customer_phone: payload.customer_phone || '',
          customer_email: payload.customer_email || '',
          total_amount: payload.total_amount || 0,
          chef_total_amount: payload.total_amount || 0,
          status: 'Pending',
          items: payload.items || [],
          street_address: payload.street_address || '',
          city: payload.city || '',
          district: payload.district || '',
          state: payload.state || '',
          delivery_date: payload.delivery_date || '',
          delivery_time: payload.delivery_time || '',
          created_at: new Date().toISOString()
        };
        
        console.log(`📤 Emitting new_order event to chef:${payload.chef_user_id}`, orderData);
        io.to(chefRoom).emit('new_order', orderData);
      }
    } catch (socketErr) {
      console.error('Failed to emit socket event:', socketErr.message || socketErr);
      // Don't fail the order creation if socket fails
    }

    res.status(201).json({ message: 'Order placed successfully', order_id: result.order_id, id: result.insertId });
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
