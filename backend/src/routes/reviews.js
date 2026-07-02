const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Admin review management
router.get('/admin/all', verifyToken, requireRole(['admin', 'superadmin']), reviewController.getAllReviews);
router.get('/franchise', verifyToken, reviewController.getFranchiseReviews);
router.put('/admin/:id/status', verifyToken, requireRole(['admin', 'superadmin']), reviewController.updateReviewStatus);
router.put('/admin/:id/reply', verifyToken, requireRole(['admin', 'superadmin']), reviewController.updateReviewReply);
router.delete('/admin/:id', verifyToken, requireRole(['admin', 'superadmin']), reviewController.deleteReview);

// Get all reviews
router.get('/', reviewController.getAllReviews);

// Get reviews for a product
router.get('/product/:id', reviewController.getReviewsByProduct);

// Check if a user has reviewed a product
router.get('/check/:productId/:userId', reviewController.checkUserReview);

// Create a review
router.post('/', reviewController.createReview);

module.exports = router;
