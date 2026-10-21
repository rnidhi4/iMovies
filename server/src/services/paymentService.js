const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ShowSeat = require('../models/ShowSeat');
const Show = require('../models/Show');
const seatService = require('./seatService');
const bookingService = require('./bookingService');
const ApiError = require('../utils/ApiError');
const { withTransaction, transactionsSupported } = require('../config/db');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, PAYMENT_STATUS, SEAT_STATUS } = require('../config/constants');

/**
 * DEMO PAYMENTS ONLY. No card details are asked for, sent or stored, and no money moves.
 * The "gateway" is just the `outcome` the user picks. To use a real gateway later, replace the
 * part of runPayment() that decides success or failure and keep everything around it.
 */

const { sessionOptions } = seatService;
const MAX_ATTEMPTS = 3; // only used if two payments ever draw the same random reference
const OUTCOMES = Object.freeze({ SUCCESS: 'success', FAILURE: 'failure' });

const FAILURE_REASON = 'Simulated failure: this demo payment was declined on purpose.';
const MESSAGES = {
  [PAYMENT_STATUS.SUCCESS]: 'Demo payment successful. Your booking is confirmed!',
  [PAYMENT_STATUS.FAILED]:
    'Demo payment failed (simulated). Your seats are still held, so you can try again before the timer runs out.',
  [PAYMENT_STATUS.REFUNDED]: 'This demo payment was refunded.',
  [PAYMENT_STATUS.INITIATED]: 'This demo payment is still being processed.',
};

