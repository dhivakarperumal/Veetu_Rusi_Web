const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { handleChatbotMessage } = require('../controllers/chatbotController');

router.post('/message', verifyToken, handleChatbotMessage);

module.exports = router;
