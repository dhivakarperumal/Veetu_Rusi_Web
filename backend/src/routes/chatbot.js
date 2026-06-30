const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { handleChatbotMessage } = require('../controllers/chatbotController');

router.post('/message', verifyToken, handleChatbotMessage);

// Add all cart items to wishlist
const { addAllCartToWishlist } = require('../controllers/chatbotController');
router.post('/add-all-to-wishlist', verifyToken, addAllCartToWishlist);

module.exports = router;
