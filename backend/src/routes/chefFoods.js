const express = require('express');
const router = express.Router();
const chefFoodController = require('../controllers/chefFoodController');
const { attachUser, verifyToken } = require('../middleware/authMiddleware');

router.get('/', attachUser, chefFoodController.getFoods);
router.get('/:id', attachUser, chefFoodController.getFoodById);
router.post('/', verifyToken, chefFoodController.createFood);
router.put('/:id', verifyToken, chefFoodController.updateFood);
router.delete('/:id', verifyToken, chefFoodController.deleteFood);

module.exports = router;
