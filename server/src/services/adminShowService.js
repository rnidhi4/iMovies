const Show = require('../models/Show');
const Movie = require('../models/Movie');
const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');
const { SEAT_STATUS, SEAT_TIER, BOOKING_STATUS } = require('../config/constants');
const { withTransaction } = require('../config/db');
const showService = require('./showService');

const POPULATE = [
  { path: 'movie', select: 'title' },
  { path: 'theatre', select: 'name city' },
  { path: 'screen', select: 'name' },
];

const loadForAdmin = (id) => Show.findById(id).populate(POPULATE).lean();

const inSameMinute = (a, b) => Math.floor(new Date(a).getTime() / 60000) === Math.floor(new Date(b).getTime() / 60000);

const startsAtProblem = (message) => ApiError.badRequest(message, [{ field: 'startsAt', message }]);

// GET /admin/shows?page=&limit=  (newest start time first, so upcoming shows are easy to find)
const listShows = async ({ page, limit, skip }) => {
  const [shows, total] = await Promise.all([
    Show.find({}).sort({ startsAt: -1, _id: 1 }).skip(skip).limit(limit).populate(POPULATE).lean(),
    Show.countDocuments({}),
  ]);
  return { shows, pagination: buildPaginationMeta(total, page, limit) };
};

// POST /admin/shows
// Creating the show, its end time, the overlap check and ALL of its seat documents is done by the
// existing showService.createShow (one transaction). This function only adds the admin rules around it.
const createShow = async ({ movie, screen, startsAt, pricing }) => {
  const start = new Date(startsAt);
  if (start <= new Date()) throw startsAtProblem('Start time must be in the future');

  let show;
  try {
    show = await showService.createShow({
      movieId: movie,
      screenId: screen,
      startsAt: start,
      pricing: { [SEAT_TIER.STANDARD]: pricing.STANDARD, [SEAT_TIER.PREMIUM]: pricing.PREMIUM },
    });
  } catch (error) {
    if (error && error.code === 11000) throw ApiError.conflict('This screen already has a show starting at that time');
    throw error;
  }
  return loadForAdmin(show._id);
};

// Is anyone relying on this show's current time right now? (a paid booking, or an unpaid hold with time left)
const hasLiveBookings = async (showId, session) => {
  const now = new Date();
  const [booking, bookedSeat] = await Promise.all([
    Booking.exists({
      show: showId,
      $or: [
        { status: BOOKING_STATUS.CONFIRMED },
        { status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $gt: now } },
      ],
    }).session(session),
    ShowSeat.exists({ show: showId, status: SEAT_STATUS.BOOKED }).session(session),
  ]);
  return Boolean(booking || bookedSeat);
};

// PUT /admin/shows/:id   (movie and screen never change; that would break the seats and bookings)
const updateShow = async (id, { startsAt, pricing, isActive }) => {
  if (startsAt === undefined && pricing === undefined && isActive === undefined) {
    throw ApiError.badRequest('Nothing to update');
  }

  await withTransaction(async (session) => {
    const show = await Show.findById(id).session(session);
    if (!show) throw ApiError.notFound('Show not found');

    const now = new Date();
    const seatOptions = session ? { session } : {};

    // ---- start time ----
    if (startsAt !== undefined && !inSameMinute(startsAt, show.startsAt)) {
      const start = new Date(startsAt);
      if (start <= now) throw startsAtProblem('Start time must be in the future');

      // Bookings store the show time and use it for refunds, so a show with live bookings keeps its time.
      if (await hasLiveBookings(show._id, session)) {
        throw ApiError.conflict('This show already has bookings, so its start time cannot be changed. You can change the price or deactivate the show instead.');
      }

      const movie = await Movie.findById(show.movie).session(session);
      if (!movie) throw ApiError.notFound('Movie not found');
      const endsAt = showService.computeEndsAt(start, movie);
      await showService.assertNoOverlap({ screenId: show.screen, startsAt: start, endsAt, excludeShowId: show._id });

      show.startsAt = start;
      show.endsAt = endsAt;
    }

    // ---- prices ----
    // The show's price changes, and so do its seats that are still free.
    // Seats that are sold or held by a customer keep the price that customer saw.
    if (pricing !== undefined) {
      for (const tier of Object.values(SEAT_TIER)) {
        const newPrice = pricing[tier];
        if (newPrice !== undefined && newPrice !== show.pricing[tier]) {
          show.pricing[tier] = newPrice;
          // eslint-disable-next-line no-await-in-loop
          await ShowSeat.updateMany(
            {
              show: show._id,
              tier,
              $or: [
                { status: SEAT_STATUS.AVAILABLE },
                { status: SEAT_STATUS.HELD, holdExpiresAt: { $lt: now } }, // an expired hold counts as free
              ],
            },
            { $set: { price: newPrice } },
            seatOptions
          );
        }
      }
    }

    // ---- active / inactive ----
    if (isActive !== undefined) show.isActive = isActive;

    try {
      await show.save(seatOptions);
    } catch (error) {
      if (error && error.code === 11000) throw ApiError.conflict('This screen already has a show starting at that time');
      throw error;
    }
  });

  return loadForAdmin(id);
};

module.exports = { listShows, createShow, updateShow };
