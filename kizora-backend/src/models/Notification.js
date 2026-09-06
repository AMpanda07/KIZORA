const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    coverArt: {
      type: String
    },
    lastEpisodeNotified: {
      type: Number,
      default: 0
    },
    nextEpisodeToNotify: {
      type: Number,
      default: 1
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
