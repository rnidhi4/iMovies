const express = require('express');
const controller = require('../controllers/adminBookingController');
const { listBookingsRules, cancelBookingRules } = require('../validators/adminBookingValidator');
const validate = require('../middleware/validate');

// Mounted INSIDE adminRoutes.js, which already requires a logged-in admin for everything.
const router = express.Router();

router.get('/bookings', listBookingsRules, validate, controller.listBookings);
router.post('/bookings/:id/cancel', cancelBookingRules, validate, controller.cancelBooking);

module.exports = router;
