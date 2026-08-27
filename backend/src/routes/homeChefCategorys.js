const express = require('express');
const router = express.Router();
const homeChefCategorysController = require('../controllers/homeChefCategorysController');
const { verifyTokenWithoutSubscription } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.get('/', homeChefCategorysController.getAll);
router.post('/', verifyTokenWithoutSubscription, upload.array('image', 10), homeChefCategorysController.create);
router.put('/:id', verifyTokenWithoutSubscription, upload.array('image', 10), homeChefCategorysController.update);
router.delete('/:id', verifyTokenWithoutSubscription, homeChefCategorysController.delete);

module.exports = router;
