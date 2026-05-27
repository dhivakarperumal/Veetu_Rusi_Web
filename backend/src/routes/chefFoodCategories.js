const express = require('express');
const router = express.Router();
const chefFoodCategoryController = require('../controllers/cheffoodcategorycontroller');
const { attachUser, verifyToken } = require('../middleware/authMiddleware');

// Get chef food categories (optional auth for chef/franchise filtering)
router.get('/', attachUser, chefFoodCategoryController.getFoodCategories);

// Create chef food category
router.post('/', verifyToken, chefFoodCategoryController.createFoodCategory);

// Update chef food category
router.put('/:catId', verifyToken, chefFoodCategoryController.updateFoodCategory);

// Delete chef food category
router.delete('/:catId', verifyToken, chefFoodCategoryController.deleteFoodCategory);

module.exports = router;
