import React from 'react';
import { Link } from 'react-router-dom';
import { FaFilm } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="im-footer">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <p className="brand-logo mb-2">
              <FaFilm className="brand-icon" aria-hidden="true" />
              <span className="text-white">I</span><span>Movies</span>
            </p>
            <p className="text-muted-im small mb-0">
              Browse movies, choose your seats and book tickets online. A full-stack MERN portfolio project.
            </p>
          </div>

          <div className="col-6 col-lg-2">
            <h2 className="h6">Explore</h2>
            <ul className="list-unstyled small mb-0">
              <li className="mb-1"><Link to="/">Home</Link></li>
              <li className="mb-1"><Link to="/movies">All Movies</Link></li>
              <li className="mb-1"><Link to="/movies?status=UPCOMING">Upcoming</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-3">
            <h2 className="h6">Genres</h2>
            <ul className="list-unstyled small mb-0">
              <li className="mb-1"><Link to="/movies?genre=Action">Action</Link></li>
              <li className="mb-1"><Link to="/movies?genre=Comedy">Comedy</Link></li>
              <li className="mb-1"><Link to="/movies?genre=Drama">Drama</Link></li>
              <li className="mb-1"><Link to="/movies?genre=Thriller">Thriller</Link></li>
            </ul>
          </div>

          <div className="col-lg-3">
            <h2 className="h6">Your account</h2>
            <ul className="list-unstyled small mb-0">
              <li className="mb-1"><Link to="/my-bookings">My Bookings</Link></li>
              <li className="mb-1"><Link to="/login">Login</Link></li>
              <li className="mb-1"><Link to="/register">Register</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-secondary mt-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between small text-muted-im gap-2">
          <span>&copy; {new Date().getFullYear()} IMovies. Built for learning and portfolio use.</span>
          <span>Payments are simulated (demo only). No real transactions take place.</span>
        </div>
      </div>
    </footer>
  );
}
