const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: [true, 'Anime ID is required']
    },
    episodeNumber: {
      type: Number,
      required: [true, 'Episode number is required']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required']
    },
    thumbnail: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index on animeId and episodeNumber
episodeSchema.index({ animeId: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.model('Episode', episodeSchema);
