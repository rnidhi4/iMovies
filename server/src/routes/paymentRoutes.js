const express = require('express');
const { payDemo } = require('../controllers/paymentController');
const { demoPaymentRules } = require('../validators/paymentValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// DEMO payments only. A real gateway would get its own route and webhook later.
router.post('/demo/:bookingId', authenticate, paymentLimiter, demoPaymentRules, validate, payDemo);

module.exports = router;
