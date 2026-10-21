const { query } = require('express-validator');

const listTheatresRules = [
  query('city')
    .optional({ values: 'falsy' })
    .isString().withMessage('city must be text').bail()
    .trim()
    .isLength({ max: 60 }).withMessage('city is too long'),
];

module.exports = { listTheatresRules };
