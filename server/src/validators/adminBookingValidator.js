const { body, query } = require('express-validator');
const { BOOKING_STATUS } = require('../config/constants');
const { paginationQuery, objectIdParam } = require('./commonValidator');

// GET /admin/bookings?search=&status=&page=&limit=   (exactly what the admin Bookings page sends)
const listBookingsRules = [
  query('search')
    .optional({ values: 'falsy' })
    .isString().withMessage('search must be text').bail()
    .trim()
    .isLength({ max: 100 }).withMessage('search is too long'),
  query('status')
    .optional({ values: 'falsy' })
    .isIn(Object.values(BOOKING_STATUS)).withMessage('status is not valid'),
  ...paginationQuery,
];

// POST /admin/bookings/:id/cancel   body: { reason }  (the admin page requires a reason of 3+ characters)
const cancelBookingRules = [
  objectIdParam('id'),
  body('reason')
    .isString().withMessage('Please give a reason for the cancellation').bail()
    .trim()
    .isLength({ min: 3 }).withMessage('Please give a reason (at least 3 characters)').bail()
    .isLength({ max: 300 }).withMessage('Reason must be 300 characters or fewer'),
];

module.exports = { listBookingsRules, cancelBookingRules };
