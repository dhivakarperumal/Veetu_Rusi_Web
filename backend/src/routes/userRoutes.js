const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Apply auth middleware to all user routes
router.use(verifyToken);
// Restrict all these operations to superadmin
router.use(requireRole(['superadmin']));

router.get('/dashboard-stats', userController.getUserDashboardStats);
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
