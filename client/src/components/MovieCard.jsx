import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import PosterImage from './PosterImage';
import { formatDuration } from '../utils/format';

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card" aria-label={`${movie.title}: view details`}>
      <div className="poster-wrap">
        <PosterImage src={movie.posterUrl} alt={`${movie.title} poster`} />
        <span className="rating-badge">
          <FaStar aria-hidden="true" /> {Number(movie.rating || 0).toFixed(1)}
        </span>
        {movie.status === 'UPCOMING' && <span className="badge text-bg-info upcoming-badge">Upcoming</span>}
      </div>
      <div className="p-3">
        <h3 className="movie-card-title">{movie.title}</h3>
        <p className="movie-card-meta mb-1">{(movie.genres || []).slice(0, 2).join(' · ')}</p>
        <p className="movie-card-meta mb-2">
          {movie.language} · {formatDuration(movie.durationMins)}
        </p>
        <span className="btn btn-sm btn-primary w-100">View Details</span>
      </div>
    </Link>
  );
}
