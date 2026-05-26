const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.get('/profile', verifyToken, authController.profile);

// Admin: list users (returns array expected by frontend)
router.get('/users', verifyToken, requireRole(['superadmin', 'admin']), userController.listAllUsers);

module.exports = router;
