const crypto = require('crypto');
const pool = require('../config/db');

const normalizeDealer = (dealer) => ({
  ...dealer,
  rating: dealer.rating !== null ? Number(dealer.rating) : null,
  orders: dealer.orders !== null ? Number(dealer.orders) : null,
});

exports.getAllDealers = async (req, res) => {
  try {
    const [dealers] = await pool.execute('SELECT * FROM dealers ORDER BY created_at DESC');
    return res.json(dealers.map(normalizeDealer));
  } catch (error) {
    console.error('Get dealers error:', error);
    return res.status(500).json({ message: 'Failed to fetch dealers', error: error.message });
  }
};

exports.getDealerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM dealers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    return res.json(normalizeDealer(rows[0]));
  } catch (error) {
    console.error('Get dealer by id error:', error);
    return res.status(500).json({ message: 'Failed to fetch dealer', error: error.message });
  }
};

exports.createDealer = async (req, res) => {
  try {
    const { name, contact, email, phone, location, status, rating, orders, image, details } = req.body;

    if (!name || !contact || !phone || !location) {
      return res.status(400).json({ message: 'Name, contact, phone, and location are required.' });
    }

    const dealerId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const finalRating = rating !== undefined && rating !== null && rating !== '' ? Number(rating) : 0;
    const finalOrders = orders !== undefined && orders !== null && orders !== '' ? parseInt(orders, 10) : 0;

    const [result] = await pool.execute(
      'INSERT INTO dealers (dealer_id, name, contact, email, phone, location, status, rating, orders, image, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dealerId, name, contact, email || null, phone || null, location || null, status || 'Pending', finalRating, finalOrders, image || null, details || null]
    );

    return res.status(201).json({
      message: 'Dealer created successfully',
      dealer: {
        id: result.insertId,
        dealer_id: dealerId,
        name,
        contact,
        email: email || null,
        phone: phone || null,
        location: location || null,
        status: status || 'Pending',
        rating: finalRating,
        orders: finalOrders,
        image: image || null,
        details: details || null,
      },
    });
  } catch (error) {
    console.error('Create dealer error:', error);
    return res.status(500).json({ message: 'Failed to create dealer', error: error.message });
  }
};

exports.updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, phone, location, status, rating, orders, image, details } = req.body;
    const [existing] = await pool.execute('SELECT id FROM dealers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const updateFields = [];
    const updateValues = [];
    const addField = (fieldName, value) => {
      if (value !== undefined) {
        updateFields.push(`${fieldName} = ?`);
        updateValues.push(value);
      }
    };

    addField('name', name);
    addField('contact', contact);
    addField('email', email);
    addField('phone', phone);
    addField('location', location);
    addField('status', status);
    addField('rating', rating !== undefined && rating !== null && rating !== '' ? Number(rating) : null);
    addField('orders', orders !== undefined && orders !== null && orders !== '' ? parseInt(orders, 10) : null);
    addField('image', image);
    addField('details', details);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No update fields provided.' });
    }

    updateValues.push(id);
    await pool.execute(`UPDATE dealers SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    return res.json({ message: 'Dealer updated successfully' });
  } catch (error) {
    console.error('Update dealer error:', error);
    return res.status(500).json({ message: 'Failed to update dealer', error: error.message });
  }
};

exports.deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT id FROM dealers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    await pool.execute('DELETE FROM dealers WHERE id = ?', [id]);
    return res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Delete dealer error:', error);
    return res.status(500).json({ message: 'Failed to delete dealer', error: error.message });
  }
};
