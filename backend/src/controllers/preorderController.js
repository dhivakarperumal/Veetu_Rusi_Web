const pool = require('../config/db');

// Get all preorders for a chef
exports.getChefPreorders = async (req, res) => {
  try {
    const chefId = req.user?.user_id;
    if (!chefId) {
      return res.status(400).json({ message: 'Chef ID not found' });
    }

    const [preorders] = await pool.execute(
      'SELECT * FROM preorders WHERE chef_id = ? ORDER BY delivery_date DESC',
      [chefId]
    );

    res.json(preorders || []);
  } catch (error) {
    console.error('Get preorders error:', error);
    res.status(500).json({ message: 'Error fetching preorders', error: error.message });
  }
};

// Create a new preorder
exports.createPreorder = async (req, res) => {
  try {
    const chefId = req.user?.user_id;
    const { itemName, quantity, deliveryDate, specialRequests, price, customerEmail, customerPhone } = req.body;

    if (!chefId) {
      return res.status(400).json({ message: 'Chef ID not found' });
    }

    if (!itemName || !quantity || !deliveryDate || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      `INSERT INTO preorders (chef_id, item_name, quantity, delivery_date, special_requests, price, customer_email, customer_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [chefId, itemName, quantity, deliveryDate, specialRequests || '', price, customerEmail || '', customerPhone || '']
    );

    res.status(201).json({
      message: 'Preorder created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create preorder error:', error);
    res.status(500).json({ message: 'Error creating preorder', error: error.message });
  }
};

// Update preorder status
exports.updatePreorderStatus = async (req, res) => {
  try {
    const { preorderId } = req.params;
    const { status } = req.body;
    const chefId = req.user?.user_id;

    if (!['pending', 'confirmed', 'prepared', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify chef owns this preorder
    const [preorder] = await pool.execute(
      'SELECT chef_id FROM preorders WHERE id = ?',
      [preorderId]
    );

    if (!preorder.length) {
      return res.status(404).json({ message: 'Preorder not found' });
    }

    if (preorder[0].chef_id !== chefId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await pool.execute(
      'UPDATE preorders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, preorderId]
    );

    res.json({ message: 'Preorder status updated' });
  } catch (error) {
    console.error('Update preorder error:', error);
    res.status(500).json({ message: 'Error updating preorder', error: error.message });
  }
};

// Delete a preorder
exports.deletePreorder = async (req, res) => {
  try {
    const { preorderId } = req.params;
    const chefId = req.user?.user_id;

    // Verify chef owns this preorder
    const [preorder] = await pool.execute(
      'SELECT chef_id FROM preorders WHERE id = ?',
      [preorderId]
    );

    if (!preorder.length) {
      return res.status(404).json({ message: 'Preorder not found' });
    }

    if (preorder[0].chef_id !== chefId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await pool.execute('DELETE FROM preorders WHERE id = ?', [preorderId]);

    res.json({ message: 'Preorder deleted successfully' });
  } catch (error) {
    console.error('Delete preorder error:', error);
    res.status(500).json({ message: 'Error deleting preorder', error: error.message });
  }
};

// Get preorder by ID
exports.getPreorderById = async (req, res) => {
  try {
    const { preorderId } = req.params;
    const chefId = req.user?.user_id;

    const [preorder] = await pool.execute(
      'SELECT * FROM preorders WHERE id = ?',
      [preorderId]
    );

    if (!preorder.length) {
      return res.status(404).json({ message: 'Preorder not found' });
    }

    if (preorder[0].chef_id !== chefId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(preorder[0]);
  } catch (error) {
    console.error('Get preorder error:', error);
    res.status(500).json({ message: 'Error fetching preorder', error: error.message });
  }
};
