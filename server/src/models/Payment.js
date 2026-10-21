const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

// DEMO payments only. No card data is ever collected or stored.
// `provider` and `transactionRef` are shaped like a real gateway's fields so a real
// gateway (Razorpay, Stripe...) can replace the demo logic in paymentService later.
const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.INITIATED },
    provider: { type: String, enum: ['DEMO'], default: 'DEMO' },
    transactionRef: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, required: true, maxlength: 100 },
    failureReason: { type: String, trim: true, maxlength: 300 },
    refundedAmount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// Repeating the same request (same key) for the same booking can never create a second payment.
paymentSchema.index({ booking: 1, idempotencyKey: 1 }, { unique: true });
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
