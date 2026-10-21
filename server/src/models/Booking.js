const mongoose = require('mongoose');
const {
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
  SEAT_TIER,
  CANCELLED_BY,
} = require('../config/constants');

// Snapshot of each seat at booking time, so later price changes never rewrite history.
const seatLineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    tier: { type: String, enum: Object.values(SEAT_TIER), required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true }, // e.g. IM-20261015-K7Q2XP
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    showStartsAt: { type: Date, required: true }, // copied from the show: makes upcoming/past queries simple
    seats: {
      type: [seatLineSchema],
      validate: { validator: (seats) => seats.length > 0, message: 'A booking needs at least one seat' },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.PENDING_PAYMENT },
    paymentStatus: {
      type: String,
      enum: Object.values(BOOKING_PAYMENT_STATUS),
      default: BOOKING_PAYMENT_STATUS.UNPAID,
    },
    holdExpiresAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellation: {
      cancelledBy: { type: String, enum: Object.values(CANCELLED_BY) },
      reason: { type: String, trim: true, maxlength: 300 },
      refundPercent: { type: Number, min: 0, max: 100 },
      refundAmount: { type: Number, min: 0 },
    },
  },
  { timestamps: true, versionKey: false }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ user: 1, showStartsAt: 1 });
bookingSchema.index({ show: 1, status: 1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 }); // sweeper

// A user can have only ONE unpaid hold per show, enforced by the database itself.
// (bookingService must mark a user's stale, expired hold as EXPIRED before creating a new one.)
bookingSchema.index(
  { user: 1, show: 1 },
  { unique: true, partialFilterExpression: { status: BOOKING_STATUS.PENDING_PAYMENT } }
);

module.exports = mongoose.model('Booking', bookingSchema);
