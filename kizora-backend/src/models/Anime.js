const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Anime title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Anime slug is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    synopsis: {
      type: String,
      default: ''
    },
    coverImage: {
      type: String,
      default: ''
    },
    bannerImage: {
      type: String,
      default: ''
    },
    genres: [
      {
        type: String,
        trim: true
      }
    ],
    totalEpisodes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Ongoing', 'Completed', 'Upcoming'],
      default: 'Ongoing'
    },
    releaseYear: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Anime', animeSchema);
