const express = require('express');
const controller = require('../controllers/adminCatalogController');
const { movieRules, theatreRules, screenRules, idRules } = require('../validators/adminCatalogValidator');
const validate = require('../middleware/validate');

// This router is mounted INSIDE adminRoutes.js, which already requires a logged-in admin
// for everything (authenticate + requireRole). Do not mount it anywhere else.
const router = express.Router();

// Movies
router.post('/movies', movieRules, validate, controller.createMovie);
router.put('/movies/:id', idRules, movieRules, validate, controller.updateMovie);
router.delete('/movies/:id', idRules, validate, controller.deleteMovie);

// Theatres
router.get('/theatres', controller.listTheatres);
router.post('/theatres', theatreRules, validate, controller.createTheatre);
router.put('/theatres/:id', idRules, theatreRules, validate, controller.updateTheatre);
router.delete('/theatres/:id', idRules, validate, controller.deleteTheatre);

// Screens
router.post('/screens', screenRules, validate, controller.createScreen);
router.delete('/screens/:id', idRules, validate, controller.deleteScreen);

module.exports = router;
