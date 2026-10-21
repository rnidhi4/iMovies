const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn, isTest } = require('../config/env');
const { ROLES } = require('../config/constants');
const ApiError = require('../utils/ApiError');

// 12 rounds is a good cost today. Tests use 4 to stay fast.
const BCRYPT_ROUNDS = isTest ? 4 : 12;

// Compared against when the email does not exist, so "unknown email" and "wrong password"
// take the same time and the response never reveals which one it was.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

// The only shape of a user that is ever sent to clients.
const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // role is always 'user' here. Admins are created only by the createAdmin script.
  // (If two sign-ups race, the unique index rejects the second one with a 409.)
  return User.create({ name, email, passwordHash, role: ROLES.USER });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordMatches) throw ApiError.unauthorized('Invalid email or password');
  return user;
};

module.exports = { register, login, signToken, toPublicUser, BCRYPT_ROUNDS };
