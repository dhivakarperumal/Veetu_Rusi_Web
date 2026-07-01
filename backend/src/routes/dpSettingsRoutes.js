const express = require('express');
const router = express.Router();
const dpSettingsController = require('../controllers/dpSettingsController');

router.get('/', dpSettingsController.getSettings);
router.post('/', dpSettingsController.updateSettings);

module.exports = router;
