const router = require('express').Router();
const auth = require('../middlewares/auth');
const {
  createTask, getTasks, getTask, updateTask, deleteTask
} = require('../controllers/task.controller');

router.use(auth);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;