const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Show = require('../models/Show');
const ShowSeat = require('../models/ShowSeat');
const seatService = require('./seatService');
const ApiError = require('../utils/ApiError');
const { generateBookingReference } = require('../utils/bookingRef');
const { buildPaginationMeta } = require('../utils/pagination');
const { withTransaction, transactionsSupported } = require('../config/db');
const { booking: bookingConfig } = require('../config/env');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, PAYMENT_STATUS, SEAT_STATUS, CANCELLED_BY, ROLES } = require('../config/constants');

const { sessionOptions } = seatService;
const MAX_ATTEMPTS = 3; // only used if two bookings ever draw the same random reference

// Cancellation policy: hours before the show -> share of the money refunded
const REFUND_RULES = [
  { minHours: 24, percent: 100 },
  { minHours: 2, percent: 50 },
];

const joinLabels = (labels) => labels.join(', ');

// ---------- reading a booking ----------

// Which fields of the show (and its movie, theatre and screen) a booking carries
const SHOW_POPULATE = {
  path: 'show',
  select: 'startsAt endsAt movie theatre screen',
  populate: [
    { path: 'movie', select: 'title posterUrl language durationMins genres rating' },
    { path: 'theatre', select: 'name city address' },
    { path: 'screen', select: 'name' },
  ],
};

const loadBooking = (id) => Booking.findById(id).populate(SHOW_POPULATE).lean();

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

// ---------- listing a user's bookings ----------

// "Upcoming" = a paid booking, or an unpaid hold that is still running, for a show that has not started.
const upcomingCondition = (now) => ({
  showStartsAt: { $gt: now },
  $or: [
    { status: BOOKING_STATUS.CONFIRMED },
    { status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $gt: now } },
  ],
});

// "Past" = everything that was ever PAID and is not upcoming: finished shows and bookings that were
// cancelled after payment. Seat selections that were never paid (released, replaced or timed out) are
// abandoned carts, not bookings, so they stay out of both lists. They can still be opened by id.
const buildListFilter = (userId, scope, now) =>
  scope === 'past'
    ? { user: userId, confirmedAt: { $ne: null }, $nor: [upcomingCondition(now)] }
    : { user: userId, ...upcomingCondition(now) };

// GET /bookings?scope=upcoming|past&page=&limit=
// The filter ALWAYS starts with the logged-in user's id: nobody can list anybody else's bookings.
const listBookingsForUser = async ({ user, scope, page, limit }) => {
  const now = new Date();
  const filter = buildListFilter(user._id, scope, now);
  // soonest show first when upcoming, most recent first when past
  const sort = scope === 'past' ? { showStartsAt: -1, _id: -1 } : { showStartsAt: 1, _id: 1 };

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate(SHOW_POPULATE).lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings: bookings.map((booking) => serializeBooking(booking, now)),
    pagination: buildPaginationMeta(total, page, limit),
  };
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

// ---------- cancelling ----------

const FREE_SEAT = { $set: { status: SEAT_STATUS.AVAILABLE, booking: null, holdExpiresAt: null } };

const formatMoney = (amount) => `\u20B9${Number(amount).toLocaleString('en-IN')}`;

// Without transactions nothing is rolled back automatically, so put back what THIS request changed.
const undoCancel = async (booking, progress) => {
  if (progress.refundedPaymentId) {
    await Payment.updateOne({ _id: progress.refundedPaymentId }, { $set: { status: PAYMENT_STATUS.SUCCESS, refundedAmount: 0 } });
  }
  if (progress.flipped) {
    await Booking.updateOne(
      { _id: booking._id, status: BOOKING_STATUS.CANCELLED },
      { $set: { status: booking.status, paymentStatus: booking.paymentStatus, cancelledAt: null }, $unset: { cancellation: 1 } }
    );
  }
};

