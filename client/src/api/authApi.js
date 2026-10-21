import http, { unwrap } from './http';

export const register = async (payload) => unwrap(await http.post('/auth/register', payload)).user;

export const login = async (payload) => unwrap(await http.post('/auth/login', payload)).user;

export const logout = async () => {
  await http.post('/auth/logout');
};

export const fetchCurrentUser = async () => unwrap(await http.get('/auth/me')).user;
