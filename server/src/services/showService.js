const Movie = require('../models/Movie');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const ShowSeat = require('../models/ShowSeat');
const ApiError = require('../utils/ApiError');
const { SEAT_STATUS } = require('../config/constants');
const { withTransaction, transactionsSupported } = require('../config/db');
const { todayInIST, istDayRange } = require('../utils/time');

// Cleaning time added after the movie ends, before the next show can start on the same screen
const TURNAROUND_MINUTES = 20;

const computeEndsAt = (startsAt, movie) =>
  new Date(startsAt.getTime() + (movie.durationMins + TURNAROUND_MINUTES) * 60 * 1000);

// One seat document for every seat in the screen's layout.
// `show` needs _id and pricing; `screen` needs layout.rows.
const buildSeatDocs = (show, screen) => {
  const seats = [];
  screen.layout.rows.forEach((row) => {
    for (let number = 1; number <= row.seatCount; number += 1) {
      seats.push({
        show: show._id,
        label: `${row.label}${number}`,
        row: row.label,
        number,
        tier: row.tier,
        price: show.pricing[row.tier],
        status: SEAT_STATUS.AVAILABLE,
      });
    }
  });
  return seats;
};

// Rejects a show that would run at the same time as another show on the same screen.
const assertNoOverlap = async ({ screenId, startsAt, endsAt, excludeShowId }) => {
  const filter = { screen: screenId, startsAt: { $lt: endsAt }, endsAt: { $gt: startsAt } };
  if (excludeShowId) filter._id = { $ne: excludeShowId };

  const clash = await Show.findOne(filter).select('_id startsAt');
  if (clash) throw ApiError.conflict('This screen already has another show at that time');
};

// Creates a show AND all of its seats together (used by the admin API in Phase 2E).
// With a replica set (Atlas) this is one transaction; otherwise leftovers are cleaned up on failure.
const createShow = async ({ movieId, screenId, startsAt, pricing }) => {
  const [movie, screen] = await Promise.all([Movie.findById(movieId), Screen.findById(screenId)]);
  if (!movie) throw ApiError.notFound('Movie not found');
  if (!screen) throw ApiError.notFound('Screen not found');

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) throw ApiError.badRequest('startsAt is not a valid date');
  const endsAt = computeEndsAt(start, movie);

  await assertNoOverlap({ screenId: screen._id, startsAt: start, endsAt });

  let created = null;
  try {
    return await withTransaction(async (session) => {
      const [show] = await Show.create(
        [{ movie: movie._id, theatre: screen.theatre, screen: screen._id, startsAt: start, endsAt, pricing }],
        { session }
      );
      created = show;
      await ShowSeat.insertMany(buildSeatDocs(show, screen), { session });
      return show;
    });
  } catch (error) {
    if (created && !transactionsSupported()) {
      await ShowSeat.deleteMany({ show: created._id });
      await Show.deleteOne({ _id: created._id });
    }
    throw error;
  }
};

// GET /shows/:id
const getShowDetails = async (showId) => {
  const show = await Show.findOne({ _id: showId, isActive: true })
    .populate('movie', 'title posterUrl language durationMins genres rating')
    .populate('theatre', 'name city address')
    .populate('screen', 'name')
    .lean();
  if (!show) throw ApiError.notFound('Show not found');

  const { _id, startsAt, endsAt, pricing, isActive, movie, theatre, screen } = show;
  return { _id, startsAt, endsAt, pricing, isActive, movie, theatre, screen };
};

// GET /shows/:id/seats  ->  rows with live seat status.
// A HELD seat whose hold has expired is reported as AVAILABLE (expired holds are free again).
const getSeatRows = async (showId) => {
  const show = await Show.findOne({ _id: showId, isActive: true }).select('screen').lean();
  if (!show) throw ApiError.notFound('Show not found');

  const [screen, seats] = await Promise.all([
    Screen.findById(show.screen).select('layout').lean(),
    ShowSeat.find({ show: showId }).sort({ number: 1 }).lean(),
  ]);

  const now = new Date();
  const seatsByRow = new Map();
  seats.forEach((seat) => {
    const expiredHold = seat.status === SEAT_STATUS.HELD && seat.holdExpiresAt && seat.holdExpiresAt < now;
    const entry = {
      label: seat.label,
      number: seat.number,
      tier: seat.tier,
      price: seat.price,
      status: expiredHold ? SEAT_STATUS.AVAILABLE : seat.status,
    };
    if (!seatsByRow.has(seat.row)) seatsByRow.set(seat.row, []);
    seatsByRow.get(seat.row).push(entry);
  });

  return screen.layout.rows.map((row) => ({
    label: row.label,
    tier: row.tier,
    aisleAfter: row.aisleAfter,
    seats: seatsByRow.get(row.label) || [],
  }));
};

// GET /movies/:id/shows?date=  ->  the movie's shows on one IST day, grouped by theatre
const getShowsForMovieOnDate = async (movieId, date) => {
  const movieExists = await Movie.exists({ _id: movieId });
  if (!movieExists) throw ApiError.notFound('Movie not found');

  const day = date || todayInIST();
  const { start, end } = istDayRange(day);

  const shows = await Show.find({ movie: movieId, isActive: true, startsAt: { $gte: start, $lt: end } })
    .sort({ startsAt: 1 })
    .populate('theatre', 'name city address')
    .populate('screen', 'name')
    .lean();

  // How many seats does each show have, and how many are free right now?
  const now = new Date();
  const counts = shows.length
    ? await ShowSeat.aggregate([
        { $match: { show: { $in: shows.map((show) => show._id) } } },
        {
          $group: {
            _id: '$show',
            totalSeats: { $sum: 1 },
            availableSeats: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', SEAT_STATUS.AVAILABLE] },
                      { $and: [{ $eq: ['$status', SEAT_STATUS.HELD] }, { $lt: ['$holdExpiresAt', now] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
    : [];
  const countsByShow = new Map(counts.map((row) => [String(row._id), row]));

  const groups = new Map();
  shows.forEach((show) => {
    const key = String(show.theatre._id);
    if (!groups.has(key)) groups.set(key, { theatre: show.theatre, shows: [] });
    const count = countsByShow.get(String(show._id)) || { totalSeats: 0, availableSeats: 0 };
    groups.get(key).shows.push({
      _id: show._id,
      startsAt: show.startsAt,
      endsAt: show.endsAt,
      screen: show.screen,
      pricing: show.pricing,
      availableSeats: count.availableSeats,
      totalSeats: count.totalSeats,
    });
  });

  const theatres = [...groups.values()].sort((a, b) => a.theatre.name.localeCompare(b.theatre.name));
  return { date: day, theatres };
};

module.exports = {
  TURNAROUND_MINUTES,
  computeEndsAt,
  buildSeatDocs,
  assertNoOverlap,
  createShow,
  getShowDetails,
  getSeatRows,
  getShowsForMovieOnDate,
};
