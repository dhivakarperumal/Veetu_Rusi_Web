const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadminController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', controller.getOrders);

module.exports = router;
