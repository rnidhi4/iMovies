const { matchedData } = require('express-validator');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/escapeRegex');

// GET /api/v1/theatres?city=
const listTheatres = asyncHandler(async (req, res) => {
  const { city } = matchedData(req, { locations: ['query'] });

  const filter = {};
  if (city) filter.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };

  const theatres = await Theatre.find(filter).sort({ city: 1, name: 1 });
  res.json({ success: true, data: { theatres } });
});

module.exports = { listTheatres };
