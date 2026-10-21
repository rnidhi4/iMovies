const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, cookie } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Reads the JWT from the HTTP-only cookie, loads the user, and sets req.user.
// The role comes from the database on every request (not from the token), so removing
// someone's admin role takes effect immediately.
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies[cookie.name];
  if (!token) throw ApiError.unauthorized('Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    throw ApiError.unauthorized('Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('This account no longer exists');

  req.user = user;
  next();
});

module.exports = { authenticate };
