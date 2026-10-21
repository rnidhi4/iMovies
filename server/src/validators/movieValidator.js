const { query } = require('express-validator');
const { MOVIE_STATUS } = require('../config/constants');
const { objectIdParam, paginationQuery } = require('./commonValidator');

// Empty values (?search=) are ignored. Arrays (?genre=a&genre=b) fail isString(), which also
// blocks query-operator tricks aimed at the database.
const optionalText = (name, max) =>
  query(name)
    .optional({ values: 'falsy' })
    .isString().withMessage(`${name} must be text`).bail()
    .trim()
    .isLength({ max }).withMessage(`${name} is too long`);

const listMoviesRules = [
  optionalText('search', 100),
  optionalText('genre', 50),
  optionalText('language', 50),
  query('status')
    .optional({ values: 'falsy' })
    .isIn(Object.values(MOVIE_STATUS)).withMessage('status must be NOW_SHOWING or UPCOMING'),
  ...paginationQuery,
];

const movieIdRules = [objectIdParam('id')];

// ?date=2026-10-25 (a calendar day in India). Leaving it out means "today".
const movieShowsRules = [
  objectIdParam('id'),
  query('date')
    .optional({ values: 'falsy' })
    .isString().withMessage('date must be text').bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must look like 2026-10-25').bail()
    .isISO8601({ strict: true }).withMessage('date is not a real calendar date'),
];

module.exports = { listMoviesRules, movieIdRules, movieShowsRules };
