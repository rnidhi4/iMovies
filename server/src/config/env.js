const path = require('path');
const dotenv = require('dotenv');

// Loads server/.env. Variables already set in the real environment (e.g. on Render) win.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Fail fast with a clear message instead of crashing later with a confusing one.
const required = ['JWT_SECRET', 'CLIENT_URL'];
if (!isTest) required.push('MONGODB_URI');

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill them in.'
  );
}

if (!isTest && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be one of: lax, strict, none.');
}

const secure =
  process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === 'true' : isProduction;

// Browsers reject SameSite=None cookies that are not Secure.
if (sameSite === 'none' && !secure) {
  throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true (HTTPS).');
}

const jwtExpiresDays = toInt(process.env.JWT_EXPIRES_DAYS, 7);

const baseCookieOptions = { httpOnly: true, secure, sameSite, path: '/' };

module.exports = {
  nodeEnv,
  isProduction,
  isTest,
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: `${jwtExpiresDays}d`,
  clientOrigins: process.env.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cookie: {
    name: 'imovies_token',
    options: { ...baseCookieOptions, maxAge: jwtExpiresDays * 24 * 60 * 60 * 1000 },
    // clearCookie must use the same attributes (except maxAge) as the cookie that was set
    clearOptions: baseCookieOptions,
  },
  booking: {
    holdMinutes: toInt(process.env.HOLD_MINUTES, 7),
    maxSeatsPerBooking: toInt(process.env.MAX_SEATS_PER_BOOKING, 8),
  },
};
