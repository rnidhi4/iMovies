const { query } = require('express-validator');
const { paginationQuery } = require('./commonValidator');

// GET /admin/users?search=&page=&limit=
const listUsersRules = [
  query('search')
    .optional({ values: 'falsy' })
    .isString().withMessage('search must be text').bail()
    .trim()
    .isLength({ max: 100 }).withMessage('search is too long'),
  ...paginationQuery,
];

module.exports = { listUsersRules };
