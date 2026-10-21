const mongoose = require('mongoose');
const { MOVIE_STATUS } = require('../config/constants');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    genres: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (genres) => Array.isArray(genres) && genres.length > 0,
        message: 'At least one genre is required',
      },
    },
    language: { type: String, required: [true, 'Language is required'], trim: true },
    durationMins: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
      max: 600,
      validate: { validator: Number.isInteger, message: 'Duration must be a whole number of minutes' },
    },
    releaseDate: { type: Date, required: [true, 'Release date is required'] },
    // Empty is allowed: the frontend shows a fallback image
    posterUrl: { type: String, trim: true, default: '', match: [/^https?:\/\/.+/i, 'posterUrl must be an http(s) URL'] },
    trailerUrl: { type: String, trim: true, default: '', match: [/^https?:\/\/.+/i, 'trailerUrl must be an http(s) URL'] },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    cast: { type: [{ type: String, trim: true }], default: [] },
    status: { type: String, enum: Object.values(MOVIE_STATUS), default: MOVIE_STATUS.NOW_SHOWING },
  },
  { timestamps: true, versionKey: false }
);

movieSchema.index({ status: 1, releaseDate: -1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ language: 1 });
movieSchema.index({ title: 1 });

module.exports = mongoose.model('Movie', movieSchema);
