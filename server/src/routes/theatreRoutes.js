const express = require('express');
const { listTheatres } = require('../controllers/theatreController');
const { listTheatresRules } = require('../validators/theatreValidator');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', listTheatresRules, validate, listTheatres);

module.exports = router;
