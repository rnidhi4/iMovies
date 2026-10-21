const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const ApiError = require('../utils/ApiError');
const { MOVIE_STATUS } = require('../config/constants');
const { escapeRegex } = require('../utils/escapeRegex');
const { normalizeLayoutRows } = require('../utils/screenLayout');

const exactNoCase = (text) => new RegExp(`^${escapeRegex(text)}$`, 'i');

// If MongoDB's unique index rejects a save (two admins at the same moment), show a friendly message.
const rethrowDuplicate = (error, message) => {
  if (error && error.code === 11000) throw ApiError.conflict(message);
  throw error;
};

const uniqueTrimmed = (items = []) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];
const dayOf = (date) => new Date(date).toISOString().slice(0, 10);

// ---------------- Movies ----------------

// Only these fields can ever be saved (nothing extra can sneak in from the request).
const movieFields = (data) => ({
  title: data.title,
  description: data.description,
  genres: uniqueTrimmed(data.genres),
  language: data.language,
  durationMins: data.durationMins,
  releaseDate: new Date(data.releaseDate),
  posterUrl: data.posterUrl || '',
  trailerUrl: data.trailerUrl || '',
  rating: data.rating === undefined ? 0 : data.rating,
  cast: uniqueTrimmed(data.cast),
  status: data.status || MOVIE_STATUS.NOW_SHOWING,
});

const createMovie = async (data) => Movie.create(movieFields(data));

const updateMovie = async (id, data) => {
  const movie = await Movie.findById(id);
  if (!movie) throw ApiError.notFound('Movie not found');

  const fields = movieFields(data);
  // The form only has a date (no time). If the day did not change, keep the original timestamp.
  if (movie.releaseDate && dayOf(movie.releaseDate) === data.releaseDate) fields.releaseDate = movie.releaseDate;

  movie.set(fields);
  await movie.save(); // save() runs the model's own validation too
  return movie;
};

// A movie that still has shows cannot be deleted. (Every booking belongs to a show,
// so this also protects all bookings of that movie.)
const deleteMovie = async (id) => {
  const movie = await Movie.findById(id);
  if (!movie) throw ApiError.notFound('Movie not found');

  if (await Show.exists({ movie: movie._id })) {
    throw ApiError.conflict('This movie still has shows (and possibly bookings), so it cannot be deleted. You can change its status to UPCOMING instead.');
  }
  await Movie.deleteOne({ _id: movie._id });
};

// ---------------- Theatres ----------------

// Every theatre with its screens inside (what the admin Theatres page shows)
const listTheatresWithScreens = async () => {
  const theatres = await Theatre.find({}).sort({ city: 1, name: 1 });
  const screens = await Screen.find({ theatre: { $in: theatres.map((theatre) => theatre._id) } }).sort({ name: 1 });

  return theatres.map((theatre) => ({
    ...theatre.toJSON(),
    screens: screens.filter((screen) => String(screen.theatre) === String(theatre._id)).map((screen) => screen.toJSON()),
  }));
};

const assertTheatreNameFree = async ({ name, city, excludeId }) => {
  const filter = { name: exactNoCase(name), city: exactNoCase(city) };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Theatre.exists(filter)) throw ApiError.conflict('A theatre with this name already exists in this city');
};

const createTheatre = async ({ name, city, address }) => {
  await assertTheatreNameFree({ name, city });
  try {
    return await Theatre.create({ name, city, address });
  } catch (error) {
    return rethrowDuplicate(error, 'A theatre with this name already exists in this city');
  }
};

const updateTheatre = async (id, { name, city, address }) => {
  const theatre = await Theatre.findById(id);
  if (!theatre) throw ApiError.notFound('Theatre not found');

  await assertTheatreNameFree({ name, city, excludeId: theatre._id });
  theatre.set({ name, city, address });
  try {
    await theatre.save();
  } catch (error) {
    rethrowDuplicate(error, 'A theatre with this name already exists in this city');
  }
  return theatre;
};

const deleteTheatre = async (id) => {
  const theatre = await Theatre.findById(id);
  if (!theatre) throw ApiError.notFound('Theatre not found');

  if (await Show.exists({ theatre: theatre._id })) {
    throw ApiError.conflict('This theatre still has shows, so it cannot be deleted.');
  }
  if (await Screen.exists({ theatre: theatre._id })) {
    throw ApiError.conflict('This theatre still has screens. Delete its screens first.');
  }
  await Theatre.deleteOne({ _id: theatre._id });
};

// ---------------- Screens ----------------

const createScreen = async ({ theatre: theatreId, name, layout }) => {
  const theatre = await Theatre.findById(theatreId);
  if (!theatre) throw ApiError.notFound('Theatre not found');

  if (await Screen.exists({ theatre: theatre._id, name: exactNoCase(name) })) {
    throw ApiError.conflict('This theatre already has a screen with that name');
  }
  try {
    return await Screen.create({ theatre: theatre._id, name, layout: { rows: normalizeLayoutRows(layout.rows) } });
  } catch (error) {
    return rethrowDuplicate(error, 'This theatre already has a screen with that name');
  }
};

const deleteScreen = async (id) => {
  const screen = await Screen.findById(id);
  if (!screen) throw ApiError.notFound('Screen not found');

  if (await Show.exists({ screen: screen._id })) {
    throw ApiError.conflict('This screen still has shows, so it cannot be deleted.');
  }
  await Screen.deleteOne({ _id: screen._id });
};

module.exports = {
  createMovie,
  updateMovie,
  deleteMovie,
  listTheatresWithScreens,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  createScreen,
  deleteScreen,
};
