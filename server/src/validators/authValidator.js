const { body } = require('express-validator');

const nameRule = body('name')
  .isString().withMessage('Name is required').bail()
  .trim()
  .isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters');

const emailRule = body('email')
  .isString().withMessage('Email is required').bail()
  .trim()
  .toLowerCase()
  .isEmail().withMessage('Enter a valid email address').bail()
  .isLength({ max: 254 }).withMessage('Email is too long');

const newPasswordRule = body('password')
  .isString().withMessage('Password is required').bail()
  .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
  .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
  .matches(/\d/).withMessage('Password must contain at least one number')
  // bcrypt only uses the first 72 BYTES, and some characters take more than one byte
  .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long');

// Nobody can choose their own role at sign-up. Sending the field is an error.
const noRoleRule = body('role').not().exists().withMessage('This field cannot be set');

const registerRules = [nameRule, emailRule, newPasswordRule, noRoleRule];

const loginRules = [
  emailRule,
  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 1, max: 128 }).withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
