const { getAnimeInfoWithFallback } = require('../utils/metadata');
const { resolveStream, providerManager } = require('../services/provider.service');

/**
 * Controller: getLiveStreamSources
 * Resolves stream sources across the 5 providers using sequential per-episode fallback
 */
const getLiveStreamSources = async (req, res) => {
  let animeId = req.params.animeId;
  let episodeNum = req.params.episodeNumber ? parseInt(req.params.episodeNumber, 10) : null;

  const rawId = req.params.id || req.params.episodeId || '';
  if (!animeId && rawId) {
    const compoundMatch = rawId.match(/^(\d+)-ep-(\d+)$/);
    if (compoundMatch) {
      animeId = compoundMatch[1];
      episodeNum = parseInt(compoundMatch[2], 10);
    } else {
      animeId = rawId;
      episodeNum = 1;
    }
  }

  if (!animeId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Anime ID and episode number are required.'
      }
    });
  }

  if (!episodeNum || isNaN(episodeNum) || episodeNum < 1) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EPISODE_NUMBER',
        message: `Invalid episode number: ${req.params.episodeNumber}`
      }
    });
  }

  try {
    // 1. Resolve Anime Metadata
    let info = await getAnimeInfoWithFallback(animeId).catch(() => null);
    if (!info || !info.title) {
      info = { title: `Anime ${animeId}`, japaneseTitle: '', synonyms: [] };
    }

    const forceProvider = req.query.server || null;

    // 2. Resolve Stream sequentially across providers for this episode ONLY
    const streamResult = await resolveStream(animeId, episodeNum, info, 'sub', 'default', forceProvider);

    if (streamResult && streamResult.success && streamResult.url) {
      return res.status(200).json({
        success: true,
        animeId: String(animeId),
        episodeNumber: episodeNum,
        provider: streamResult.provider,
        url: streamResult.url,
        type: streamResult.type || (streamResult.url.includes('.m3u8') ? 'hls' : 'iframe'),
        isIframe: streamResult.isIframe !== false,
        sources: streamResult.sources || (streamResult.type === 'hls' ? [{ url: streamResult.url, isM3U8: true }] : []),
        servers: streamResult.servers || []
      });
    }

    // All 5 providers failed for this specific episode
    return res.status(404).json({
      success: false,
      error: {
        code: 'EPISODE_STREAM_UNAVAILABLE',
        message: `No playable stream available for Episode ${episodeNum} of "${info.title || animeId}".`,
        animeId: String(animeId),
        episodeNumber: episodeNum
      },
      attempted: streamResult?.attemptedProviders || []
    });

  } catch (e) {
    console.error(`[STREAM CONTROLLER] Error: ${e.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: e.message,
        animeId: String(animeId),
        episodeNumber: episodeNum
      }
    });
  }
};

/**
 * Controller: invalidateStreamCache
 * Invalidates cached broken stream for an episode
 */
const invalidateStreamCache = (req, res) => {
  const { animeId, episodeNumber } = req.params;
  providerManager.invalidateStreamCache(animeId, episodeNumber);
  return res.status(200).json({ success: true, message: `Cache invalidated for anime ${animeId} Ep ${episodeNumber}` });
};

/**
 * Controller: getAvailableServers
 * Runs a lightweight check or diagnostic to return available providers for an episode
 */
const getAvailableServers = async (req, res) => {
  const { animeId, episodeNumber } = req.params;
  const episodeNum = parseInt(episodeNumber, 10) || 1;

  try {
    let info = await getAnimeInfoWithFallback(animeId).catch(() => null);
    if (!info || !info.title) {
      info = { title: `Anime ${animeId}`, japaneseTitle: '', synonyms: [] };
    }

    // Use the diagnostic method to see which providers have the episode
    const diagnostic = await providerManager.runDiagnostic(animeId, episodeNum, info);
    
    // Filter to only successful providers
    const servers = diagnostic.results
      .filter(d => d.success)
      .map(d => ({
        id: d.provider,
        name: d.provider.charAt(0).toUpperCase() + d.provider.slice(1),
        available: true,
        priority: d.priority
      }));

    return res.status(200).json({
      success: true,
      animeId,
      episodeNumber: episodeNum,
      servers
    });
  } catch (e) {
    console.error(`[STREAM CONTROLLER] Error fetching servers: ${e.message}`);
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getLiveStreamSources, invalidateStreamCache, getAvailableServers };
