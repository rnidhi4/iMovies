import React from "react";
import { FaFilm } from 'react-icons/fa';
import MovieCard from './MovieCard';
import { MovieGridSkeleton } from './Skeleton';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import { getErrorMessage } from '../api/http';
import { MOVIE_GRID_CLASSES } from '../utils/constants';

// A titled grid of movies that handles loading, error and empty states.
// `state` is the object returned by useFetch(() => fetchMovies(...)).
export default function MovieSection({
  title,
  subtitle,
  state,
  emptyTitle = 'No movies found',
  emptyMessage = 'Try changing your search or filters.',
  skeletonCount = 6,
  children,
}) {
  const { data, error, loading, refetch } = state;
  const movies = data?.movies || [];
  const headingId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  let content;
  if (loading) {
    content = <MovieGridSkeleton count={skeletonCount} />;
  } else if (error) {
    content = <ErrorState title="Could not load movies" message={getErrorMessage(error)} onRetry={refetch} />;
  } else if (movies.length === 0) {
    content = <EmptyState icon={FaFilm} title={emptyTitle} message={emptyMessage} />;
  } else {
    content = (
      <div className={MOVIE_GRID_CLASSES}>
        {movies.map((movie) => (
          <div className="col" key={movie._id}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="section-gap" aria-labelledby={headingId}>
      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <h2 id={headingId} className="h4 mb-0">{title}</h2>
          {subtitle && <p className="text-muted-im small mb-0">{subtitle}</p>}
        </div>
        {children}
      </div>
      {content}
    </section>
  );
}
