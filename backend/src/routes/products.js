const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { attachUser } = require('../middleware/authMiddleware');

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get categories
router.get('/categories', productController.getCategories);

// Get latest product code
router.get('/latest-code', productController.getLatestProductCode);

// Get product by ID
router.get('/:id', productController.getProductById);

// Create product
router.post('/', attachUser, productController.createProduct);

// Update product
router.put('/:id', attachUser, productController.updateProduct);

// Delete product
router.delete('/:id', attachUser, productController.deleteProduct);

module.exports = router;
