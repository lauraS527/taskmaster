const router = require('express').Router();
const auth = require('../middlewares/auth');
const {
  getProfile, updateProfile, changePassword
} = require('../controllers/user.controller');

router.use(auth);   // todas las rutas de este archivo exigen estar logueado

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);

module.exports = router;