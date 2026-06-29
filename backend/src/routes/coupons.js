const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Customer Routes
router.get('/available', couponController.getAvailableCoupons);
router.post('/validate', couponController.validateCoupon);

// Admin Routes
router.use(verifyToken);
router.use(requireRole(['superadmin', 'admin']));

router.post('/', couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
