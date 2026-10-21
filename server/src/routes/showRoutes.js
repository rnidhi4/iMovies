const express = require('express');
const {
  getShow,
  getShowSeats,
  getShowsForMovie,
} = require('../controllers/showController');

const { showIdRules } = require('../validators/showValidator');
const validate = require('../middleware/validate');

const router = express.Router();

// Movie ke shows ke liye route abhi movieRoutes.js mein add hoga.

// Individual show details
router.get('/:id', showIdRules, validate, getShow);

// Individual show ki seats
router.get('/:id/seats', showIdRules, validate, getShowSeats);

module.exports = router;