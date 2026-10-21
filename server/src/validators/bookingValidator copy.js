const { body } = require('express-validator');
const { booking: bookingConfig } = require('../config/env');
const { objectIdParam } = require('./commonValidator');

// POST /bookings/hold  { showId, seats: ["A1", "A2"] }
const holdRules = [
  body('showId')
    .isString().withMessage('showId is required').bail()
    .isMongoId().withMessage('showId must be a valid id'),
  body('seats')
    .isArray({ min: 1, max: bookingConfig.maxSeatsPerBooking })
    .withMessage(`Choose between 1 and ${bookingConfig.maxSeatsPerBooking} seats`),
  body('seats.*')
    .isString().withMessage('Each seat must be text').bail()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{1,2}\d{1,2}$/).withMessage('Seat labels look like A5 or B12'),
  body('seats')
    .custom((seats) => Array.isArray(seats) && new Set(seats).size === seats.length)
    .withMessage('Each seat can only be chosen once'),
];

const bookingIdRules = [objectIdParam('id')];

module.exports = { holdRules, bookingIdRules };
