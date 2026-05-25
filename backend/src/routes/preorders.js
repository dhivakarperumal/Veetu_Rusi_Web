const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  getChefPreorders,
  createPreorder,
  updatePreorderStatus,
  deletePreorder,
  getPreorderById
} = require('../controllers/preorderController');

// All routes require authentication and chef role
router.use(verifyToken);
router.use(requireRole(['chef', 'admin']));

// Get all preorders for logged-in chef
router.get('/', getChefPreorders);

// Get specific preorder
router.get('/:preorderId', getPreorderById);

// Create a new preorder
router.post('/', createPreorder);

// Update preorder status
router.patch('/:preorderId/status', updatePreorderStatus);

// Delete a preorder
router.delete('/:preorderId', deletePreorder);

module.exports = router;
