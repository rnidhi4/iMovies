const { param, query } = require('express-validator');

// Usage: router.get('/:id', objectIdParam(), validate, handler)
const objectIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid id`);

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50')
    .toInt(),
];

module.exports = { objectIdParam, paginationQuery };
