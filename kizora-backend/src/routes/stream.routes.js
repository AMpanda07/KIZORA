const express = require('express');
const fs = require('fs');
const path = require('path');
const Episode = require('../models/Episode');

const router = express.Router();

/**
 * @route   GET /api/stream/video/:episodeId
 * @desc    Stream video with HTTP Range request support
 * @access  Public
 */
router.get('/video/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;

    // Fetch episode from database
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // Resolve video file path
    const videoPath = path.isAbsolute(episode.videoUrl)
      ? episode.videoUrl
      : path.resolve(process.cwd(), episode.videoUrl);

    // Check if video file exists on server
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found on server' });
    }

    // Get file statistics
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse Range header (e.g. "bytes=32323-")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 10 ** 6, fileSize - 1);

      if (start >= fileSize || end >= fileSize) {
        return res.status(416).json({ message: 'Requested range not satisfiable' });
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error(`Streaming error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while streaming video' });
  }
});

module.exports = router;
