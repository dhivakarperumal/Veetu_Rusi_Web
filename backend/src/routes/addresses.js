const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/addressController');

router.use(verifyToken);
router.get('/', controller.getUserAddresses);
router.post('/', controller.createUserAddress);
router.put('/:id', controller.updateUserAddress);
router.delete('/:id', controller.deleteUserAddress);

module.exports = router;
