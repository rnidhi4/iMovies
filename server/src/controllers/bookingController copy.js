const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');
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

// GET /api/v1/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingForUser({ bookingId: req.params.id, user: req.user });
  res.json({ success: true, data });
});

module.exports = { holdSeats, getBooking };
