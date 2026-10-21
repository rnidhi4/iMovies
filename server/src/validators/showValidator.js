const { objectIdParam } = require('./commonValidator');

const showIdRules = [objectIdParam('id')];

module.exports = { showIdRules };
