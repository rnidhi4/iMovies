const mongoose = require('mongoose');
const { SEAT_TIER } = require('../config/constants');

// One row of the seating plan, e.g. { label: 'A', seatCount: 12, tier: 'STANDARD', aisleAfter: [6] }
const rowSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{1,2}$/, 'Row label must be 1 or 2 letters'],
    },
    seatCount: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
      validate: { validator: Number.isInteger, message: 'seatCount must be a whole number' },
    },
    tier: { type: String, enum: Object.values(SEAT_TIER), default: SEAT_TIER.STANDARD },
    // Visual gaps: [6] draws an aisle after seat 6
    aisleAfter: { type: [Number], default: [] },
  },
  { _id: false }
);

rowSchema.path('aisleAfter').validate(function validateAisles(aisles) {
  return aisles.every((n) => Number.isInteger(n) && n >= 1 && n < this.seatCount);
}, 'aisleAfter values must be between 1 and seatCount - 1');

const rowsAreValid = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 26) return false;
  return new Set(rows.map((row) => row.label)).size === rows.length; // labels must be unique
};

const screenSchema = new mongoose.Schema(
  {
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    name: { type: String, required: [true, 'Screen name is required'], trim: true, maxlength: 50 },
    layout: {
      rows: {
        type: [rowSchema],
        validate: { validator: rowsAreValid, message: 'Provide 1-26 rows with unique labels' },
      },
    },
  },
  { timestamps: true, versionKey: false, id: false, toJSON: { virtuals: true } }
);

screenSchema.virtual('totalSeats').get(function totalSeats() {
  return this.layout.rows.reduce((sum, row) => sum + row.seatCount, 0);
});

screenSchema.index({ theatre: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);
