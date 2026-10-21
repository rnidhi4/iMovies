// Makes user text safe to use inside a regular expression ("a.b" must not match "aXb")
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
