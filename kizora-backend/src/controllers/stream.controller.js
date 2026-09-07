const axios = require('axios');
const { getTitleWithFallback } = require('../utils/metadata');

const FAST_TIMEOUT = 30000;
const ANIWATCH_BASE = process.env.ANIWATCH_API_URL || 'https://aniwatch-api-v1-0.onrender.com';

// ─────────────────────────────────────────────────────────────────────────────
// Controller: getLiveStreamSources
// Resolves stream using Iframe Embeds (Jikan + Third-Party Proxy approach)
// ─────────────────────────────────────────────────────────────────────────────
const getLiveStreamSources = async (req, res) => {
  const rawId = req.params.id || req.params.episodeId || '';

  if (!rawId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Episode ID is required. Pass it as /stream/:id',
    });
  }

  const compoundMatch = rawId.match(/^(\d+)-ep-(\d+)$/);
  const animeId    = compoundMatch ? compoundMatch[1] : rawId; // This is the AniList or MAL ID
  const episodeNum = compoundMatch ? parseInt(compoundMatch[2], 10) : 1;

  try {
    // Attempt to resolve metadata to construct a meaningful embed
    // Because public scraping APIs are currently blocked by Defender/Cloudflare, 
    // and no public iframe APIs support MAL/AniList IDs natively, we cannot safely
    // construct a working stream URL.
    
    // Returning an explicit error so the frontend granular error state can handle it
    // gracefully without showing a broken 404 player.
    return res.status(500).json({
      error: 'Stream unavailable for this episode',
      message: 'No supported iframe provider found for this Anime ID format.'
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Stream unavailable for this episode',
      message: e.message
    });
  }
};

module.exports = { getLiveStreamSources };
