// The genre and language lists match the sample data created by the backend seed script.
export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller',
];

export const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi',
];

// Must match MAX_SEATS_PER_BOOKING in server/.env (the backend is the real limit).
export const MAX_SEATS_PER_BOOKING = 8;

export const POSTER_FALLBACK = '/poster-fallback.svg';

export const CANCELLATION_POLICY = [
  '24 hours or more before the show: 100% refund',
  '2 to 24 hours before the show: 50% refund',
  'Less than 2 hours before the show: cancellation is not allowed',
];

// Bootstrap grid classes shared by the movie lists and their loading skeletons
export const MOVIE_GRID_CLASSES = 'row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-3';
