const express = require('express');
const { holdSeats, listBookings, getBooking, cancelBooking } = require('../controllers/bookingController');
const { holdRules, listBookingsRules, bookingIdRules, cancelRules } = require('../validators/bookingValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Every booking route needs a logged-in user, and every query is limited to that user's own bookings
router.get('/', authenticate, listBookingsRules, validate, listBookings);
router.post('/hold', authenticate, holdRules, validate, holdSeats);
router.get('/:id', authenticate, bookingIdRules, validate, getBooking);
router.post('/:id/cancel', authenticate, cancelRules, validate, cancelBooking);

module.exports = router;