/**
 * POST /bookings/:id/cancel  { reason? }
 * - An unpaid hold is simply released (this is what "Release my seats" on Checkout does).
 * - A paid booking is cancelled under the refund policy (100% / 50% / not allowed), the demo payment is
 *   marked REFUNDED, and the seats go back on sale.
 * Only the owner can cancel. The booking itself is the gate: two cancels (or a cancel racing a payment)
 * cannot both win, because only one request can change it from its current status.
 */
const cancelBooking = async ({ user, bookingId, reason }) => {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking || String(booking.user) !== String(user._id)) throw ApiError.notFound('Booking not found');
  if (booking.status === BOOKING_STATUS.CANCELLED) throw ApiError.conflict('This booking has already been cancelled.');
  if (booking.status === BOOKING_STATUS.EXPIRED) {
    throw ApiError.conflict('This seat hold has already expired, so there is nothing to cancel.');
  }

  const isHold = booking.status === BOOKING_STATUS.PENDING_PAYMENT;
  let refundPercent = 0;
  let refundAmount = 0;
  if (!isHold) {
    const eligibility = getCancellationEligibility(booking);
    if (!eligibility.canCancel) throw ApiError.conflict(eligibility.message);
    ({ refundPercent, refundAmount } = eligibility);

    // A payment saves its record LAST. If it is missing, the payment is still being processed (this
    // matters on databases without transactions), so wait instead of cancelling half a payment.
    const completedPayment = await Payment.findOne({ booking: booking._id, status: PAYMENT_STATUS.SUCCESS }).lean();
    if (!completedPayment) throw ApiError.conflict('This payment is still being processed. Please try again in a moment.');
  }

  const progress = { flipped: false, refundedPaymentId: null };
  try {
    await withTransaction(async (session) => {
      const options = sessionOptions(session);

      // 1. The gate: only if the booking still has the status we looked at
      const flipped = await Booking.findOneAndUpdate(
        { _id: booking._id, user: user._id, status: booking.status },
        {
          $set: {
            status: BOOKING_STATUS.CANCELLED,
            cancelledAt: new Date(),
            paymentStatus: isHold ? booking.paymentStatus : BOOKING_PAYMENT_STATUS.REFUNDED,
            'cancellation.cancelledBy': CANCELLED_BY.USER,
            'cancellation.reason': reason || (isHold ? 'Seats released by user before payment' : 'Cancelled by user'),
            'cancellation.refundPercent': refundPercent,
            'cancellation.refundAmount': refundAmount,
          },
        },
        { new: true, ...options }
      ).lean();
      if (!flipped) throw ApiError.conflict('This booking has just changed. Please refresh and try again.');
      progress.flipped = true;

      // 2. Record the (demo) refund on the payment
      if (!isHold) {
        const refunded = await Payment.findOneAndUpdate(
          { booking: booking._id, status: PAYMENT_STATUS.SUCCESS },
          { $set: { status: PAYMENT_STATUS.REFUNDED, refundedAmount: refundAmount } },
          { new: true, ...options }
        ).lean();
        progress.refundedPaymentId = refunded ? refunded._id : null;
      }

      // 3. Put the seats back on sale (held or booked, they all return to AVAILABLE)
      await ShowSeat.updateMany(
        { booking: booking._id, status: { $in: [SEAT_STATUS.HELD, SEAT_STATUS.BOOKED] } },
        FREE_SEAT,
        options
      );
    });
  } catch (error) {
    if (!transactionsSupported()) await undoCancel(booking, progress).catch(() => {});
    throw error;
  }

  const saved = await loadBooking(booking._id);
  return {
    booking: serializeBooking(saved),
    message: isHold
      ? 'Your seats have been released.'
      : `Booking cancelled. A demo refund of ${formatMoney(refundAmount)} (${refundPercent}%) has been recorded.`,
  };
};

module.exports = {
  holdSeats,
  getBookingForUser,
  listBookingsForUser,
  cancelBooking,
  getCancellationEligibility,
  serializeBooking,
  REFUND_RULES,
};
