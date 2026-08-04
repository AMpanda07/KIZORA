const axios = require('axios');

// ─── Provider Config ──────────────────────────────────────────────────────────
// Consumet API is the most reliable free provider that returns real HLS links
// It supports: gogoanime, zoro, animepahe as streaming providers
const CONSUMET_BASE   = process.env.CONSUMET_API_URL || 'https://api.consumet.org';
const ANIMEKAI_BASE   = process.env.ANIMEKAI_API_URL || 'https://animekai.to';

// Reliable public test HLS streams used ONLY when all providers fail
const FALLBACK_HLS    = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const FALLBACK_HLS_HD = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

// ─── Normalize Consumet episode source response ───────────────────────────────
const normalizeSources = (data, episodeId) => ({
  episodeId,
  timestamp:  Date.now(),
  url:        data?.sources?.[0]?.url || FALLBACK_HLS,        // primary single-URL for Watch.jsx
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
// episodeId format: "one-piece-episode-1107" (Gogoanime slug)
const tryConsumetGogoanime = async (episodeId) => {
  const url = `${CONSUMET_BASE}/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, { timeout: 8000 });
  if (!resp.data?.sources?.length) throw new Error('No sources from Gogoanime');
  return normalizeSources(resp.data, episodeId);
};

// ─── Try Zoro / Aniwatch via Consumet ────────────────────────────────────────
// episodeId format: "one-piece?ep=12345" (Zoro episode id)
const tryConsumetZoro = async (episodeId) => {
  const url = `${CONSUMET_BASE}/anime/zoro/watch?episodeId=${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, { timeout: 8000 });
  if (!resp.data?.sources?.length) throw new Error('No sources from Zoro');
  return normalizeSources(resp.data, episodeId);
};

// ─── Try AnimeKai direct scrape ───────────────────────────────────────────────
// Attempts to hit the AnimeKai Ajax API. Will fail if they add Cloudflare protection.
const tryAnimeKai = async (episodeId) => {
  // AnimeKai uses token-based ajax endpoints. We try their public API.
  const url = `${ANIMEKAI_BASE}/ajax/episode/list/${encodeURIComponent(episodeId)}`;
  const resp = await axios.get(url, {
    timeout: 8000,
    headers: {
      Referer:    ANIMEKAI_BASE,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    }
  });
  const html = resp.data?.html || resp.data;
  if (!html) throw new Error('AnimeKai returned empty response');

  // Minimal .m3u8 URL extraction from HTML blob (regex-based, fragile by design)
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
//
// Priority cascade:
//   1. Gogoanime via Consumet (most reliable, real HLS)
//   2. Zoro/Aniwatch via Consumet
//   3. AnimeKai direct API scrape
//   4. Static HLS fallback (always works, plays Mux test content)
// ─────────────────────────────────────────────────────────────────────────────
const getLiveStreamSources = async (req, res) => {
  // Support both route param styles: /stream/:id and the legacy :episodeId
  const rawId = req.params.id || req.params.episodeId || '';

  if (!rawId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Episode ID is required. Pass it as /stream/:id',
    });
  }

  // ── Normalize the ID ────────────────────────────────────────────────────────
  // KIZORA may pass compound IDs like "21-ep-3" or raw strings like "one-piece-episode-1107"
  // We strip the KIZORA compound prefix so the provider receives a clean slug.
  const compoundMatch = rawId.match(/^(\d+)-ep-(\d+)$/);
  const animeId    = compoundMatch ? compoundMatch[1] : rawId;
  const episodeNum = compoundMatch ? parseInt(compoundMatch[2], 10) : 1;

  console.log(`🎬 [STREAM] Resolving: rawId="${rawId}" → animeId="${animeId}", ep=${episodeNum}`);

  // ── Build provider-specific episode slugs ──────────────────────────────────
  // For Gogoanime we need a title slug — use animeId as-is for numeric MAL IDs,
  // since numeric IDs map to nothing on Gogoanime; in that case skip to Zoro.
  const isNumericId      = /^\d+$/.test(animeId);
  const gogoEpisodeSlug  = isNumericId ? null : `${animeId}-episode-${episodeNum}`;
  const zoroEpisodeId    = rawId; // Zoro accepts both forms

  const errors = [];

  // ── 1. Gogoanime (skip for numeric MAL IDs) ────────────────────────────────
  if (gogoEpisodeSlug) {
    try {
      const result = await tryConsumetGogoanime(gogoEpisodeSlug);
      if (result.sources.length > 0) {
        console.log(`✅ [STREAM] Gogoanime resolved ${result.sources.length} source(s) for ${rawId}`);
        return res.status(200).json(result);
      }
    } catch (e) {
      errors.push(`Gogoanime: ${e.message}`);
      console.warn(`⚠️ [STREAM] Gogoanime failed for "${gogoEpisodeSlug}": ${e.message}`);
    }
  }

  // ── 2. Zoro / Aniwatch ─────────────────────────────────────────────────────
  try {
    const result = await tryConsumetZoro(zoroEpisodeId);
    if (result.sources.length > 0) {
      console.log(`✅ [STREAM] Zoro resolved ${result.sources.length} source(s) for ${rawId}`);
      return res.status(200).json(result);
    }
  } catch (e) {
    errors.push(`Zoro: ${e.message}`);
    console.warn(`⚠️ [STREAM] Zoro failed for "${zoroEpisodeId}": ${e.message}`);
  }

  // ── 3. AnimeKai direct scrape ──────────────────────────────────────────────
  try {
    const result = await tryAnimeKai(animeId);
    if (result.url) {
      console.log(`✅ [STREAM] AnimeKai resolved stream for ${rawId}`);
      return res.status(200).json(result);
    }
  } catch (e) {
    errors.push(`AnimeKai: ${e.message}`);
    console.warn(`⚠️ [STREAM] AnimeKai failed for "${animeId}": ${e.message}`);
  }

  // ── 4. Static HLS fallback (always succeeds) ───────────────────────────────
  console.log(`⚡ [STREAM] All providers failed for "${rawId}". Serving static fallback HLS.`);
  console.log(`   Errors: ${errors.join(' | ')}`);

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
    errors,
  });
};

module.exports = { getLiveStreamSources };
