const { body, header } = require('express-validator');
const { objectIdParam } = require('./commonValidator');

// Letters, numbers and - _ . : only. This accepts the UUIDs (and the fallback keys) the frontend sends.
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,100}$/;

const demoPaymentRules = [
  objectIdParam('bookingId'),
  header('idempotency-key')
    .isString().withMessage('The Idempotency-Key header is required').bail()
    .trim()
    .matches(IDEMPOTENCY_KEY).withMessage('Idempotency-Key must be 8 to 100 letters, numbers or - _ . :'),
  body('outcome')
    .isIn(['success', 'failure']).withMessage('outcome must be "success" or "failure"'),
  // This is a demo: refuse anything else in the body so card details can never be sent by mistake
  body()
    .custom((payload) => payload && typeof payload === 'object' && Object.keys(payload).every((key) => key === 'outcome'))
    .withMessage('Demo payments accept only "outcome". Never send card details.'),
];

module.exports = { demoPaymentRules, IDEMPOTENCY_KEY };
