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
    // we return an iframe embed format. The frontend will render this instead of ReactPlayer.
    
    // In a real production environment, you would map animeId -> TMDB/IMDB or use a dedicated anime embed like Aniwave/Vidsrc
    // For now, we will construct a proxy URL. 
    // Note: If this proxy fails, the data pipeline is still intact.
    const iframeUrl = `https://autoembed.co/anime/mal/${animeId}/${episodeNum}`;

    return res.status(200).json({
      episodeId: `${animeId}-ep-${episodeNum}`,
      timestamp: Date.now(),
      isIframe: true, // Tell frontend to render an <iframe>
      url: iframeUrl, // The iframe src
      sources: [],
      headers: {},
      servers: [{ name: 'AutoEmbed Proxy', id: 'autoembed' }],
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Stream unavailable for this episode',
      message: e.message
    });
  }
};

module.exports = { getLiveStreamSources };
