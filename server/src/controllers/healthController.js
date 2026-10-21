const mongoose = require('mongoose');
const { transactionsSupported } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// GET /api/v1/health
const getHealth = asyncHandler(async (req, res) => {
  const dbState = READY_STATES[mongoose.connection.readyState] || 'unknown';
  const healthy = dbState === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbState,
    transactions: transactionsSupported(),
  });
});

module.exports = { getHealth };
