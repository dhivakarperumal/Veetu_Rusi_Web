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

const upload = require("../config/multer");

// =========================
// Create Review
// =========================
router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Delivery review upload error:", err.message || err);
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed.",
      });
    }
    addReview(req, res, next);
  });
});

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
router.put("/:id", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Delivery review update upload error:", err.message || err);
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed.",
      });
    }
    updateReview(req, res, next);
  });
});

// =========================
// Admin Reply
// =========================
router.put("/reply/:id", replyReview);

// =========================
// Delete Review
// =========================
router.delete("/:id", deleteReview);

module.exports = router;