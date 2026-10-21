const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination } = require('../utils/pagination');
const service = require('../services/adminBookingService');

// GET /api/v1/admin/bookings?search=&status=&page=&limit=
const listBookings = asyncHandler(async (req, res) => {
  const { search, status } = matchedData(req, { locations: ['query'] });
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const data = await service.listBookings({ search, status, page, limit, skip });
  res.json({ success: true, data });
});

// POST /api/v1/admin/bookings/:id/cancel   { reason }
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = matchedData(req, { locations: ['body'] });
  const result = await service.adminCancelBooking({ bookingId: req.params.id, reason });
  res.json({ success: true, message: result.message, data: { booking: result.booking } });
});

module.exports = { listBookings, cancelBooking };
