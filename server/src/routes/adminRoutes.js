const express = require('express');
const { getStats, listUsers } = require('../controllers/adminController');
const { listUsersRules } = require('../validators/adminValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { ROLES } = require('../config/constants');
const catalogRoutes = require('./adminCatalogRoutes');
const showRoutes = require('./adminShowRoutes');
const bookingRoutes = require('./adminBookingRoutes');

const router = express.Router();

// EVERY route in this file needs a logged-in ADMIN.
// Not logged in -> 401. Logged in as a normal user -> 403. This runs before any handler below.
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/stats', getStats);
router.get('/users', listUsersRules, validate, listUsers);

// A2: movies, theatres and screens (already protected by the admin check above)
router.use(catalogRoutes);

// A3: shows (already protected by the admin check above)
router.use(showRoutes);

// A4: bookings (already protected by the admin check above)
router.use(bookingRoutes);

module.exports = router;