// Example: DEMO-20261018-1A2B3C4D5E (unique per payment attempt)
const generateTransactionRef = (date = new Date()) =>
  `DEMO-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

// Only these fields ever leave the server (never the idempotency key)
const toPublicPayment = (payment) => ({
  _id: payment._id,
  transactionRef: payment.transactionRef,
  status: payment.status,
  amount: payment.amount,
  provider: payment.provider,
  failureReason: payment.failureReason,
  refundedAmount: payment.refundedAmount,
  createdAt: payment.createdAt,
});

// Why can't this booking be paid right now? Returns an error to throw, or null if it can be paid.
const getPaymentBlocker = (booking, now) => {
  if (booking.status === BOOKING_STATUS.CONFIRMED) return ApiError.conflict('This booking has already been paid and confirmed.');
  if (booking.status === BOOKING_STATUS.CANCELLED) return ApiError.conflict('This booking was cancelled, so it cannot be paid.');
  if (booking.status === BOOKING_STATUS.EXPIRED || (booking.holdExpiresAt && new Date(booking.holdExpiresAt) <= now)) {
    return new ApiError(410, 'Your seat hold has expired. Please choose your seats again.');
  }
  if (new Date(booking.showStartsAt) <= now) {
    return ApiError.conflict('This show has already started, so this booking can no longer be paid.');
  }
  return null;
};

// A deactivated show cannot take new payments. This runs only AFTER getPaymentBlocker(), which already
// turns away paid, cancelled and expired bookings, so it only ever applies to a booking that is still an
// unpaid hold. Confirmed bookings and their successful payments are never affected.
const getShowBlocker = async (booking, options = {}) => {
  const show = await Show.findById(booking.show, 'isActive', options).lean();
  if (show && show.isActive) return null;
  return ApiError.conflict('This show is no longer available, so this booking cannot be paid. Please choose another show.');
};

const findPaymentByKey = (bookingId, idempotencyKey) => Payment.findOne({ booking: bookingId, idempotencyKey }).lean();

// The reply the frontend expects: { booking, payment, message }
const buildResult = async ({ user, bookingId, payment }) => {
  const { booking } = await bookingService.getBookingForUser({ bookingId, user });
  return { booking, payment: toPublicPayment(payment), message: MESSAGES[payment.status] };
};

// Everything that changes the database for one payment attempt. It runs inside a transaction when
// the database supports one, so it either all happens or none of it does.
const runPayment = async ({ bookingId, userId, outcome, idempotencyKey, progress, session }) => {
  const options = sessionOptions(session);
  const now = new Date();

  const booking = await Booking.findById(bookingId, null, options).lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  const blocker = getPaymentBlocker(booking, now);
  if (blocker) throw blocker;
  const showBlocker = await getShowBlocker(booking, options);
  if (showBlocker) throw showBlocker;
  progress.previous = { paymentStatus: booking.paymentStatus, holdExpiresAt: booking.holdExpiresAt };

  const succeeded = outcome === OUTCOMES.SUCCESS;
  const payment = new Payment({
    booking: booking._id,
    user: userId,
    amount: booking.totalAmount,
    provider: 'DEMO',
    transactionRef: generateTransactionRef(now),
    idempotencyKey,
    status: succeeded ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
    failureReason: succeeded ? undefined : FAILURE_REASON,
  });

  // The booking may only change if it is STILL an unpaid, unexpired hold of this user. This single
  // conditional update is the gate that stops a double payment: when two requests race, exactly one
  // passes it. The other one stops right here and never touches the seats.
  const stillPayable = { _id: booking._id, user: userId, status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $gt: now } };
  const notPayableAnymore = async () => {
    const latest = await Booking.findById(booking._id, null, options).lean();
    return (latest && getPaymentBlocker(latest, new Date())) || ApiError.conflict('This booking can no longer be paid. Please refresh and check its status.');
  };

  if (succeeded) {
    // 1. Win the booking
    const confirmed = await Booking.findOneAndUpdate(
      stillPayable,
      { $set: { status: BOOKING_STATUS.CONFIRMED, paymentStatus: BOOKING_PAYMENT_STATUS.PAID, confirmedAt: now } },
      { new: true, ...options }
    ).lean();
    if (!confirmed) throw await notPayableAnymore();
    progress.bookingConfirmed = true;

    // 2. The seats must still be this booking's own, unexpired holds. Turn them into BOOKED one by one,
    //    remembering exactly which ones WE changed (so an undo never touches anyone else's work).
    const seats = await ShowSeat.find({ booking: booking._id }, '_id', options).lean();
    if (seats.length !== booking.seats.length) {
      throw ApiError.conflict('Some of your seats are no longer held for you. Please choose your seats again.');
    }
    for (const seat of seats) {
      // eslint-disable-next-line no-await-in-loop
      const converted = await ShowSeat.findOneAndUpdate(
        { _id: seat._id, booking: booking._id, status: SEAT_STATUS.HELD, holdExpiresAt: { $gt: now } },
        { $set: { status: SEAT_STATUS.BOOKED, holdExpiresAt: null } },
        { new: true, ...options }
      ).lean();
      if (converted) progress.convertedSeatIds.push(seat._id);
    }
    if (progress.convertedSeatIds.length !== booking.seats.length) {
      throw ApiError.conflict('Some of your seats are no longer held for you. Please choose your seats again.');
    }

    // 3. Record the payment
    await payment.save(options);
    progress.paymentId = payment._id;
  } else {
    // A failed payment changes nothing about the seats: the hold stays alive so the user can retry.
    const marked = await Booking.findOneAndUpdate(
      stillPayable,
      { $set: { paymentStatus: BOOKING_PAYMENT_STATUS.FAILED } },
      { new: true, ...options }
    ).lean();
    if (!marked) throw await notPayableAnymore();

    await payment.save(options);
    progress.paymentId = payment._id;
  }

  return payment._id;
};

// Without transactions nothing is rolled back automatically, so undo our own partial work.
// Only the payment, seats and booking state THIS request created or changed are touched.
const undoPartialWork = async (bookingId, progress) => {
  if (progress.paymentId) await Payment.deleteOne({ _id: progress.paymentId });
  if (progress.convertedSeatIds.length > 0) {
    await ShowSeat.updateMany(
      { _id: { $in: progress.convertedSeatIds }, booking: bookingId, status: SEAT_STATUS.BOOKED },
      { $set: { status: SEAT_STATUS.HELD, holdExpiresAt: progress.previous.holdExpiresAt } }
    );
  }
  if (progress.bookingConfirmed) {
    await Booking.updateOne(
      { _id: bookingId, status: BOOKING_STATUS.CONFIRMED },
      { $set: { status: BOOKING_STATUS.PENDING_PAYMENT, paymentStatus: progress.previous.paymentStatus, confirmedAt: null } }
    );
  }
};

/**
 * POST /payments/demo/:bookingId  { outcome: 'success' | 'failure' }  + Idempotency-Key header
 * Returns { booking, payment, message }. Both outcomes are a normal 200 reply: the frontend reads
 * payment.status to see what happened. Problems (expired, already paid...) are 4xx errors.
 */
const processDemoPayment = async ({ user, bookingId, outcome, idempotencyKey }) => {
  const booking = await Booking.findById(bookingId).lean();
  // Not yours (even for admins) looks exactly like "does not exist"
  if (!booking || String(booking.user) !== String(user._id)) throw ApiError.notFound('Booking not found');

  // Same Idempotency-Key again (double click, network retry): return the first result, do nothing new.
  const earlier = await findPaymentByKey(booking._id, idempotencyKey);
  if (earlier) return buildResult({ user, bookingId: booking._id, payment: earlier });

  const blocker = getPaymentBlocker(booking, new Date());
  if (blocker) {
    if (blocker.statusCode === 410) await seatService.expireStaleHolds({ showId: booking.show }).catch(() => {});
    throw blocker;
  }
  const showBlocker = await getShowBlocker(booking);
  if (showBlocker) throw showBlocker;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const progress = { paymentId: null, convertedSeatIds: [], bookingConfirmed: false, previous: null };
    try {
      // eslint-disable-next-line no-await-in-loop
      const paymentId = await withTransaction((session) =>
        runPayment({ bookingId: booking._id, userId: user._id, outcome, idempotencyKey, progress, session })
      );
      // eslint-disable-next-line no-await-in-loop
      const payment = await Payment.findById(paymentId).lean();
      // eslint-disable-next-line no-await-in-loop
      return await buildResult({ user, bookingId: booking._id, payment });
    } catch (error) {
      // eslint-disable-next-line no-await-in-loop
      if (!transactionsSupported()) await undoPartialWork(booking._id, progress).catch(() => {});

      // The same request raced with itself: the first one finished, so hand back its result.
      // eslint-disable-next-line no-await-in-loop
      const finished = await findPaymentByKey(booking._id, idempotencyKey);
      // eslint-disable-next-line no-await-in-loop
      if (finished) return await buildResult({ user, bookingId: booking._id, payment: finished });

      if (error.code === 11000 && error.keyPattern && error.keyPattern.transactionRef && attempt < MAX_ATTEMPTS) continue;
      throw error;
    }
  }
  throw ApiError.conflict('Could not process the payment. Please try again.');
};

module.exports = { processDemoPayment, generateTransactionRef, toPublicPayment, OUTCOMES, MESSAGES, FAILURE_REASON };
