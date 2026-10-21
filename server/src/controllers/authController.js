const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { cookie } = require('../config/env');

const sendAuthResponse = (res, statusCode, message, user) => {
  const token = authService.signToken(user._id);
  // HTTP-only: JavaScript in the browser cannot read this cookie, which limits XSS damage
  res.cookie(cookie.name, token, cookie.options);
  res.status(statusCode).json({ success: true, message, data: { user: authService.toPublicUser(user) } });
};

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  // matchedData returns ONLY fields that passed validation (name, email, password)
  const { name, email, password } = matchedData(req, { locations: ['body'] });
  const user = await authService.register({ name, email, password });
  sendAuthResponse(res, 201, 'Account created successfully', user);
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const user = await authService.login({ email, password });
  sendAuthResponse(res, 200, 'Logged in successfully', user);
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(cookie.name, cookie.clearOptions);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: authService.toPublicUser(req.user) } });
});

module.exports = { register, login, logout, me };
