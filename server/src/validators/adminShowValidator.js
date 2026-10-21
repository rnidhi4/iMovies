const { body } = require('express-validator');
const { paginationQuery, objectIdParam } = require('./commonValidator');

const MAX_PRICE = 100000; // sanity limit so a typo like 20000000 is caught

const startsAtRule = (optional) => {
  const rule = body('startsAt');
  if (optional) rule.optional();
  return rule
    .isString().withMessage('Start time is required').bail()
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Start time is not a valid date and time');
};

const priceRule = (name, label, optional) => {
  const rule = body(name);
  if (optional) rule.optional();
  return rule
    .isInt({ min: 0, max: MAX_PRICE }).withMessage(`${label} price must be a whole number of rupees (0 to ${MAX_PRICE})`)
    .toInt();
};

// GET /admin/shows?page=&limit=   (the admin Shows page only sends these two)
const listShowsRules = [...paginationQuery];

// POST /admin/shows   body: { movie, screen, startsAt, pricing: { STANDARD, PREMIUM } }
const createShowRules = [
  body('movie').isString().withMessage('Movie is required').bail().isMongoId().withMessage('Movie must be a valid id'),
  body('screen').isString().withMessage('Screen is required').bail().isMongoId().withMessage('Screen must be a valid id'),
  startsAtRule(false),
  priceRule('pricing.STANDARD', 'Standard', false),
  priceRule('pricing.PREMIUM', 'Premium', false),
];

// PUT /admin/shows/:id   body: { startsAt, pricing, isActive }  (movie and screen can NOT be changed)
const updateShowRules = [
  objectIdParam('id'),
  startsAtRule(true),
  priceRule('pricing.STANDARD', 'Standard', true),
  priceRule('pricing.PREMIUM', 'Premium', true),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false'),
];

module.exports = { listShowsRules, createShowRules, updateShowRules };
