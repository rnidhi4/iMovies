import React from "react";
import { MOVIE_GRID_CLASSES } from '../utils/constants';

// A grey shimmering block shown while content loads
export default function Skeleton({ height = '1rem', width = '100%', className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, width }} aria-hidden="true" />;
}

export function MovieGridSkeleton({ count = 6 }) {
  return (
    <div className={MOVIE_GRID_CLASSES} role="status" aria-label="Loading movies">
      {Array.from({ length: count }, (_, index) => (
        <div className="col" key={index}>
          <div className="movie-card" aria-hidden="true">
            <div className="poster-wrap skeleton" style={{ borderRadius: 0 }} />
            <div className="p-3">
              <Skeleton height="1rem" width="80%" className="mb-2" />
              <Skeleton height="0.75rem" width="60%" className="mb-2" />
              <Skeleton height="0.75rem" width="45%" className="mb-3" />
              <Skeleton height="2rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
