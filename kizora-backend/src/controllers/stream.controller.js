const axios = require('axios');

// ─── Provider Config ──────────────────────────────────────────────────────────
const CONSUMET_BASE   = process.env.CONSUMET_API_URL || 'https://api.consumet.org';
const ANIMEKAI_BASE   = process.env.ANIMEKAI_API_URL || 'https://animekai.to';

// Reliable public test HLS streams used when external providers fail or time out
const FALLBACK_HLS    = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const FALLBACK_HLS_HD = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

// Fast 1200ms timeout for external scraper calls so requests respond immediately
const FAST_TIMEOUT = 1200;

// ─── Normalize Consumet episode source response ───────────────────────────────
const normalizeSources = (data, episodeId) => ({
  episodeId,
  timestamp:  Date.now(),
  url:        data?.sources?.[0]?.url || FALLBACK_HLS,
  sources:    (data?.sources || []).map(s => ({
    url:     s.url,
    quality: s.quality || 'Auto',
    isHLS:   s.isM3U8 ?? s.url?.includes('.m3u8') ?? true,
  })),
  headers:    data?.headers || { Referer: ANIMEKAI_BASE },
  servers:    data?.servers || [],
  subtitles:  data?.subtitles || [],
});

// ─── Try Gogoanime via Consumet ───────────────────────────────────────────────
const tryConsumetGogoanime = async (episodeId) => {
  const url = `${CONSUMET_BASE}/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, { timeout: FAST_TIMEOUT });
  if (!resp.data?.sources?.length) throw new Error('No sources from Gogoanime');
  return normalizeSources(resp.data, episodeId);
};

// ─── Try Zoro / Aniwatch via Consumet ────────────────────────────────────────
const tryConsumetZoro = async (episodeId) => {
  const url = `${CONSUMET_BASE}/anime/zoro/watch?episodeId=${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, { timeout: FAST_TIMEOUT });
  if (!resp.data?.sources?.length) throw new Error('No sources from Zoro');
  return normalizeSources(resp.data, episodeId);
};

// ─── Try AnimeKai direct scrape ───────────────────────────────────────────────
const tryAnimeKai = async (episodeId) => {
  const url = `${ANIMEKAI_BASE}/ajax/episode/list/${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, {
    timeout: FAST_TIMEOUT,
    headers: {
      Referer: ANIMEKAI_BASE,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = resp.data?.html || resp.data;
  if (!html) throw new Error('AnimeKai returned empty response');

  const m3u8Match = (typeof html === 'string') && html.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
  if (!m3u8Match) throw new Error('No .m3u8 URL found in AnimeKai response');

  const hlsUrl = m3u8Match[1];
  return {
    episodeId,
    timestamp: Date.now(),
    url: hlsUrl,
    sources: [{ url: hlsUrl, quality: 'Auto HLS', isHLS: true }],
    headers: { Referer: ANIMEKAI_BASE },
    servers: [{ name: 'AnimeKai CDN', id: 'animekai-cdn' }],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Controller: getLiveStreamSources
// Parallel resolver: attempts all providers in parallel with 1.2s timeout,
// immediately falling back to Mux HLS if external calls fail/time out.
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

  console.log(`🎬 [STREAM] Resolving: rawId="${rawId}" → animeId="${animeId}", ep=${episodeNum}`);

  const isNumericId     = /^\d+$/.test(animeId);
  const gogoEpisodeSlug = isNumericId ? null : `${animeId}-episode-${episodeNum}`;
  const zoroEpisodeId   = rawId;

  // Run provider checks in parallel to minimize latency
  const tasks = [];
  if (gogoEpisodeSlug) {
    tasks.push(tryConsumetGogoanime(gogoEpisodeSlug));
  }
  tasks.push(tryConsumetZoro(zoroEpisodeId));
  tasks.push(tryAnimeKai(animeId));

  try {
    const results = await Promise.allSettled(tasks);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.url) {
        console.log(`✅ [STREAM] Resolved source for ${rawId}`);
        return res.status(200).json(r.value);
      }
    }
  } catch (e) {
    console.warn(`⚠️ [STREAM] Parallel provider resolution failed: ${e.message}`);
  }

  // Instant Fallback return (< 1.2s total latency guaranteed)
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
