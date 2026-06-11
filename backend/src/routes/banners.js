const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;
    let query = "SELECT * FROM banners WHERE 1=1";
    const params = [];

    if (active === '1') {
      query += " AND status = 'Active'";
    }

    const [rows] = await pool.execute(query + " ORDER BY created_at DESC", params);
    
    // Quick filter by type if frontend asks
    let filtered = rows;
    if (type) {
      filtered = rows.filter(r => r.banner_title && r.banner_title.toLowerCase().includes(type.toLowerCase()));
    }
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving banners', error: error.message });
  }
});

module.exports = router;
