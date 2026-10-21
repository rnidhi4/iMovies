const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Put this after a list of express-validator checks in a route.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((item) => ({
    field: item.path,
    message: item.msg,
  }));
  return next(ApiError.badRequest('Validation failed', errors));
};

module.exports = validate;
