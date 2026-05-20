const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Apply JWT verification & superadmin role check to all superadmin endpoints
router.use(verifyToken);
router.use(requireRole(['superadmin', 'admin']));

// Dashboard Analytics
router.get('/dashboard-stats', controller.getDashboardStats);

// Home Chef Management
const homechefUploadFields = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'cover_banner', maxCount: 1 },
  { name: 'kitchen_photos', maxCount: 10 },
  { name: 'kitchen_videos', maxCount: 5 },
  { name: 'aadhaar_front_url', maxCount: 1 },
  { name: 'aadhaar_back_url', maxCount: 1 },
  { name: 'pan_card_url', maxCount: 1 },
  { name: 'fssai_certificate_url', maxCount: 1 },
  { name: 'gst_certificate_url', maxCount: 1 },
  { name: 'signature_url', maxCount: 1 },
  { name: 'selfie_verification_url', maxCount: 1 }
]);
router.get('/homechefs', controller.getHomeChefs);
router.post('/homechefs', homechefUploadFields, controller.createHomeChef);
router.put('/homechefs/:id', homechefUploadFields, controller.updateHomeChef);
router.patch('/homechefs/status/:id', controller.patchHomeChefStatus);
router.delete('/homechefs/:id', controller.deleteHomeChef);

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

// Delivery Partner Management
router.get('/delivery-partners', controller.getDeliveryPartners);
router.post('/delivery-partners', controller.createDeliveryPartner);
router.put('/delivery-partners/:id', controller.updateDeliveryPartner);
router.delete('/delivery-partners/:id', controller.deleteDeliveryPartner);

// User Management
router.get('/users', controller.getUsers);
router.patch('/users/status/:id', controller.patchUserStatus);
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
  { name: 'gst_certificate_url', maxCount: 1 },
  { name: 'fssai_license_url', maxCount: 1 },
  { name: 'shop_license_url', maxCount: 1 },
  { name: 'vehicle_rc_url', maxCount: 1 },
  { name: 'driving_license_url', maxCount: 1 },
  { name: 'bank_passbook_url', maxCount: 1 },
  { name: 'signature_url', maxCount: 1 }
]);
router.get('/franchises', controller.getFranchises);
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

// Reports Management
router.get('/reports', controller.getReportsList);

module.exports = router;
