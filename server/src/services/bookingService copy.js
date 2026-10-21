const Payment = require('../models/Payment');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const ShowSeat = require('../models/ShowSeat');
const seatService = require('./seatService');
const ApiError = require('../utils/ApiError');
const { generateBookingReference } = require('../utils/bookingRef');
const { withTransaction, transactionsSupported } = require('../config/db');
const { booking: bookingConfig } = require('../config/env');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, CANCELLED_BY, ROLES } = require('../config/constants');

const { sessionOptions } = seatService;
const MAX_ATTEMPTS = 3; // only used if two bookings ever draw the same random reference

// Cancellation policy: hours before the show -> share of the money refunded
const REFUND_RULES = [
  { minHours: 24, percent: 100 },
  { minHours: 2, percent: 50 },
];

const joinLabels = (labels) => labels.join(', ');

// ---------- reading a booking ----------

const loadBooking = (id) =>
  Booking.findById(id)
    .populate({
      path: 'show',
      select: 'startsAt endsAt movie theatre screen',
      populate: [
        { path: 'movie', select: 'title posterUrl language durationMins genres rating' },
        { path: 'theatre', select: 'name city address' },
        { path: 'screen', select: 'name' },
      ],
    })
    .lean();

// The shape the frontend expects. An unpaid hold whose time ran out is reported as EXPIRED
// even before the clean-up timer has run.
const serializeBooking = (booking, now = new Date()) => {
  const holdRanOut =
    booking.status === BOOKING_STATUS.PENDING_PAYMENT && booking.holdExpiresAt && new Date(booking.holdExpiresAt) <= now;
  return {
    _id: booking._id,
    reference: booking.reference,
    status: holdRanOut ? BOOKING_STATUS.EXPIRED : booking.status,
    paymentStatus: booking.paymentStatus,
    totalAmount: booking.totalAmount,
    seats: booking.seats,
    holdExpiresAt: booking.holdExpiresAt,
    confirmedAt: booking.confirmedAt,
    cancelledAt: booking.cancelledAt,
    cancellation: booking.cancellation,
    showStartsAt: booking.showStartsAt,
    createdAt: booking.createdAt,
    show: booking.show,
  };
};

// What would happen if the user cancelled right now?
const getCancellationEligibility = (booking, now = new Date()) => {
  if (booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
    return { canCancel: true, refundPercent: 0, refundAmount: 0, message: 'This is an unpaid seat hold. You can release it at any time.' };
  }
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    return { canCancel: false, refundPercent: 0, refundAmount: 0, message: `This booking is ${booking.status.toLowerCase()} and cannot be cancelled.` };
  }

  const hoursLeft = (new Date(booking.showStartsAt).getTime() - now.getTime()) / (60 * 60 * 1000);
  const rule = REFUND_RULES.find((candidate) => hoursLeft >= candidate.minHours);
  if (!rule) {
    return { canCancel: false, refundPercent: 0, refundAmount: 0, message: 'Cancellation is not allowed less than 2 hours before the show.' };
  }
  return {
    canCancel: true,
    refundPercent: rule.percent,
    refundAmount: Math.round((booking.totalAmount * rule.percent) / 100),
    message: `You will get ${rule.percent}% of the amount back (demo refund).`,
  };
};

const toPublicPayment = (payment) =>
  payment && {
    _id: payment._id,
    transactionRef: payment.transactionRef,
    status: payment.status,
    amount: payment.amount,
    provider: payment.provider,
    failureReason: payment.failureReason,
    refundedAmount: payment.refundedAmount,
    createdAt: payment.createdAt,
  };

// GET /bookings/:id. Only the owner (or an admin) may read a booking. Everyone else gets 404,
// so nobody can find out which booking ids exist.
const getBookingForUser = async ({ bookingId, user }) => {
  const booking = await loadBooking(bookingId);
  const isOwner = booking && String(booking.user) === String(user._id);
  if (!booking || (!isOwner && user.role !== ROLES.ADMIN)) throw ApiError.notFound('Booking not found');

  const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 }).lean();
  const view = serializeBooking(booking);
  return { booking: view, payment: toPublicPayment(payment) || null, eligibility: getCancellationEligibility(view) };
};

// ---------- holding seats ----------

/**
 * POST /bookings/hold. Reserves seats for a few minutes while the user pays.
 *
 * 1. Check the show and that every seat label really exists in it.
 * 2. Free any holds on this show that already ran out.
 * 3. In ONE step (a transaction on Atlas) claim the seats, release the user's older unpaid hold
 *    for this show if there is one, and create the booking.
 * If any seat was taken by someone else in the meantime, nothing is changed and the user gets a 409.
 */
