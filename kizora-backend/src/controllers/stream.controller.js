const axios = require('axios');

// ─── Provider Config ──────────────────────────────────────────────────────────
const ANIWATCH_BASE   = process.env.ANIWATCH_API_URL || 'https://aniwatch-api-v1-0.onrender.com';

// Reliable public test HLS streams used when external providers fail or time out
const FALLBACK_HLS    = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const FALLBACK_HLS_HD = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

// Fast timeout for external scraper calls so requests respond immediately
const FAST_TIMEOUT = 30000;

// ─── Try Aniwatch direct API ────────────────────────────────────────────────────
const tryAniwatch = async (animeId, episodeNum) => {
  const ANIWATCH_BASE = process.env.ANIWATCH_API_URL || 'https://aniwatch-api-v1-0.onrender.com';
  
  try {
    // 1. Fetch title from Jikan using MAL ID
    const jikanRes = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
    const title = jikanRes.data?.data?.title_english || jikanRes.data?.data?.title;
    if (!title) throw new Error('Could not find anime title for ID: ' + animeId);

    // 2. Search Aniwatch for the title to get the slug
    const searchRes = await axios.get(`${ANIWATCH_BASE}/api/v2/hianime/search?q=${encodeURIComponent(title)}`, { timeout: FAST_TIMEOUT });
    const animes = searchRes.data?.data?.animes || [];
    if (animes.length === 0) throw new Error('No Aniwatch results for ' + title);
    
    // We assume the first result is the most relevant
    const aniwatchId = animes[0].id; // e.g., 'one-piece-100'

    // 3. Fetch episodes for this Aniwatch ID
    const epsRes = await axios.get(`${ANIWATCH_BASE}/api/v2/hianime/anime/${aniwatchId}/episodes`, { timeout: FAST_TIMEOUT });
    const eps = epsRes.data?.data?.episodes || [];
    
    // Find the specific episode by number
    const targetEp = eps.find(e => parseInt(e.number) === episodeNum) || eps[0];
    if (!targetEp) throw new Error('Episode not found in Aniwatch list');

    const exactEpisodeId = targetEp.episodeId; // e.g., 'one-piece-100?ep=4'

    // 4. Fetch the stream sources using the exact episode ID
    const url = `${ANIWATCH_BASE}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(exactEpisodeId)}&server=vidstreaming`;
    const resp = await axios.get(url, { timeout: FAST_TIMEOUT });
    if (!resp.data?.data?.sources?.length) throw new Error('No sources from Aniwatch');
    
    return {
      episodeId: `${animeId}-ep-${episodeNum}`, // keep consistent with frontend format
      timestamp: Date.now(),
      url: resp.data.data.sources[0].url,
      sources: resp.data.data.sources.map(s => ({
        url: s.url,
        quality: 'Auto',
        isHLS: s.isM3U8
      })),
      headers: {},
      servers: [{ name: 'Aniwatch', id: 'aniwatch' }],
    };
  } catch (err) {
    console.error('Aniwatch resolution failed:', err.message);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Controller: getLiveStreamSources
// Resolves stream using ONLY the Aniwatch API, falling back to Mux HLS if it fails.
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
  const animeId    = compoundMatch ? compoundMatch[1] : rawId;
  const episodeNum = compoundMatch ? parseInt(compoundMatch[2], 10) : 1;

  console.log(`🎬 [STREAM] Resolving: rawId="${rawId}" → animeId="${animeId}", ep=${episodeNum} via Aniwatch`);

  try {
    const streamData = await tryAniwatch(animeId, episodeNum);
    console.log(`✅ [STREAM] Resolved source for ${rawId} from Aniwatch`);
    return res.status(200).json(streamData);
  } catch (e) {
    console.warn(`⚠️ [STREAM] Aniwatch resolution failed: ${e.message}`);
  }

  // Fallback return if Aniwatch fails
  return res.status(200).json({
    episodeId:   rawId,
    timestamp:   Date.now(),
    isFallback:  true,
    url:         FALLBACK_HLS,
    sources: [
      { url: FALLBACK_HLS,    quality: 'Auto HLS (Adaptive)', isHLS: true },
      { url: FALLBACK_HLS_HD, quality: '1080p UHD (Tears of Steel)', isHLS: true },
    ],
    headers: {},
    servers: [
      { name: 'Mux Test CDN',        id: 'mux-fallback' },
      { name: 'Unified Streaming HD', id: 'unified-hd' },
    ],
  });
};

module.exports = { getLiveStreamSources };
