const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', verifyToken, authController.profile);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/update-location', verifyToken, authController.updateLocation);
router.put('/profile/password', verifyToken, authController.changePassword);

// Admin: list users (returns array expected by frontend)
router.get('/users', verifyToken, requireRole(['superadmin', 'admin']), userController.listAllUsers);

module.exports = router;
