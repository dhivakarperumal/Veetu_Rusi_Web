const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Get all reviews
router.get('/', reviewController.getAllReviews);

// Get reviews for a product
router.get('/product/:id', reviewController.getReviewsByProduct);

// Check if a user has reviewed a product
router.get('/check/:productId/:userId', reviewController.checkUserReview);

// Create a review
router.post('/', reviewController.createReview);

module.exports = router;
