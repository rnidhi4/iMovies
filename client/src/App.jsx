import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminShows from './pages/admin/AdminShows';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Pages that need a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/shows/:showId/seats" element={<SeatSelection />} />
            <Route path="/checkout/:bookingId" element={<Checkout />} />
            <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/bookings/:bookingId" element={<BookingDetails />} />
          </Route>

          {/* Admin pages (the backend checks the admin role again on every request) */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="movies" element={<AdminMovies />} />
              <Route path="theatres" element={<AdminTheatres />} />
              <Route path="shows" element={<AdminShows />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <ToastContainer position="top-right" theme="dark" autoClose={4000} newestOnTop pauseOnFocusLoss={false} />
    </>
  );
}
