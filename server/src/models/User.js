const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates the unique index
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select:false means queries never return the hash unless you ask with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
  },
  { timestamps: true, versionKey: false }
);

// Second safety net: even if a hash is loaded, it is removed when converted to JSON.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
