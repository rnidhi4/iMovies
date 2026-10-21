const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

const MOVIE_STATUS = Object.freeze({ NOW_SHOWING: 'NOW_SHOWING', UPCOMING: 'UPCOMING' });

const SEAT_TIER = Object.freeze({ STANDARD: 'STANDARD', PREMIUM: 'PREMIUM' });

const SEAT_STATUS = Object.freeze({ AVAILABLE: 'AVAILABLE', HELD: 'HELD', BOOKED: 'BOOKED' });

const BOOKING_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});

// Summary shown on the booking itself (the Payment document holds the details)
const BOOKING_PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

const PAYMENT_STATUS = Object.freeze({
  INITIATED: 'INITIATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

const CANCELLED_BY = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });

module.exports = {
  ROLES,
  MOVIE_STATUS,
  SEAT_TIER,
  SEAT_STATUS,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
  PAYMENT_STATUS,
  CANCELLED_BY,
};
