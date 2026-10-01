const router = require('express').Router();
const auth = require('../middlewares/auth');
const {
  register, login, me, forgotPassword, resetPassword
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;