const express = require('express');
const router = express.Router();
const dpEarningsController = require('../controllers/dpEarningsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['superadmin', 'admin']));

// Admin Settings
router.get('/settings', dpEarningsController.getEarningsSettings);
router.post('/settings', dpEarningsController.updateEarningsSettings);

// History
router.get('/history', dpEarningsController.getEarningsHistory);

module.exports = router;
