const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protect with JWT — allow both admin and superadmin
router.use(verifyToken);

router.get('/', getDashboardData);

module.exports = router;
