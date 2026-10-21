import http, { unwrap, omitEmpty } from './http';

// -> { movies: [...], pagination: { total, page, limit, totalPages } }
export const fetchMovies = async (params = {}) =>
  unwrap(await http.get('/movies', { params: omitEmpty(params) }));

export const fetchMovie = async (id) => unwrap(await http.get(`/movies/${id}`)).movie;

// -> { date, theatres: [{ theatre, shows: [{ _id, startsAt, screen, pricing, availableSeats, totalSeats }] }] }
export const fetchMovieShows = async (id, date) =>
  unwrap(await http.get(`/movies/${id}/shows`, { params: { date } }));
