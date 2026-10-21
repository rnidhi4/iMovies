const { matchedData } = require('express-validator');
const Movie = require('../models/Movie');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/escapeRegex');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const showService = require('../services/showService');

// GET /api/v1/movies?search=&genre=&language=&status=&page=&limit=
const listMovies = asyncHandler(async (req, res) => {
  const { search, genre, language, status } = matchedData(req, { locations: ['query'] });
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });

  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' }; // partial, case-insensitive
  if (genre) filter.genres = genre;
  if (language) filter.language = language;
  if (status) filter.status = status;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1, _id: 1 }).skip(skip).limit(limit),
    Movie.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { movies, pagination: buildPaginationMeta(total, page, limit) },
  });
});

// GET /api/v1/movies/:id
const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound('Movie not found');
  res.json({ success: true, data: { movie } });
});

// GET /api/v1/movies/:id/shows?date=YYYY-MM-DD
const getMovieShows = asyncHandler(async (req, res) => {
  const { date } = matchedData(req, { locations: ['query'] });
  const result = await showService.getShowsForMovieOnDate(req.params.id, date);
  res.json({ success: true, data: result });
});

module.exports = { listMovies, getMovie, getMovieShows };
