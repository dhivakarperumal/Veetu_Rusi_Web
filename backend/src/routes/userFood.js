const express = require('express');
const router = express.Router();
const userFood = require('../controllers/userFoodController');

// Get cart items for a user
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const rows = await userFood.getCartByUser(user_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user food cart', error: err.message });
  }
});

// Add to user food cart
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const result = await userFood.addToUserFoodCart(payload);
    res.status(201).json({ message: 'Added to user food cart', result });
  } catch (err) {
    res.status(500).json({ message: 'Error adding to user food cart', error: err.message });
  }
});

// Update quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    await userFood.updateQuantity(id, quantity, price);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating quantity', error: err.message });
  }
});

// Remove item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await userFood.removeItem(id);
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing item', error: err.message });
  }
});

// Clear cart for user
router.delete('/clear/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    await userFood.clearCart(user_id);
    res.json({ message: 'Cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing cart', error: err.message });
  }
});

module.exports = router;
