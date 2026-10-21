const express = require('express');
const authRoutes = require('./authRoutes');
const movieRoutes = require('./movieRoutes');
const theatreRoutes = require('./theatreRoutes');
const showRoutes = require('./showRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/theatres', theatreRoutes);
router.use('/shows', showRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

// Next phase: admin routes

module.exports = router;