const express = require('express');
const router = express.Router();
const nearbyChefsController = require('../controllers/nearbyChefsController');
const { attachUser } = require('../middleware/authMiddleware');

router.get('/', attachUser, nearbyChefsController.getNearbyChefs);

module.exports = router;
