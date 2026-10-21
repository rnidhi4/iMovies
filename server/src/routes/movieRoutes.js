const express = require('express');
const { listMovies, getMovie, getMovieShows } = require('../controllers/movieController');
const { listMoviesRules, movieIdRules, movieShowsRules } = require('../validators/movieValidator');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', listMoviesRules, validate, listMovies);
router.get('/:id', movieIdRules, validate, getMovie);
router.get('/:id/shows', movieShowsRules, validate, getMovieShows);

module.exports = router;
