const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ShowSeat = require('../models/ShowSeat');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/escapeRegex');
const { buildPaginationMeta } = require('../utils/pagination');
const { withTransaction, transactionsSupported } = require('../config/db');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, PAYMENT_STATUS, SEAT_STATUS, CANCELLED_BY } = require('../config/constants');
const { serializeBooking } = require('./bookingService');

const POPULATE = [
  { path: 'user', select: 'name email' },
  {
    path: 'show',
    select: 'startsAt endsAt movie theatre screen',
    populate: [
      { path: 'movie', select: 'title' },
      { path: 'theatre', select: 'name city' },
      { path: 'screen', select: 'name' },
    ],
  },
];

const FREE_SEAT = { $set: { status: SEAT_STATUS.AVAILABLE, booking: null, holdExpiresAt: null } };
const formatMoney = (amount) => `\u20B9${Number(amount).toLocaleString('en-IN')}`;
const sessionOptions = (session) => (session ? { session } : {});

// Same shape the customer sees (serializeBooking), plus who booked it. Only name and email are ever included.
const toAdminBooking = (booking, now = new Date()) => ({
  ...serializeBooking(booking, now),
  user: booking.user ? { _id: booking.user._id, name: booking.user.name, email: booking.user.email } : null,
});

// GET /admin/bookings?search=&status=&page=&limit=
// "Status" filters match what the page SHOWS: an unpaid hold whose time ran out is displayed as EXPIRED
// (even before the clean-up runs), so it is found under EXPIRED and not under PENDING_PAYMENT.
const listBookings = async ({ search, status, page, limit, skip }) => {
  const now = new Date();
  const clauses = [];

  if (status === BOOKING_STATUS.EXPIRED) {
    clauses.push({
      $or: [
        { status: BOOKING_STATUS.EXPIRED },
        { status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $lte: now } },
      ],
    });
  } else if (status === BOOKING_STATUS.PENDING_PAYMENT) {
    clauses.push({ status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $gt: now } });
  } else if (status) {
    clauses.push({ status });
  }

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    const users = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id').limit(500).lean();
    clauses.push({ $or: [{ reference: pattern }, { user: { $in: users.map((user) => user._id) } }] });
  }

  const filter = clauses.length > 0 ? { $and: clauses } : {};
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(limit).populate(POPULATE).lean(),
    Booking.countDocuments(filter),
  ]);

  return { bookings: bookings.map((booking) => toAdminBooking(booking, now)), pagination: buildPaginationMeta(total, page, limit) };
};

// Without transactions nothing is rolled back automatically, so put back what THIS request changed.
const undoAdminCancel = async (booking, progress) => {
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
 * POST /admin/bookings/:id/cancel  { reason }
 * An admin cancels a PAID booking: the demo payment is marked REFUNDED in full, the booking is marked
 * cancelled by ADMIN, and the seats go back on sale. The customer's own cancel rules (24h / 2h refund
 * policy) do not apply to the admin, but the show must not have started yet.
 * The booking itself is the gate: two cancels (or an admin cancel racing the customer's cancel) cannot
 * both win, because only one request can change it from CONFIRMED.
 */
const adminCancelBooking = async ({ bookingId, reason }) => {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw ApiError.notFound('Booking not found');

  if (booking.status === BOOKING_STATUS.CANCELLED) throw ApiError.conflict('This booking has already been cancelled.');
  if (booking.status === BOOKING_STATUS.EXPIRED) throw ApiError.conflict('This seat hold has already expired, so there is nothing to cancel.');
  if (booking.status === BOOKING_STATUS.PENDING_PAYMENT) {
    throw ApiError.conflict('This is an unpaid seat hold, not a paid booking. It is released automatically when its time runs out.');
  }
  if (new Date(booking.showStartsAt) <= new Date()) {
    throw ApiError.conflict('This show has already started, so its bookings can no longer be cancelled.');
  }

  // A payment saves its record LAST. If it is missing, the payment is still being processed,
  // so wait instead of cancelling half a payment.
  const completedPayment = await Payment.findOne({ booking: booking._id, status: PAYMENT_STATUS.SUCCESS }).lean();
  if (!completedPayment) throw ApiError.conflict('This payment is still being processed. Please try again in a moment.');

  const refundAmount = booking.totalAmount;
  const progress = { flipped: false, refundedPaymentId: null };
  try {
    await withTransaction(async (session) => {
      const options = sessionOptions(session);

      // 1. The gate: only if the booking is still CONFIRMED
      const flipped = await Booking.findOneAndUpdate(
        { _id: booking._id, status: BOOKING_STATUS.CONFIRMED },
        {
          $set: {
            status: BOOKING_STATUS.CANCELLED,
            cancelledAt: new Date(),
            paymentStatus: BOOKING_PAYMENT_STATUS.REFUNDED,
            'cancellation.cancelledBy': CANCELLED_BY.ADMIN,
            'cancellation.reason': reason,
            'cancellation.refundPercent': 100,
            'cancellation.refundAmount': refundAmount,
          },
        },
        { new: true, ...options }
      ).lean();
      if (!flipped) throw ApiError.conflict('This booking has just changed. Please refresh and try again.');
      progress.flipped = true;

      // 2. Record the full (demo) refund on the payment
      const refunded = await Payment.findOneAndUpdate(
        { booking: booking._id, status: PAYMENT_STATUS.SUCCESS },
        { $set: { status: PAYMENT_STATUS.REFUNDED, refundedAmount: refundAmount } },
        { new: true, ...options }
      ).lean();
      progress.refundedPaymentId = refunded ? refunded._id : null;

      // 3. Put the seats back on sale
      await ShowSeat.updateMany(
        { booking: booking._id, status: { $in: [SEAT_STATUS.HELD, SEAT_STATUS.BOOKED] } },
        FREE_SEAT,
        options
      );
    });
  } catch (error) {
    if (!transactionsSupported()) await undoAdminCancel(booking, progress).catch(() => {});
    throw error;
  }

  const saved = await Booking.findById(booking._id).populate(POPULATE).lean();
  return {
    booking: toAdminBooking(saved),
    message: `Booking cancelled. A full demo refund of ${formatMoney(refundAmount)} has been recorded.`,
  };
};

module.exports = { listBookings, adminCancelBooking };
