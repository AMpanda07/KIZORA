const { getAnimeInfoWithFallback } = require('../utils/metadata');
const { resolveStream } = require('../services/provider.service');

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

  if (!episodeNum || isNaN(episodeNum)) {
    episodeNum = 1;
  }

  try {
    // 1. Resolve Anime Metadata
    let info = await getAnimeInfoWithFallback(animeId).catch(() => null);
    if (!info || !info.title) {
      info = { title: `Anime ${animeId}`, japaneseTitle: '', synonyms: [] };
    }

    // 2. Resolve Stream sequentially across the 5 providers for this episode ONLY
    const streamResult = await resolveStream(animeId, episodeNum, info);

    if (streamResult && streamResult.success && streamResult.url) {
      return res.status(200).json({
        success: true,
        provider: streamResult.provider,
        url: streamResult.url,
        isIframe: streamResult.isIframe !== false,
        sources: streamResult.sources || (streamResult.type === 'hls' ? [{ url: streamResult.url, isM3U8: true }] : []),
        servers: streamResult.servers || []
      });
    }

    // All 5 providers failed: return exact specification schema
    return res.status(404).json({
      success: false,
      error: {
        code: 'ALL_PROVIDERS_FAILED',
        animeId: String(animeId),
        episode: episodeNum
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
        episode: episodeNum
      }
    });
  }
};

module.exports = { getLiveStreamSources };
