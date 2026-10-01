const express = require('express');
const controller = require('../controllers/franchiseSubscriptionRazorpayKeysController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyToken);
router.use(requireRole(['superadmin']));

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.setStatus);
router.delete('/:id', controller.remove);

module.exports = router;