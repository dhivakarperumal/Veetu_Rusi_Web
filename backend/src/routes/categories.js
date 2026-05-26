const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { attachUser, verifyToken } = require('../middleware/authMiddleware');

// Get categories (optional auth for franchise filtering)
router.get('/', attachUser, productController.getCategories);

// Create category
router.post('/', verifyToken, productController.createCategory);

// Update category
router.put('/:catId', verifyToken, productController.updateCategory);

// Delete category
router.delete('/:catId', verifyToken, productController.deleteCategory);

module.exports = router;
