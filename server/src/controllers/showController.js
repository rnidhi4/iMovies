const asyncHandler = require('../utils/asyncHandler');
const showService = require('../services/showService');

// GET /api/v1/shows/:id
const getShow = asyncHandler(async (req, res) => {
  const show = await showService.getShowDetails(req.params.id);
  res.json({ success: true, data: { show } });
});

// GET /api/v1/shows/:id/seats
const getShowSeats = asyncHandler(async (req, res) => {
  const rows = await showService.getSeatRows(req.params.id);
  res.json({ success: true, data: { rows } });
});

// GET /api/v1/movies/:id/shows?date=YYYY-MM-DD
const getShowsForMovie = asyncHandler(async (req, res) => {
  const result = await showService.getShowsForMovieOnDate(
    req.params.id,
    req.query.date
  );

  res.json({ success: true, data: result });
});

module.exports = { getShow, getShowSeats, getShowsForMovie };