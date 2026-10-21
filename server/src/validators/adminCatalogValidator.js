const { body } = require('express-validator');
const { MOVIE_STATUS } = require('../config/constants');
const { objectIdParam } = require('./commonValidator');
const { findLayoutProblem } = require('../utils/screenLayout');

// A required text field: must be text, not blank, and not longer than `max`.
const requiredText = (name, label, max) =>
  body(name)
    .isString().withMessage(`${label} is required`).bail()
    .trim()
    .notEmpty().withMessage(`${label} is required`).bail()
    .isLength({ max }).withMessage(`${label} must be ${max} characters or fewer`);

// An optional http(s) link. Empty is allowed (the website shows a fallback image).
const optionalUrl = (name, label) =>
  body(name)
    .optional({ values: 'falsy' })
    .isString().withMessage(`${label} must be text`).bail()
    .trim()
    .isLength({ max: 500 }).withMessage(`${label} is too long`).bail()
    .matches(/^https?:\/\/.+/i).withMessage(`${label} must start with http:// or https://`);

// A list of short text items (genres, cast)
const textList = (name, { min, max, itemMax, minMessage }) => [
  body(name).isArray({ min, max }).withMessage(minMessage || `${name} must have ${min} to ${max} items`),
  body(name)
    .if(body(name).isArray())
    .custom((items) => items.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= itemMax))
    .withMessage(`Each ${name} item must be text of 1 to ${itemMax} characters`),
];

// Used for BOTH creating and editing a movie (the admin form always sends every field).
const movieRules = [
  requiredText('title', 'Title', 150),
  requiredText('description', 'Description', 2000),
  ...textList('genres', { min: 1, max: 10, itemMax: 50, minMessage: 'Choose at least one genre' }),
  requiredText('language', 'Language', 50),
  body('durationMins').isInt({ min: 1, max: 600 }).withMessage('Duration must be a whole number from 1 to 600 minutes').toInt(),
  body('releaseDate')
    .isString().withMessage('Release date is required').bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Release date must look like 2026-10-25').bail()
    .isISO8601({ strict: true }).withMessage('Release date is not a real calendar date'),
  optionalUrl('posterUrl', 'Poster URL'),
  optionalUrl('trailerUrl', 'Trailer URL'),
  body('rating').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10').toFloat(),
  ...textList('cast', { min: 0, max: 20, itemMax: 100 }).map((rule) => rule.optional()),
  body('status').optional({ values: 'falsy' }).isIn(Object.values(MOVIE_STATUS)).withMessage('Status must be NOW_SHOWING or UPCOMING'),
];

const theatreRules = [
  requiredText('name', 'Theatre name', 100),
  requiredText('city', 'City', 60),
  requiredText('address', 'Address', 250),
];

const screenRules = [
  body('theatre').isString().withMessage('Theatre is required').bail().isMongoId().withMessage('Theatre must be a valid id'),
  requiredText('name', 'Screen name', 50),
  body('layout.rows')
    .isArray({ min: 1, max: 26 }).withMessage('Provide 1 to 26 rows').bail()
    .custom((rows) => {
      const problem = findLayoutProblem(rows);
      if (problem) throw new Error(problem);
      return true;
    }),
];

const idRules = [objectIdParam('id')];

module.exports = { movieRules, theatreRules, screenRules, idRules };
