const express = require('express');
const router = express.Router();
const franchiseProductController = require('../controllers/franchiseProductController');
const { attachUser } = require('../middleware/authMiddleware');

// Get franchise products with filters
router.get('/', franchiseProductController.getAllProducts);

// Get latest franchise product code
router.get('/latest-code', franchiseProductController.getLatestProductCode);

// Get franchise product by ID
router.get('/:id', franchiseProductController.getProductById);

// Create franchise product
router.post('/', attachUser, franchiseProductController.createProduct);

// Update franchise product
router.put('/:id', franchiseProductController.updateProduct);

// Delete franchise product
router.delete('/:id', franchiseProductController.deleteProduct);

module.exports = router;
