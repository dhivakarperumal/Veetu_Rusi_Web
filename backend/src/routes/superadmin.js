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
router.get('/homechefs', controller.getHomeChefs);
router.post(
  '/homechefs', 
  upload.fields([
    { name: 'aadhaar_doc', maxCount: 1 }, 
    { name: 'pan_doc', maxCount: 1 }
  ]), 
  controller.createHomeChef
);
router.put('/homechefs/:id', controller.updateHomeChef);
router.patch('/homechefs/status/:id', controller.patchHomeChefStatus);
router.delete('/homechefs/:id', controller.deleteHomeChef);

// Restaurant Management
router.get('/restaurants', controller.getRestaurants);
router.post('/restaurants', controller.createRestaurant);
router.put('/restaurants/:id', controller.updateRestaurant);
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
router.get('/franchises', controller.getFranchises);
router.post('/franchises', controller.createFranchise);
router.patch('/franchises/approve/:id', controller.approveFranchise);
router.put('/franchises/:id', controller.updateFranchise);
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
