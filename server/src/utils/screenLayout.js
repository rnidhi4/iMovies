const { SEAT_TIER } = require('../config/constants');

// Checks the seating plan sent when creating a screen. Returns a plain-English problem,
// or null when everything is fine. Kept free of Express/Mongoose so it is easy to test.
const findLayoutProblem = (rows) => {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 26) return 'Provide 1 to 26 rows';

  const seen = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const where = `Row ${index + 1}`;
    if (!row || typeof row !== 'object' || Array.isArray(row)) return `${where} is not valid`;

    const label = typeof row.label === 'string' ? row.label.trim().toUpperCase() : '';
    if (!/^[A-Z]{1,2}$/.test(label)) return `${where}: label must be 1 or 2 letters`;
    if (seen.has(label)) return `Row label "${label}" is used more than once`;
    seen.add(label);

    if (!Number.isInteger(row.seatCount) || row.seatCount < 1 || row.seatCount > 30) {
      return `Row ${label}: seats per row must be a whole number from 1 to 30`;
    }
    if (row.tier !== undefined && !Object.values(SEAT_TIER).includes(row.tier)) {
      return `Row ${label}: tier must be STANDARD or PREMIUM`;
    }
    if (row.aisleAfter !== undefined) {
      if (!Array.isArray(row.aisleAfter) || row.aisleAfter.length > 5) return `Row ${label}: aisle list is not valid`;
      const badAisle = row.aisleAfter.some((n) => !Number.isInteger(n) || n < 1 || n >= row.seatCount);
      if (badAisle) return `Row ${label}: an aisle must come after a seat between 1 and ${row.seatCount - 1}`;
    }
  }
  return null;
};

// Keeps only the known fields, in the exact shape the Screen model stores.
const normalizeLayoutRows = (rows) =>
  rows.map((row) => ({
    label: row.label.trim().toUpperCase(),
    seatCount: row.seatCount,
    tier: row.tier || SEAT_TIER.STANDARD,
    aisleAfter: Array.isArray(row.aisleAfter) ? [...new Set(row.aisleAfter)].sort((a, b) => a - b) : [],
  }));

module.exports = { findLayoutProblem, normalizeLayoutRows };
