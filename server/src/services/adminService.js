const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');
const { escapeRegex } = require('../utils/escapeRegex');
const { buildPaginationMeta } = require('../utils/pagination');

// "Real" bookings = bookings that were paid at some point (confirmedAt is set when payment succeeds).
// Unpaid holds that expired or were released are abandoned carts, so they are not counted here.
// This matches how the user-side "My Bookings" page treats them.
const PAID_EVER = { confirmedAt: { $ne: null } };

// Revenue (demo): money still kept = successful payments + the part NOT refunded on refunded payments.
const computeRevenue = async () => {
  const [row] = await Payment.aggregate([
    { $match: { status: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.REFUNDED] } } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$status', PAYMENT_STATUS.SUCCESS] },
              '$amount',
              { $subtract: ['$amount', { $ifNull: ['$refundedAmount', 0] }] },
            ],
          },
        },
      },
    },
  ]);
  return row ? row.total : 0;
};

// GET /admin/stats  (only things the database can really provide)
const getStats = async () => {
  const [
    totalUsers,
    totalMovies,
    totalTheatres,
    totalShows,
    confirmedBookings,
    cancelledBookings,
    totalRevenue,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({}),
    Movie.countDocuments({}),
    Theatre.countDocuments({}),
    Show.countDocuments({}),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
    Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED, ...PAID_EVER }),
    computeRevenue(),
    Booking.find(PAID_EVER)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'show', select: 'startsAt movie', populate: { path: 'movie', select: 'title' } })
      .lean(),
  ]);

  return {
    totalRevenue,
    totalBookings: confirmedBookings + cancelledBookings,
    confirmedBookings,
    cancelledBookings,
    totalUsers,
    totalMovies,
    totalTheatres,
    totalShows,
    recentBookings: recentBookings.map((booking) => ({
      _id: booking._id,
      reference: booking.reference,
      user: booking.user ? { name: booking.user.name, email: booking.user.email } : null,
      show: booking.show
        ? { startsAt: booking.show.startsAt, movie: booking.show.movie ? { title: booking.show.movie.title } : null }
        : null,
      totalAmount: booking.totalAmount,
      status: booking.status,
      createdAt: booking.createdAt,
    })),
  };
};

// GET /admin/users?search=&page=&limit=
// Only safe fields are returned. The password hash is never selected (and never sent).
const listUsers = async ({ search, page, limit, skip }) => {
  const filter = {};
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('name email role createdAt').sort({ createdAt: -1, _id: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = { getStats, listUsers };
