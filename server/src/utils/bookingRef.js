const crypto = require('crypto');

// No I, L, O, 0 or 1, so references are easy to read out loud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Example: IM-20261015-K7Q2XP. The database unique index is the real guarantee of
// uniqueness; the booking service retries on the (very unlikely) collision.
const generateBookingReference = (date = new Date()) => {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return `IM-${ymd}-${suffix}`;
};

module.exports = { generateBookingReference };
