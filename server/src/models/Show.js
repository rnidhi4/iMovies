const mongoose = require('mongoose');

const priceField = {
  type: Number,
  required: true,
  min: 0,
  validate: { validator: Number.isInteger, message: 'Price must be a whole number of rupees' },
};

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    startsAt: { type: Date, required: true }, // stored in UTC, displayed in IST by the client
    endsAt: { type: Date, required: true },
    pricing: { STANDARD: priceField, PREMIUM: priceField },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// Runs on save()/create(). Services will use save() for edits so this always applies.
showSchema.path('endsAt').validate(function endsAfterStart(value) {
  return !this.startsAt || value > this.startsAt;
}, 'endsAt must be after startsAt');

showSchema.index({ movie: 1, startsAt: 1 });
showSchema.index({ theatre: 1, startsAt: 1 });
// Blocks two shows starting at the same instant on one screen.
// Overlapping (not identical) times are checked in showService (Phase 2C).
showSchema.index({ screen: 1, startsAt: 1 }, { unique: true });

module.exports = mongoose.model('Show', showSchema);
