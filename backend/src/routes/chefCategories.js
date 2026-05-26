const express = require('express');
const router = express.Router();
const chefCategoryController = require('../controllers/chefCategoryController');
const { attachUser, verifyToken } = require('../middleware/authMiddleware');

// Get chef categories (optional auth for chef/franchise filtering)
router.get('/', attachUser, chefCategoryController.getChefCategories);

// Create chef category
router.post('/', verifyToken, chefCategoryController.createChefCategory);

// Update chef category
router.put('/:catId', verifyToken, chefCategoryController.updateChefCategory);

// Delete chef category
router.delete('/:catId', verifyToken, chefCategoryController.deleteChefCategory);

module.exports = router;
