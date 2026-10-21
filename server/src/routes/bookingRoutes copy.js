const express = require('express');
const { holdSeats, getBooking } = require('../controllers/bookingController');
const { holdRules, bookingIdRules } = require('../validators/bookingValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Every booking route needs a logged-in user
router.post('/hold', authenticate, holdRules, validate, holdSeats);
router.get('/:id', authenticate, bookingIdRules, validate, getBooking);

// Still to build: GET / (my bookings), POST /:id/cancel

module.exports = router;
