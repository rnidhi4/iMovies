const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
