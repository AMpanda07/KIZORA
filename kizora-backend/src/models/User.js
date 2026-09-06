const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    },
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
      required: false
    },
    progressSeconds: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    preferences: {
      mediaSource: { type: String, default: 'consumet' },
      adultContent: { type: Boolean, default: false },
      subtitles: { type: String, default: 'sub' }
    },
    bookmarkedMedias: [{
      mediaId: { type: String, required: true },
      title: String,
      coverArt: String,
      status: { type: String, enum: ['Completed', 'Dropped', 'Planning', 'Watching'], default: 'Planning' }
    }],
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Anime'
      }
    ],
    watchHistory: [watchHistorySchema],
    anilistId: {
      type: String,
      default: null
    },
    anilistAccessToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
