const express = require('express');
const router = express.Router();
const homeChefCategorysController = require('../controllers/homeChefCategorysController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', homeChefCategorysController.getAll);
router.post('/', verifyToken, homeChefCategorysController.create);
router.put('/:id', verifyToken, homeChefCategorysController.update);
router.delete('/:id', verifyToken, homeChefCategorysController.delete);

module.exports = router;
