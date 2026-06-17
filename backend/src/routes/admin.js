const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const homeChefUploadFields = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
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
  { name: 'storage_area_photo', maxCount: 1 }
]);

const deliveryPartnerUploadFields = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'cover_photo', maxCount: 1 },
  { name: 'aadhaar_front_url', maxCount: 1 },
  { name: 'aadhaar_back_url', maxCount: 1 },
  { name: 'pan_card_url', maxCount: 1 },
  { name: 'selfie_verification_url', maxCount: 1 },
  { name: 'selfie_with_vehicle', maxCount: 1 },
  { name: 'selfie_with_aadhaar', maxCount: 1 },
  { name: 'police_verification_certificate', maxCount: 1 },
  { name: 'vehicle_front_photo', maxCount: 1 },
  { name: 'vehicle_back_photo', maxCount: 1 },
  { name: 'rc_book_image', maxCount: 1 },
  { name: 'insurance_document_image', maxCount: 1 },
  { name: 'license_front_image', maxCount: 1 },
  { name: 'license_back_image', maxCount: 1 }
]);

router.use(verifyToken);
router.use(requireRole(['admin']));

// Home Chef Management
router.get('/homechefs', adminController.getHomeChefs);
router.get('/homechefs/:id', adminController.getHomeChefById);
router.post('/homechefs', homeChefUploadFields, adminController.createHomeChef);
router.put('/homechefs/:id', homeChefUploadFields, adminController.updateHomeChef);
router.delete('/homechefs/:id', adminController.deleteHomeChef);
router.patch('/homechefs/:id/status', adminController.updateHomeChefStatus);

// Delivery Partner Management
router.get('/delivery-partners', adminController.getDeliveryPartners);
router.get('/delivery-partners/:id', adminController.getDeliveryPartnerById);
router.post('/delivery-partners', deliveryPartnerUploadFields, adminController.createDeliveryPartner);
router.put('/delivery-partners/:id', deliveryPartnerUploadFields, adminController.updateDeliveryPartner);
router.delete('/delivery-partners/:id', adminController.deleteDeliveryPartner);
router.patch('/delivery-partners/:id/status', adminController.updateDeliveryPartnerStatus);

module.exports = router;
