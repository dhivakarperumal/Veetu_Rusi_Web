const express = require('express');
const router = express.Router();
const recipeDetailsController = require('../controllers/recipeDetailsController');
const { attachUser } = require('../middleware/authMiddleware');

router.get('/', recipeDetailsController.getAllRecipes);
router.get('/:id', recipeDetailsController.getRecipeById);
router.post('/', attachUser, recipeDetailsController.createRecipe);
router.put('/:id', recipeDetailsController.updateRecipe);
router.delete('/:id', recipeDetailsController.deleteRecipe);

module.exports = router;
