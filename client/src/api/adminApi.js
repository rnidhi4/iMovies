import http, { unwrap, omitEmpty } from './http';

export const fetchStats = async () => unwrap(await http.get('/admin/stats')).stats;

// Movies (the list itself comes from the public GET /movies endpoint)
export const createMovie = async (payload) => unwrap(await http.post('/admin/movies', payload)).movie;
export const updateMovie = async (id, payload) => unwrap(await http.put(`/admin/movies/${id}`, payload)).movie;
export const deleteMovie = async (id) => {
  await http.delete(`/admin/movies/${id}`);
};

// Theatres and screens. fetchAdminTheatres -> theatres, each with a `screens` array
export const fetchAdminTheatres = async () => unwrap(await http.get('/admin/theatres')).theatres;
export const createTheatre = async (payload) => unwrap(await http.post('/admin/theatres', payload)).theatre;
export const updateTheatre = async (id, payload) => unwrap(await http.put(`/admin/theatres/${id}`, payload)).theatre;
export const deleteTheatre = async (id) => {
  await http.delete(`/admin/theatres/${id}`);
};
export const createScreen = async (payload) => unwrap(await http.post('/admin/screens', payload)).screen;
export const deleteScreen = async (id) => {
  await http.delete(`/admin/screens/${id}`);
};

// Shows
export const fetchAdminShows = async (params = {}) =>
  unwrap(await http.get('/admin/shows', { params: omitEmpty(params) }));
export const createShow = async (payload) => unwrap(await http.post('/admin/shows', payload)).show;
export const updateShow = async (id, payload) => unwrap(await http.put(`/admin/shows/${id}`, payload)).show;

// Bookings and users
export const fetchAdminBookings = async (params = {}) =>
  unwrap(await http.get('/admin/bookings', { params: omitEmpty(params) }));
export const adminCancelBooking = async (id, reason) => {
  const response = await http.post(`/admin/bookings/${id}/cancel`, { reason });
  return { ...unwrap(response), message: response.data.message };
};
export const fetchAdminUsers = async (params = {}) =>
  unwrap(await http.get('/admin/users', { params: omitEmpty(params) }));
