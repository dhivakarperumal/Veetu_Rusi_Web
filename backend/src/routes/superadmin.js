const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Apply JWT verification & superadmin role check to all superadmin endpoints
router.use(verifyToken);
router.use(requireRole(['superadmin']));

// Dashboard Analytics
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/pincode/:value', controller.lookupPincode);

// Restaurant Management
const restaurantUploadFields = upload.fields([
  { name: 'logo_url', maxCount: 1 },
  { name: 'banner_url', maxCount: 1 },
  { name: 'gallery_urls', maxCount: 10 },
  { name: 'aadhaar_url', maxCount: 1 },
  { name: 'pan_url', maxCount: 1 },
  { name: 'gst_certificate_url', maxCount: 1 },
  { name: 'shop_license_url', maxCount: 1 },
  { name: 'restaurant_photos_urls', maxCount: 10 },
  { name: 'kitchen_photos_urls', maxCount: 10 },
  { name: 'signature_url', maxCount: 1 }
]);
router.get('/restaurants', controller.getRestaurants);
router.post('/restaurants', restaurantUploadFields, controller.createRestaurant);
router.put('/restaurants/:id', restaurantUploadFields, controller.updateRestaurant);
router.delete('/restaurants/:id', controller.deleteRestaurant);



// User Management
router.get('/users', controller.getUsers);
router.post('/users', controller.createUser);
router.patch('/users/status/:id', controller.patchUserStatus);
router.patch('/users/role/:id', controller.patchUserRole);
router.delete('/users/:id', controller.deleteUser);

// Order Management
router.get('/orders', controller.getOrders);
router.put('/orders/:id', controller.updateOrder);
router.patch('/orders/status/:id', controller.patchOrderStatus);

// Payout Management
router.get('/payouts', controller.getPayouts);
router.post('/payouts', controller.createPayout);

// Franchise Owner Management
const franchiseUploadFields = upload.fields([
  { name: 'logo_url', maxCount: 1 },
  { name: 'banner_url', maxCount: 1 },
  { name: 'aadhaar_url', maxCount: 1 },
  { name: 'pan_url', maxCount: 1 },
  { name: 'bank_passbook_url', maxCount: 1 },
  { name: 'signature_url', maxCount: 1 }
]);
router.get('/franchises', controller.getFranchises);
router.get('/franchises/:id', controller.getFranchiseById);
router.post('/franchises', franchiseUploadFields, controller.createFranchise);
router.patch('/franchises/approve/:id', controller.approveFranchise);
router.put('/franchises/:id', franchiseUploadFields, controller.updateFranchise);
router.delete('/franchises/:id', controller.deleteFranchise);

// Commission Management
router.get('/commissions', controller.getCommissions);
router.put('/commissions/:id', controller.updateCommission);

// Banner Management
router.get('/banners', controller.getBanners);
router.post('/banners', upload.single('banner_image'), controller.createBanner);
router.put('/banners/:id', controller.updateBanner);
router.delete('/banners/:id', controller.deleteBanner);

// Notification Management
router.get('/notifications', controller.getNotifications);
router.post('/notifications', controller.createNotification);

// Home Chef Management
const homeChefUploadFields = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'cover_banner', maxCount: 1 },
  { name: 'kitchen_photos', maxCount: 10 },
  { name: 'kitchen_videos', maxCount: 5 },
  { name: 'cooking_area_photo', maxCount: 1 },
  { name: 'aadhaar_front_url', maxCount: 1 },
  { name: 'aadhaar_back_url', maxCount: 1 },
  { name: 'pan_card_url', maxCount: 1 },
  { name: 'passbook_image', maxCount: 1 },
  { name: 'selfie_verification_url', maxCount: 1 },
  { name: 'introduction_video', maxCount: 1 },
  { name: 'fssai_certificate_url', maxCount: 1 },
  { name: 'gst_certificate_url', maxCount: 1 },
  { name: 'signature_url', maxCount: 1 },
  { name: 'kitchen_photo1', maxCount: 1 },
  { name: 'kitchen_photo2', maxCount: 1 },
  { name: 'kitchen_photo3', maxCount: 1 },
  { name: 'storage_area_photo', maxCount: 1 }
]);
router.get('/homechefs', controller.getHomeChefs);
router.get('/homechefs/:id', controller.getHomeChefById);
router.post('/homechefs', homeChefUploadFields, controller.createHomeChef);
router.put('/homechefs/:id', homeChefUploadFields, controller.updateHomeChef);
router.delete('/homechefs/:id', controller.deleteHomeChef);
router.patch('/homechefs/:id/status', controller.updateHomeChefStatus);

// Reports Management
router.get('/reports', controller.getReportsList);

// Areas Management
router.get('/areas', controller.getAreas);
router.post('/areas', controller.createArea);
router.put('/areas/:id', controller.updateArea);
router.patch('/areas/status/:id', controller.patchAreaStatus);
router.delete('/areas/:id', controller.deleteArea);

module.exports = router;
