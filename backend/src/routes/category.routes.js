const router = require('express').Router();
const auth = require('../middlewares/auth');
const {
  getCategories, createCategory, updateCategory, deleteCategory
} = require('../controllers/category.controller');

router.use(auth);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;