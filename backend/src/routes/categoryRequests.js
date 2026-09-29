const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryRequestController');
const { verifyTokenWithoutSubscription, requireRole } = require('../middleware/authMiddleware');

router.post('/', verifyTokenWithoutSubscription, requireRole(['chef', 'homechef']), controller.create);
router.get('/mine', verifyTokenWithoutSubscription, requireRole(['chef', 'homechef']), controller.listMine);
router.get('/', verifyTokenWithoutSubscription, requireRole(['admin']), controller.list);
router.patch('/:id', verifyTokenWithoutSubscription, requireRole(['admin']), controller.review);

module.exports = router;