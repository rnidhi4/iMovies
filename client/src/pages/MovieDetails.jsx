import React from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaClock, FaGlobe, FaPlay, FaStar } from 'react-icons/fa';
import { fetchMovie, fetchMovieShows } from '../api/movieApi';
import { getErrorMessage } from '../api/http';
import useFetch from '../hooks/useFetch';
import PosterImage from '../components/PosterImage';
import TrailerModal from '../components/TrailerModal';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, formatDuration, formatTime, getNextDays } from '../utils/format';

function Showtimes({ movieId }) {
  const days = useMemo(() => getNextDays(7), []);
  const [date, setDate] = useState(days[0].value);
  const showsState = useFetch(() => fetchMovieShows(movieId, date), [movieId, date]);
  const theatres = showsState.data?.theatres || [];

  let content;
  if (showsState.loading) {
    content = <Loader label="Loading showtimes..." />;
  } else if (showsState.error) {
    content = <ErrorState title="Could not load showtimes" message={getErrorMessage(showsState.error)} onRetry={showsState.refetch} />;
  } else if (theatres.length === 0) {
    content = <EmptyState title="No shows on this date" message="Pick another date to see available showtimes." />;
  } else {
    content = theatres.map(({ theatre, shows }) => (
      <div className="im-card p-3 p-md-4 mb-3" key={theatre._id}>
        <h3 className="h6 mb-0">{theatre.name}</h3>
        <p className="small text-muted-im mb-3">{theatre.address}, {theatre.city}</p>
        <div className="d-flex flex-wrap gap-2">
          {shows.map((show) => {
            const isPast = new Date(show.startsAt) < new Date();
            const soldOut = show.availableSeats === 0;
            const low = show.availableSeats <= Math.max(5, show.totalSeats * 0.2);
            const label = `${formatTime(show.startsAt)}, ${show.screen.name}, from ${formatCurrency(show.pricing.STANDARD)}`;
            const body = (
              <>
                <strong>{formatTime(show.startsAt)}</strong>
                <div className="small">{show.screen.name} · {formatCurrency(show.pricing.STANDARD)}</div>
                <div className="small">{soldOut ? 'Sold out' : isPast ? 'Started' : `${show.availableSeats} left`}</div>
              </>
            );
            return isPast || soldOut ? (
              <button key={show._id} type="button" className="show-btn" disabled aria-label={`${label}, unavailable`}>{body}</button>
            ) : (
              <Link key={show._id} to={`/shows/${show._id}/seats`} className={`show-btn ${low ? 'low' : ''}`} aria-label={label}>{body}</Link>
            );
          })}
        </div>
      </div>
    ));
  }

  return (
    <section className="section-gap" aria-labelledby="showtimes-heading">
      <h2 id="showtimes-heading" className="h4 mb-3">Showtimes</h2>
      <div className="d-flex gap-2 overflow-auto pb-2 mb-3" role="group" aria-label="Choose a date">
        {days.map((day) => (
          <button key={day.value} type="button" className="date-chip" aria-pressed={date === day.value} onClick={() => setDate(day.value)}>
            <div className="small">{day.weekday}</div>
            <strong className="fs-5">{day.day}</strong>
            <div className="small">{day.month}</div>
          </button>
        ))}
      </div>
      {content}
    </section>
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const movieState = useFetch(() => fetchMovie(id), [id]);
  const movie = movieState.data;

  if (movieState.loading) {
    return (
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-4 col-lg-3"><Skeleton height="420px" /></div>
          <div className="col-md-8 col-lg-9">
            <Skeleton height="2.5rem" width="60%" className="mb-3" />
            <Skeleton height="1rem" width="40%" className="mb-4" />
            <Skeleton height="6rem" />
          </div>
        </div>
      </div>
    );
  }

  if (movieState.error) {
    const notFound = [400, 404].includes(movieState.error.response?.status);
    return (
      <div className="container py-4">
        <ErrorState
          title={notFound ? 'Movie not found' : 'Could not load this movie'}
          message={getErrorMessage(movieState.error)}
          onRetry={notFound ? undefined : movieState.refetch}
        >
          <Link to="/movies" className="btn btn-outline-secondary">Browse all movies</Link>
        </ErrorState>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-8 col-sm-6 col-md-4 col-lg-3 mx-auto mx-md-0">
          <div className="poster-wrap rounded-3 border border-secondary-subtle">
            <PosterImage src={movie.posterUrl} alt={`${movie.title} poster`} />
          </div>
        </div>

        <div className="col-md-8 col-lg-9">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <StatusBadge status={movie.status} />
            {movie.status === 'UPCOMING' && <span className="small text-muted-im">Releases {formatDate(movie.releaseDate)}</span>}
          </div>
          <h1 className="hero-title mb-2">{movie.title}</h1>
          <p className="d-flex flex-wrap gap-3 text-muted-im mb-3">
            <span><FaStar className="text-warning me-1" aria-hidden="true" />{Number(movie.rating).toFixed(1)}/10</span>
            <span><FaClock className="me-1" aria-hidden="true" />{formatDuration(movie.durationMins)}</span>
            <span><FaGlobe className="me-1" aria-hidden="true" />{movie.language}</span>
          </p>
          <p className="mb-3">
            {movie.genres.map((genre) => <span className="chip me-2" key={genre}>{genre}</span>)}
          </p>
          <p style={{ maxWidth: '48rem' }}>{movie.description}</p>
          {movie.cast.length > 0 && (
            <p className="mb-3"><strong>Cast:</strong> <span className="text-muted-im">{movie.cast.join(', ')}</span></p>
          )}
          {movie.trailerUrl && (
            <button type="button" className="btn btn-outline-light" onClick={() => setTrailerOpen(true)}>
              <FaPlay className="me-2" aria-hidden="true" />Watch Trailer
            </button>
          )}
        </div>
      </div>

      {trailerOpen && <TrailerModal url={movie.trailerUrl} title={movie.title} onClose={() => setTrailerOpen(false)} />}

      <Showtimes movieId={movie._id} />
    </div>
  );
}
