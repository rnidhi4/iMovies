const { isProduction, isTest } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Converts any error into our standard JSON shape:
// { success: false, message, errors? }  (+ stack, only outside production)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong on our side. Please try again.';
  let errors = [];

  if (err instanceof ApiError) {
    ({ statusCode, message, errors } = err);
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400; // Mongoose schema validation
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409; // duplicate key (unique index)
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  if (statusCode >= 500 && !isTest) {
    // Log the problem, never the request body (it may contain passwords).
    console.error(`[${req.method} ${req.originalUrl}]`, err.stack || err.message);
  }

  const body = { success: false, message };
  if (errors.length > 0) body.errors = errors;
  if (!isProduction && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
