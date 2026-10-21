const ApiError = require('../utils/ApiError');

// Must run AFTER authenticate. Example: router.use(authenticate, requireRole('admin'))
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to access this resource'));
  }
  return next();
};

module.exports = { requireRole };
