const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const { SEAT_STATUS, BOOKING_STATUS } = require('../config/constants');

// Mongoose wants { session } only when there really is a session (transactions need a replica set)
const sessionOptions = (session) => (session ? { session } : {});

const FREE_SEAT = { $set: { status: SEAT_STATUS.AVAILABLE, booking: null, holdExpiresAt: null } };

/**
 * Tries to put a hold on several seats of one show for one booking.
 *
 * This is the core of "two people cannot hold the same seat". Every seat is its own document, and
 * MongoDB changes each document atomically: a seat is only switched to HELD if, at that very
 * moment, it is still AVAILABLE (or its earlier hold has expired, or it belongs to the buyer's own
 * earlier hold that is being replaced). If another request got there first, the condition fails
 * and that seat is simply not modified.
 *
 * Returns how many seats were claimed. The caller compares it with the number requested.
 */
const claimSeats = async ({ showId, labels, bookingId, holdExpiresAt, replacingBookingId, session }) => {
  const claimable = [
    { status: SEAT_STATUS.AVAILABLE },
    { status: SEAT_STATUS.HELD, holdExpiresAt: { $lt: new Date() } }, // an expired hold counts as free
  ];
  if (replacingBookingId) claimable.push({ status: SEAT_STATUS.HELD, booking: replacingBookingId });

  const result = await ShowSeat.updateMany(
    { show: showId, label: { $in: labels }, $or: claimable },
    { $set: { status: SEAT_STATUS.HELD, booking: bookingId, holdExpiresAt } },
    sessionOptions(session)
  );
  return result.modifiedCount;
};

// Frees every seat that is still held by the given booking(s). Seats that already belong to
// someone else are left alone because the filter names the booking.
const releaseSeats = (bookingIds, session) =>
  ShowSeat.updateMany(
    { booking: { $in: [].concat(bookingIds) }, status: SEAT_STATUS.HELD },
    FREE_SEAT,
    sessionOptions(session)
  );

// Which of these seats are really taken by someone else right now (booked, or held with time left).
// Call it AFTER our own partial claims were released, so seats that are free again are not listed.
const findUnavailableLabels = async ({ showId, labels, session }) => {
  const seats = await ShowSeat.find(
    {
      show: showId,
      label: { $in: labels },
      $or: [
        { status: SEAT_STATUS.BOOKED },
        { status: SEAT_STATUS.HELD, holdExpiresAt: { $gte: new Date() } },
      ],
    },
    'label row number',
    sessionOptions(session)
  ).lean();
  return seats
    .sort((a, b) => (a.row === b.row ? a.number - b.number : a.row.localeCompare(b.row)))
    .map((seat) => seat.label);
};

// The seats a booking currently holds, in seat-map order
const findHeldSeats = async (bookingId, session) => {
  const seats = await ShowSeat.find(
    { booking: bookingId, status: SEAT_STATUS.HELD },
    'label row number tier price',
    sessionOptions(session)
  ).lean();
  return seats.sort((a, b) => (a.row === b.row ? a.number - b.number : a.row.localeCompare(b.row)));
};

// Marks unpaid bookings whose hold ran out as EXPIRED and frees their seats.
// Safe to call at any time and any number of times. Pass showId to limit it to one show.
// (A timer will call this for every show in a later step.)
const expireStaleHolds = async ({ showId, now = new Date() } = {}) => {
  const filter = { status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $lt: now } };
  if (showId) filter.show = showId;

  const stale = await Booking.find(filter, '_id').lean();
  if (stale.length === 0) return 0;

  const ids = stale.map((booking) => booking._id);
  await releaseSeats(ids);
  await Booking.updateMany(
    { _id: { $in: ids }, status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $lt: now } },
    { $set: { status: BOOKING_STATUS.EXPIRED } }
  );
  return ids.length;
};

module.exports = { claimSeats, releaseSeats, findUnavailableLabels, findHeldSeats, expireStaleHolds, sessionOptions };
