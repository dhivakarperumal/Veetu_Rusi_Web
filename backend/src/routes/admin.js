const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

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

router.use(verifyToken);
router.use(requireRole(['admin']));

router.get('/homechefs', controller.getHomeChefs);
router.get('/homechefs/:id', controller.getHomeChefById);
router.post('/homechefs', homeChefUploadFields, controller.createHomeChef);
router.put('/homechefs/:id', homeChefUploadFields, controller.updateHomeChef);
router.delete('/homechefs/:id', controller.deleteHomeChef);
router.patch('/homechefs/:id/status', controller.updateHomeChefStatus);

module.exports = router;