const holdSeats = async ({ user, showId, labels }) => {
  const wanted = [...new Set(labels.map((label) => String(label).trim().toUpperCase()))];
  if (wanted.length === 0 || wanted.length > bookingConfig.maxSeatsPerBooking) {
    throw ApiError.badRequest(`Choose between 1 and ${bookingConfig.maxSeatsPerBooking} seats`);
  }

  const show = await Show.findOne({ _id: showId, isActive: true }, 'startsAt').lean();
  if (!show) throw ApiError.notFound('Show not found');
  if (new Date(show.startsAt) <= new Date()) {
    throw ApiError.conflict('This show has already started, so seats can no longer be booked');
  }

  const existingSeats = await ShowSeat.find({ show: showId, label: { $in: wanted } }, 'label').lean();
  const known = new Set(existingSeats.map((seat) => seat.label));
  const unknown = wanted.filter((label) => !known.has(label));
  if (unknown.length > 0) {
    const message = `${unknown.length === 1 ? 'Seat' : 'Seats'} ${joinLabels(unknown)} ${unknown.length === 1 ? 'does' : 'do'} not exist in this show`;
    throw ApiError.badRequest(message, [{ field: 'seats', message }]);
  }

  await seatService.expireStaleHolds({ showId });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let attemptedBookingId = null;
    try {
      // eslint-disable-next-line no-await-in-loop
      const bookingId = await withTransaction(async (session) => {
        const replacing = await Booking.findOne(
          { user: user._id, show: showId, status: BOOKING_STATUS.PENDING_PAYMENT },
          '_id',
          sessionOptions(session)
        ).lean();

        const holdExpiresAt = new Date(Date.now() + bookingConfig.holdMinutes * 60 * 1000);
        const booking = new Booking({
          reference: generateBookingReference(),
          user: user._id,
          show: showId,
          showStartsAt: show.startsAt,
          status: BOOKING_STATUS.PENDING_PAYMENT,
          paymentStatus: BOOKING_PAYMENT_STATUS.UNPAID,
          holdExpiresAt,
        });
        attemptedBookingId = booking._id;

        const claimed = await seatService.claimSeats({
          showId,
          labels: wanted,
          bookingId: booking._id,
          holdExpiresAt,
          replacingBookingId: replacing && replacing._id,
          session,
        });

        if (claimed !== wanted.length) {
          await seatService.releaseSeats(booking._id, session); // give back any seat we did manage to grab
          const taken = await seatService.findUnavailableLabels({ showId, labels: wanted, session });
          const message = taken.length > 0
            ? `${taken.length === 1 ? 'Seat' : 'Seats'} ${joinLabels(taken)} ${taken.length === 1 ? 'is' : 'are'} no longer available. Please choose different seats.`
            : 'Another user was reserving some of these seats at the same moment. Please try again.';
          throw ApiError.conflict(message, [{ field: 'seats', message }]);
        }

        // Price the booking from the seats we actually hold, not from what the browser claimed
        const heldSeats = await seatService.findHeldSeats(booking._id, session);
        booking.seats = heldSeats.map(({ label, tier, price }) => ({ label, tier, price }));
        booking.totalAmount = booking.seats.reduce((sum, seat) => sum + seat.price, 0);

        if (replacing) {
          // The user chose new seats: their older unpaid hold for this show is replaced
          await seatService.releaseSeats(replacing._id, session);
          await Booking.updateOne(
            { _id: replacing._id, status: BOOKING_STATUS.PENDING_PAYMENT },
            {
              $set: {
                status: BOOKING_STATUS.CANCELLED,
                cancelledAt: new Date(),
                'cancellation.cancelledBy': CANCELLED_BY.USER,
                'cancellation.reason': 'Replaced by a new seat selection',
              },
            },
            sessionOptions(session)
          );
        }

        await booking.save(sessionOptions(session));
        return booking._id;
      });

      // eslint-disable-next-line no-await-in-loop
      const saved = await loadBooking(bookingId);
      return serializeBooking(saved);
    } catch (error) {
      // Without transactions nothing is rolled back automatically, so hand the seats back ourselves
      if (!transactionsSupported() && attemptedBookingId) {
        // eslint-disable-next-line no-await-in-loop
        await seatService.releaseSeats(attemptedBookingId).catch(() => {});
      }
      if (error.code === 11000 && error.keyPattern && error.keyPattern.reference && attempt < MAX_ATTEMPTS) continue;
      if (error.code === 11000 && error.keyPattern && error.keyPattern.user) {
        throw ApiError.conflict('You already have a seat selection in progress for this show. Please wait a moment and try again.');
      }
      throw error;
    }
  }
  throw ApiError.conflict('Could not reserve your seats. Please try again.');
};

module.exports = { holdSeats, getBookingForUser, getCancellationEligibility, serializeBooking, REFUND_RULES };
