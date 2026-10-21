import React from "react";
import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { GENRES, LANGUAGES } from '../utils/constants';

// filters = { search, genre, language }
// onChange(partialChanges) merges changes into the filters; onClear() resets them all.
export default function MovieFilters({ filters, onChange, onClear }) {
  const [text, setText] = useState(filters.search || '');

  // Keep the box in sync when the filters change from outside (e.g. "Clear")
  useEffect(() => {
    setText(filters.search || '');
  }, [filters.search]);

  // Wait until the user stops typing for 400ms before searching
  useEffect(() => {
    if (text === (filters.search || '')) return undefined;
    const timer = setTimeout(() => onChange({ search: text.trim() }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const hasFilters = Boolean(filters.search || filters.genre || filters.language);

  const handleClear = () => {
    setText('');
    onClear();
  };

  return (
    <section aria-label="Search and filter movies" className="mb-4">
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-7">
          <label htmlFor="movie-search" className="visually-hidden">Search movies by title</label>
          <div className="input-group">
            <span className="input-group-text"><FaSearch aria-hidden="true" /></span>
            <input
              id="movie-search"
              type="search"
              className="form-control"
              placeholder="Search movies by title"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        </div>
        <div className="col-8 col-md-3">
          <label htmlFor="movie-language" className="visually-hidden">Language</label>
          <select
            id="movie-language"
            className="form-select"
            value={filters.language || ''}
            onChange={(event) => onChange({ language: event.target.value })}
          >
            <option value="">All languages</option>
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>
        <div className="col-4 col-md-2">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={handleClear} disabled={!hasFilters}>
            Clear
          </button>
        </div>
      </div>

      <div className="genre-pills" role="group" aria-label="Filter by genre">
        <button type="button" className="genre-pill" aria-pressed={!filters.genre} onClick={() => onChange({ genre: '' })}>
          All
        </button>
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            className="genre-pill"
            aria-pressed={filters.genre === genre}
            onClick={() => onChange({ genre: filters.genre === genre ? '' : genre })}
          >
            {genre}
          </button>
        ))}
      </div>
    </section>
  );
}
