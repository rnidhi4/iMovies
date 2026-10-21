import http, { unwrap } from './http';

const newIdempotencyKey = () =>
  window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const holdSeats = async ({ showId, seats }) =>
  unwrap(await http.post('/bookings/hold', { showId, seats })).booking;

// scope: 'upcoming' | 'past' -> { bookings, pagination }
export const fetchBookings = async ({ scope, page = 1, limit = 10 }) =>
  unwrap(await http.get('/bookings', { params: { scope, page, limit } }));

// -> { booking, payment, eligibility }
export const fetchBooking = async (id) => unwrap(await http.get(`/bookings/${id}`));

// -> { booking, message }
export const cancelBooking = async (id, reason) => {
  const response = await http.post(`/bookings/${id}/cancel`, reason ? { reason } : {});
  return { ...unwrap(response), message: response.data.message };
};

// Demo payment. outcome: 'success' | 'failure'. A fresh Idempotency-Key is sent with every attempt.
// -> { booking, payment, message }
export const payDemo = async (bookingId, outcome) => {
  const response = await http.post(
    `/payments/demo/${bookingId}`,
    { outcome },
    { headers: { 'Idempotency-Key': newIdempotencyKey() } }
  );
  return { ...unwrap(response), message: response.data.message };
};
