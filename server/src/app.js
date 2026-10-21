const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { isProduction, isTest } = require('./config/env');
const corsMiddleware = require('./config/cors');
const csrfGuard = require('./middleware/csrfGuard');
const { apiLimiter } = require('./middleware/rateLimiters');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const apiRoutes = require('./routes');

const app = express();

// Behind Render/Railway there is one proxy. Needed for correct client IPs
// (rate limiting) and for Secure cookies to work.
if (isProduction) app.set('trust proxy', 1);

// "simple" query parser: ?genre[$ne]=x stays a plain string instead of becoming an
// object, which blocks a common NoSQL-injection trick.
app.set('query parser', 'simple');

app.use(helmet());
app.use(corsMiddleware);
if (!isTest) app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Health check is mounted first so uptime monitors are not rate limited or CSRF checked.
app.use('/api/v1/health', healthRoutes);

app.use('/api/v1', apiLimiter, csrfGuard, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
