const { matchedData } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/adminCatalogService');

// matchedData returns ONLY the fields that passed validation, so extra fields in a request are ignored.
const bodyData = (req) => matchedData(req, { locations: ['body'] });

// ----- Movies -----
const createMovie = asyncHandler(async (req, res) => {
  const movie = await service.createMovie(bodyData(req));
  res.status(201).json({ success: true, message: 'Movie added', data: { movie } });
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await service.updateMovie(req.params.id, bodyData(req));
  res.json({ success: true, message: 'Movie updated', data: { movie } });
});

const deleteMovie = asyncHandler(async (req, res) => {
  await service.deleteMovie(req.params.id);
  res.json({ success: true, message: 'Movie deleted' });
});

// ----- Theatres -----
const listTheatres = asyncHandler(async (req, res) => {
  const theatres = await service.listTheatresWithScreens();
  res.json({ success: true, data: { theatres } });
});

const createTheatre = asyncHandler(async (req, res) => {
  const theatre = await service.createTheatre(bodyData(req));
  res.status(201).json({ success: true, message: 'Theatre added', data: { theatre } });
});

const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await service.updateTheatre(req.params.id, bodyData(req));
  res.json({ success: true, message: 'Theatre updated', data: { theatre } });
});

const deleteTheatre = asyncHandler(async (req, res) => {
  await service.deleteTheatre(req.params.id);
  res.json({ success: true, message: 'Theatre deleted' });
});

// ----- Screens -----
const createScreen = asyncHandler(async (req, res) => {
  const screen = await service.createScreen(bodyData(req));
  res.status(201).json({ success: true, message: 'Screen added', data: { screen } });
});

const deleteScreen = asyncHandler(async (req, res) => {
  await service.deleteScreen(req.params.id);
  res.json({ success: true, message: 'Screen deleted' });
});

module.exports = {
  createMovie,
  updateMovie,
  deleteMovie,
  listTheatres,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  createScreen,
  deleteScreen,
};
