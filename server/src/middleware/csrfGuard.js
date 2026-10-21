const { clientOrigins } = require('../config/env');
const ApiError = require('../utils/ApiError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Because production cookies are SameSite=None, another website could try to make the
// browser send our cookie. For state-changing requests we therefore require:
//  1. an allowed Origin (when the browser sends one), and
//  2. a custom header. Browsers will not add a custom header on a cross-site request
//     unless CORS allows it, and our CORS allow-list does not allow other sites.
const csrfGuard = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin && !clientOrigins.includes(origin)) {
    return next(ApiError.forbidden('Request origin is not allowed'));
  }

  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    return next(ApiError.forbidden('Missing X-Requested-With header'));
  }

  return next();
};

module.exports = csrfGuard;
