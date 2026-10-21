import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaStar, FaTicketAlt } from 'react-icons/fa';
import { fetchMovies } from '../api/movieApi';
import useFetch from '../hooks/useFetch';
import MovieFilters from '../components/MovieFilters';
import MovieSection from '../components/MovieSection';
import PosterImage from '../components/PosterImage';
import TrailerModal from '../components/TrailerModal';
import Skeleton from '../components/Skeleton';
import { formatDuration } from '../utils/format';

const NO_FILTERS = { search: '', genre: '', language: '' };

export default function Home() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const updateFilters = (changes) => setFilters((previous) => ({ ...previous, ...changes }));

  // The hero always shows the best-rated movie that is now showing (not affected by the filters)
  const featuredState = useFetch(() => fetchMovies({ status: 'NOW_SHOWING', limit: 12 }), []);
  const nowShowing = useFetch(
    () => fetchMovies({ ...filters, status: 'NOW_SHOWING', limit: 12 }),
    [filters.search, filters.genre, filters.language]
  );
  const upcoming = useFetch(
    () => fetchMovies({ ...filters, status: 'UPCOMING', limit: 6 }),
    [filters.search, filters.genre, filters.language]
  );

  const featured = (featuredState.data?.movies || []).reduce(
    (best, movie) => (!best || movie.rating > best.rating ? movie : best),
    null
  );

  return (
    <div className="container py-4">
      {/* Hero */}
      {featuredState.loading && <Skeleton height="380px" className="mb-4" />}
      {featured && (
        <section className="hero mb-4" aria-label="Featured movie">
          <PosterImage src={featured.posterUrl} alt="" className="hero-bg" aria-hidden="true" />
          <div className="hero-content">
            <div className="d-flex flex-column flex-md-row gap-4 align-items-md-center">
              <div className="hero-poster d-none d-md-block">
                <PosterImage src={featured.posterUrl} alt={`${featured.title} poster`} />
              </div>
              <div>
                <span className="chip mb-3"><FaStar className="text-warning" aria-hidden="true" /> Featured · {Number(featured.rating).toFixed(1)}/10</span>
                <h1 className="hero-title">{featured.title}</h1>
                <p className="text-muted-im mb-2">
                  {featured.genres.join(' · ')} · {featured.language} · {formatDuration(featured.durationMins)}
                </p>
                <p className="mb-4" style={{ maxWidth: '40rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {featured.description}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Link to={`/movies/${featured._id}`} className="btn btn-primary btn-lg">
                    <FaTicketAlt className="me-2" aria-hidden="true" />Book Tickets
                  </Link>
                  {featured.trailerUrl && (
                    <button type="button" className="btn btn-outline-light btn-lg" onClick={() => setTrailerOpen(true)}>
                      <FaPlay className="me-2" aria-hidden="true" />Watch Trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {trailerOpen && featured && (
        <TrailerModal url={featured.trailerUrl} title={featured.title} onClose={() => setTrailerOpen(false)} />
      )}

      <MovieFilters filters={filters} onChange={updateFilters} onClear={() => setFilters(NO_FILTERS)} />

      <MovieSection
        title="Currently Showing"
        subtitle="Book your seats for movies playing now"
        state={nowShowing}
        skeletonCount={6}
        emptyTitle="No movies are showing right now"
        emptyMessage="Try a different search or clear the filters."
      >
        <Link to="/movies?status=NOW_SHOWING" className="small">See all</Link>
      </MovieSection>

      <MovieSection
        title="Upcoming Movies"
        subtitle="Coming soon to IMovies"
        state={upcoming}
        skeletonCount={6}
        emptyTitle="No upcoming movies"
        emptyMessage="Check back soon for new releases."
      >
        <Link to="/movies?status=UPCOMING" className="small">See all</Link>
      </MovieSection>
    </div>
  );
}
