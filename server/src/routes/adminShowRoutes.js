const express = require('express');
const controller = require('../controllers/adminShowController');
const { listShowsRules, createShowRules, updateShowRules } = require('../validators/adminShowValidator');
const validate = require('../middleware/validate');

// Mounted INSIDE adminRoutes.js, which already requires a logged-in admin for everything.
const router = express.Router();

router.get('/shows', listShowsRules, validate, controller.listShows);
router.post('/shows', createShowRules, validate, controller.createShow);
router.put('/shows/:id', updateShowRules, validate, controller.updateShow);

module.exports = router;
