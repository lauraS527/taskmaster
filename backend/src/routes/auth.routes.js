const router = require('express').Router();
const auth = require('../middlewares/auth');
const { register, login, me } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);   // ruta protegida: pasa primero por el guardia

module.exports = router;