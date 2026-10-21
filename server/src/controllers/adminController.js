const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination } = require('../utils/pagination');
const adminService = require('../services/adminService');

// GET /api/v1/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  res.json({ success: true, data: { stats } });
});

// GET /api/v1/admin/users?search=&page=&limit=
const listUsers = asyncHandler(async (req, res) => {
  const { search } = matchedData(req, { locations: ['query'] });
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15, maxLimit: 50 });
  const data = await adminService.listUsers({ search, page, limit, skip });
  res.json({ success: true, data });
});

module.exports = { getStats, listUsers };
