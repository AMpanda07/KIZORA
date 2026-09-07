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
  const animeId    = compoundMatch ? compoundMatch[1] : rawId; // KIZORA / MAL ID
  const episodeNum = compoundMatch ? parseInt(compoundMatch[2], 10) : 1;

  try {
    // 1. Get Anime info to resolve metadata
    const info = await getAnimeInfoWithFallback(animeId);
    if (!info || !info.title) {
      throw new Error(`Could not resolve metadata for ${animeId}`);
    }

    // 2. Search Provider
    const { searchProviderAnime, getProviderEpisodes, getProviderStream } = require('../services/provider.service');
    const providerAnimeId = await searchProviderAnime(info.title, info.japaneseTitle, info.synonyms);
    
    if (!providerAnimeId) {
      throw new Error(`Provider anime not found for title: ${info.title}`);
    }

    // 3. Fetch Provider Episodes
    const providerEps = await getProviderEpisodes(providerAnimeId);
    if (providerEps.length === 0) {
      throw new Error(`Provider episode list empty for: ${providerAnimeId}`);
    }

    // 4. Find matching episode
    const targetEp = providerEps.find(ep => ep.number === episodeNum);
    if (!targetEp) {
      throw new Error(`Episode ${episodeNum} not found in provider list`);
    }

    // 5. Fetch stream sources
    const streamInfo = await getProviderStream(targetEp.id);

    return res.status(200).json({
      success: true,
      url: streamInfo.url,
      isIframe: streamInfo.type === 'iframe',
      sources: streamInfo.type === 'hls' ? [{ url: streamInfo.url, isM3U8: true }] : [],
      servers: []
    });

  } catch (e) {
    console.error(`[STREAM] Error: ${e.message}`);
    return res.status(500).json({
      error: 'Stream unavailable for this episode',
      message: e.message
    });
  }
};

module.exports = { getLiveStreamSources };
