const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination } = require('../utils/pagination');
const service = require('../services/adminShowService');

// GET /api/v1/admin/shows?page=&limit=
const listShows = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const data = await service.listShows({ page, limit, skip });
  res.json({ success: true, data });
});

// POST /api/v1/admin/shows
const createShow = asyncHandler(async (req, res) => {
  const show = await service.createShow(matchedData(req, { locations: ['body'] }));
  res.status(201).json({ success: true, message: 'Show created', data: { show } });
});

// PUT /api/v1/admin/shows/:id
const updateShow = asyncHandler(async (req, res) => {
  const show = await service.updateShow(req.params.id, matchedData(req, { locations: ['body'] }));
  res.json({ success: true, message: 'Show updated', data: { show } });
});

module.exports = { listShows, createShow, updateShow };
