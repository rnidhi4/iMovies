const cors = require('cors');
const { clientOrigins } = require('./env');
const ApiError = require('../utils/ApiError');

// credentials: true lets the browser send our HTTP-only cookie on cross-origin requests.
// That is only safe with an explicit allow-list (never origin: '*').
module.exports = cors({
  origin(origin, callback) {
    // Requests without an Origin header (curl, Postman, health checks) are not browser
    // cross-site requests, so CORS does not apply. CSRF protection is handled separately.
    if (!origin || clientOrigins.includes(origin)) return callback(null, true);
    return callback(ApiError.forbidden('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'Idempotency-Key'],
});
