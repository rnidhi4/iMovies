const rateLimit = require('express-rate-limit');
const { isTest } = require('../config/env');

const buildLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest, // keep automated tests from tripping the limits
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Applied to every API route
const apiLimiter = buildLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  message: 'Too many requests. Please try again later.',
});

// Stricter: slows down password guessing on login/register
const authLimiter = buildLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 20,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Applied to the demo payment route
const paymentLimiter = buildLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: 30,
  message: 'Too many payment attempts. Please try again later.',
});

module.exports = { apiLimiter, authLimiter, paymentLimiter };
