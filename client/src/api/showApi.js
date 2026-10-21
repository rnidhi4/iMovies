import http, { unwrap } from './http';

export const fetchShow = async (id) => unwrap(await http.get(`/shows/${id}`)).show;

// -> rows: [{ label, tier, aisleAfter, seats: [{ label, number, tier, price, status }] }]
export const fetchShowSeats = async (id) => unwrap(await http.get(`/shows/${id}/seats`)).rows;
