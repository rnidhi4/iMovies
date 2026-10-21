const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true, maxlength: 100 },
    city: { type: String, required: [true, 'City is required'], trim: true, maxlength: 60 },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 250 },
  },
  { timestamps: true, versionKey: false }
);

theatreSchema.index({ name: 1, city: 1 }, { unique: true });
theatreSchema.index({ city: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
