const express = require("express");
const router = express.Router();

const {
  addReview,
  getReviews,
  getReviewById,
  updateReview,
  replyReview,
  deleteReview,
} = require("../controllers/deliveryPartnerReviewController");

const upload = require("../middleware/upload");

// =========================
// Create Review
// =========================
router.post("/", upload.single("image"), addReview);

// =========================
// Get All Reviews
// =========================
router.get("/", getReviews);

// =========================
// Get Single Review
// =========================
router.get("/:id", getReviewById);

// =========================
// Update Review
// =========================
router.put("/:id", updateReview);

// =========================
// Admin Reply
// =========================
router.put("/reply/:id", replyReview);

// =========================
// Delete Review
// =========================
router.delete("/:id", deleteReview);

module.exports = router;