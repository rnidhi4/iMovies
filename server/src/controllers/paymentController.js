const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

// POST /api/v1/payments/demo/:bookingId
const payDemo = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const outcome = data.outcome || req.body.outcome; // already validated: 'success' or 'failure'

  const result = await paymentService.processDemoPayment({
    user: req.user,
    bookingId: req.params.bookingId,
    outcome,
    idempotencyKey: req.get('Idempotency-Key').trim(),
  });

  res.json({
    success: true,
    message: result.message,
    data: { booking: result.booking, payment: result.payment },
  });
});

module.exports = { payDemo };
