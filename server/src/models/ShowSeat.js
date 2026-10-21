const mongoose = require('mongoose');
const { SEAT_STATUS, SEAT_TIER } = require('../config/constants');

// One document per seat per show. Seat locking works by atomically flipping `status`
// on these documents (see Phase 2D seatService).
const showSeatSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    label: { type: String, required: true }, // e.g. "A5"
    row: { type: String, required: true },
    number: { type: Number, required: true },
    tier: { type: String, enum: Object.values(SEAT_TIER), required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(SEAT_STATUS), default: SEAT_STATUS.AVAILABLE },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    holdExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// The unique index guarantees a seat can exist only once per show.
showSeatSchema.index({ show: 1, label: 1 }, { unique: true });
showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ booking: 1 });
showSeatSchema.index({ status: 1, holdExpiresAt: 1 }); // used by the expired-hold sweeper

module.exports = mongoose.model('ShowSeat', showSeatSchema);
