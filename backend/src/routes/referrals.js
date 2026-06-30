const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/validate-code', referralController.validateReferralCode);
router.post('/apply', verifyToken, referralController.applyCode);
router.get('/dashboard', verifyToken, referralController.getDashboard);
router.get('/history', verifyToken, referralController.getHistory);
router.get('/wallet/transactions', verifyToken, referralController.getWalletTransactions);
router.get('/admin/settings', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminGetSettings);
router.put('/admin/settings', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminUpdateSettings);
router.get('/admin/reports', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminGetReports);
router.get('/admin/list', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminGetReferrals);
router.post('/admin/create-code', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminCreateReferralCode);
router.put('/admin/:id/status', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminUpdateReferralStatus);
router.get('/admin/export', verifyToken, requireRole(['superadmin', 'admin']), referralController.adminExport);

module.exports = router;
