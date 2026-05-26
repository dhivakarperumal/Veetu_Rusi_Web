const express = require('express');
const router = express.Router();

// Minimal cart endpoints to satisfy frontend (not persisted)
router.get('/', async (req, res) => {
  try {
    // return empty cart by default
    res.json({ items: [], total: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
});

router.post('/', async (req, res) => {
  // placeholder response
  res.status(201).json({ message: 'Cart endpoint not fully implemented' });
});

module.exports = router;
