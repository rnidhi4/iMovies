const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');
const { parsePagination } = require('../utils/pagination');
const { booking: bookingConfig } = require('../config/env');

// POST /api/v1/bookings/hold
const holdSeats = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const seats = Array.isArray(data.seats) ? data.seats : req.body.seats; // already validated and upper-cased
  const booking = await bookingService.holdSeats({ user: req.user, showId: data.showId, labels: seats });

  res.status(201).json({
    success: true,
    message: `Your seats are held for ${bookingConfig.holdMinutes} minutes. Complete the payment to confirm your booking.`,
    data: { booking },
  });
});

// GET /api/v1/bookings?scope=upcoming|past&page=1&limit=6   (the logged-in user's own bookings)
const listBookings = asyncHandler(async (req, res) => {
  const { scope } = matchedData(req, { locations: ['query'] });
  const { page, limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

  const data = await bookingService.listBookingsForUser({
    user: req.user,
    scope: scope === 'past' ? 'past' : 'upcoming', // upcoming is the default
    page,
    limit,
  });
  res.json({ success: true, data });
});

// GET /api/v1/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingForUser({ bookingId: req.params.id, user: req.user });
  res.json({ success: true, data });
});

// POST /api/v1/bookings/:id/cancel   { reason?: string }
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = matchedData(req, { locations: ['body'] });
  const result = await bookingService.cancelBooking({
    user: req.user,
    bookingId: req.params.id,
    reason: reason || undefined,
  });
  res.json({ success: true, message: result.message, data: { booking: result.booking } });
});

module.exports = { holdSeats, listBookings, getBooking, cancelBooking };
