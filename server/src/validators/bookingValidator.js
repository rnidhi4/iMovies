const { body, query } = require('express-validator');
const { booking: bookingConfig } = require('../config/env');
const { objectIdParam, paginationQuery } = require('./commonValidator');

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

// GET /bookings?scope=upcoming|past&page=1&limit=6  (scope defaults to upcoming)
const listBookingsRules = [
  query('scope')
    .optional({ values: 'falsy' })
    .isIn(['upcoming', 'past']).withMessage('scope must be "upcoming" or "past"'),
  ...paginationQuery,
];

const bookingIdRules = [objectIdParam('id')];

// POST /bookings/:id/cancel  { reason? }
const cancelRules = [
  objectIdParam('id'),
  body('reason')
    .optional({ values: 'falsy' })
    .isString().withMessage('reason must be text').bail()
    .trim()
    .isLength({ max: 300 }).withMessage('reason must be 300 characters or fewer'),
];

module.exports = { holdRules, listBookingsRules, bookingIdRules, cancelRules };
