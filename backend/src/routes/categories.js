const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { attachUser } = require('../middleware/authMiddleware');

// Get categories
router.get('/', productController.getCategories);

// Create category
router.post('/', productController.createCategory);

// Update category
router.put('/:catId', productController.updateCategory);

// Delete category
router.delete('/:catId', productController.deleteCategory);

module.exports = router;
