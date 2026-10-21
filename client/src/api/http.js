import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// withCredentials lets the browser send/receive the HTTP-only login cookie.
// X-Requested-With is required by the backend for every request that changes data (CSRF guard).
const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// If the server says "401 not logged in" for a normal request, tell the app so it can log the user out.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = ['/auth/login', '/auth/register', '/auth/me'].some((path) => url.includes(path));
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Every successful API response looks like { success: true, data: {...} }
export const unwrap = (response) => response.data.data;

// Removes empty values so we do not send ?search=&genre= to the server
export const omitEmpty = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );

// A friendly message for any failed request
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error?.request && !error.response) {
    return 'Cannot reach the server. Check that the backend is running on http://localhost:5000.';
  }
  return fallback;
};

// Turns the backend's [{ field, message }] list into { field: message } for forms
export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((accumulator, item) => {
    if (item.field && !accumulator[item.field]) accumulator[item.field] = item.message;
    return accumulator;
  }, {});
};

export default http;
