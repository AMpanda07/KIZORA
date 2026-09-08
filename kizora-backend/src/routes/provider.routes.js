const express = require('express');
const axios = require('axios');
const { cacheMiddleware } = require('../middleware/cache');
const { getTitleWithFallback, getAnimeInfoWithFallback } = require('../utils/metadata');
const { getLiveStreamSources, invalidateStreamCache } = require('../controllers/stream.controller');

const router = express.Router();
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Helper to normalize Jikan anime objects into KIZORA schema
const normalizeAnime = (item) => {
  if (!item) return null;
  return {
    _id: item.mal_id ? item.mal_id.toString() : (item._id || '1'),
    malId: item.mal_id,
    title: item.title_english || item.title || 'Untitled Anime',
    japaneseTitle: item.title_japanese || item.title,
    synopsis: item.synopsis || 'No synopsis available for this title.',
    coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    genres: item.genres ? item.genres.map(g => g.name) : ['Action', 'Fantasy'],
    synonyms: item.title_synonyms || [],
    totalEpisodes: item.episodes || null,
    status: item.status === 'Currently Airing' ? 'Ongoing' : (item.status === 'Finished Airing' ? 'Completed' : 'Upcoming'),
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 2024),
    score: item.score || null,
    rating: item.rating || 'PG-13',
    type: item.type || 'TV'
  };
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// AniList GraphQL catalog helper for high availability and zero rate-limit 500 errors
const fetchAniListCatalog = async (sort = 'POPULARITY_DESC', perPage = 12, search = null) => {
  const query = `
    query ($sort: [MediaSort], $perPage: Int, $search: String) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: $sort, search: $search) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            extraLarge
            large
          }
          bannerImage
          genres
          episodes
          status
          seasonYear
          averageScore
        }
      }
    }
  `;
  const vars = { perPage, sort: [sort] };
  if (search) vars.search = search;

  const res = await axios.post('https://graphql.anilist.co', { query, variables: vars }, {
    timeout: 6000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
      'Origin': 'https://anilist.co',
      'Referer': 'https://anilist.co/'
    }
  });

  const mediaList = res.data?.data?.Page?.media || [];
  return mediaList.map(item => ({
    _id: item.id.toString(),
    anilistId: item.id,
    malId: item.idMal || item.id,
    title: item.title.english || item.title.romaji || 'Untitled Anime',
    japaneseTitle: item.title.native || item.title.romaji,
    synopsis: item.description ? item.description.replace(/<[^>]*>?/gm, '') : 'No synopsis available.',
    coverImage: item.coverImage?.extraLarge || item.coverImage?.large,
    bannerImage: item.bannerImage || item.coverImage?.extraLarge,
    genres: item.genres || ['Action'],
    totalEpisodes: item.episodes || null,
    status: item.status === 'RELEASING' ? 'Ongoing' : (item.status === 'FINISHED' ? 'Completed' : 'Upcoming'),
    releaseYear: item.seasonYear || new Date().getFullYear(),
    score: item.averageScore ? item.averageScore / 10 : null,
    type: 'TV'
  }));
};

/**
 * @route   GET /api/provider/spotlight
 * @desc    Fetch spotlight anime for the hero carousel (Cached 1 hr)
 */
router.get('/spotlight', cacheMiddleware(3600), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=6`, { timeout: 4000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.warn(`Spotlight Jikan API failed (${error.message}), trying AniList fallback...`);
    try {
      const aniListCatalog = await fetchAniListCatalog('POPULARITY_DESC', 6);
      return res.status(200).json(aniListCatalog);
    } catch (fallbackError) {
      console.error(`Spotlight fallback error: ${fallbackError.message}`);
      return res.status(500).json({ error: 'Spotlight catalog temporarily unavailable', message: fallbackError.message });
    }
  }
});

/**
 * @route   GET /api/provider/trending
 * @desc    Fetch currently airing trending anime (Cached 30 min)
 */
router.get('/trending', cacheMiddleware(1800), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=airing&limit=12`, { timeout: 4000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.warn(`Trending Jikan API failed (${error.message}), trying AniList fallback...`);
    try {
      const aniListCatalog = await fetchAniListCatalog('TRENDING_DESC', 12);
      return res.status(200).json(aniListCatalog);
    } catch (fallbackError) {
      console.error(`Trending fallback error: ${fallbackError.message}`);
      return res.status(500).json({ error: 'Trending catalog temporarily unavailable', message: fallbackError.message });
    }
  }
});

/**
 * @route   GET /api/provider/recent
 * @desc    Fetch recent seasonal anime (Cached 15 min)
 */
router.get('/recent', cacheMiddleware(900), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/seasons/now?limit=12`, { timeout: 4000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.warn(`Recent Jikan API failed (${error.message}), trying AniList fallback...`);
    try {
      const aniListCatalog = await fetchAniListCatalog('START_DATE_DESC', 12);
      return res.status(200).json(aniListCatalog);
    } catch (fallbackError) {
      console.error(`Recent fallback error: ${fallbackError.message}`);
      return res.status(500).json({ error: 'Recent releases catalog temporarily unavailable', message: fallbackError.message });
    }
  }
});

/**
 * @route   GET /api/provider/schedule
 * @desc    Fetch weekly anime release schedule (Cached 1 hr)
 */
router.get('/schedule', cacheMiddleware(3600), async (req, res) => {
  try {
    const { day } = req.query;
    let url = `${JIKAN_BASE_URL}/schedules`;
    if (day) {
      url += `?filter=${encodeURIComponent(day.toLowerCase())}`;
    }
    const response = await axios.get(url, { timeout: 4000 });
    const normalizedList = (response.data.data || []).map(item => ({
      ...normalizeAnime(item),
      airingTime: item.broadcast?.time || 'TBA',
      airingDay: item.broadcast?.day || day || 'Unknown',
      broadcastString: item.broadcast?.string || ''
    }));
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.warn(`Schedule Jikan API failed (${error.message}), trying AniList fallback...`);
    try {
      const aniListCatalog = await fetchAniListCatalog('POPULARITY_DESC', 12);
      return res.status(200).json(aniListCatalog);
    } catch (fallbackError) {
      console.error(`Schedule fallback error: ${fallbackError.message}`);
      return res.status(500).json({ error: 'Schedule temporarily unavailable', message: fallbackError.message });
    }
  }
});

/**
 * @route   GET /api/provider/genres
 * @desc    Fetch genre list (Cached 24 hrs)
 */
router.get('/genres', cacheMiddleware(86400), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/genres/anime`, { timeout: 4000 });
    const genres = (response.data.data || []).map(g => ({
      id: g.mal_id,
      name: g.name,
      count: g.count
    }));
    return res.status(200).json(genres);
  } catch (error) {
    console.error(`Genres API error: ${error.message}`);
    const defaultGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];
    return res.status(200).json(defaultGenres.map((g, idx) => ({ id: idx + 1, name: g, count: 100 })));
  }
});

/**
 * @route   GET /api/provider/search
 * @desc    Search anime by query, genre, or type
 */
router.get('/search', cacheMiddleware(300), async (req, res) => {
  try {
    const { q, genre, type, page, limit, status, order_by, sort } = req.query;
    let url = `${JIKAN_BASE_URL}/anime?limit=${limit || 24}`;
    if (page) url += `&page=${page}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (genre) url += `&genres=${genre}`;
    if (type) url += `&type=${type}`;
    if (status) url += `&status=${status}`;
    if (order_by) url += `&order_by=${order_by}&sort=${sort || 'desc'}`;

    const response = await axios.get(url, { timeout: 4000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.warn(`Search Jikan API failed (${error.message}), trying AniList search fallback...`);
    try {
      const { q, limit } = req.query;
      const aniListResults = await fetchAniListCatalog('SEARCH_MATCH', limit || 24, q || null);
      return res.status(200).json(aniListResults);
    } catch (fallbackError) {
      console.error(`Search fallback error: ${fallbackError.message}`);
      return res.status(500).json({ message: 'Error searching anime' });
    }
  }
});

/**
 * @route   GET /api/provider/info/:animeId
 * @desc    Fetch anime details by ID (using AniList GraphQL)
 */
router.get('/info/:animeId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { animeId } = req.params;
    console.log(`[ANIME] Fetching info for ID: ${animeId}`);
    const normalized = await getAnimeInfoWithFallback(animeId);
    return res.status(200).json(normalized);
  } catch (error) {
    console.error(`[ERROR] Anime Info API error: ${error.message}`);
    return res.status(500).json({ error: 'Unable to load anime information', message: error.message });
  }
});

/**
 * @route   GET /api/provider/health
 * @desc    Get real-time health and priority status of all 5 anime providers
 */
router.get('/health', async (req, res) => {
  try {
    const { getProviderHealth } = require('../services/provider.service');
    const health = await getProviderHealth();
    return res.status(200).json(health);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route   GET /api/provider/test/:animeId/:episodeNumber
 * @desc    Development route: run diagnostic test across all 5 providers
 */
router.get('/test/:animeId/:episodeNumber', async (req, res) => {
  try {
    const { animeId, episodeNumber } = req.params;
    const epNum = parseInt(episodeNumber, 10) || 1;
    let info = await getAnimeInfoWithFallback(animeId).catch(() => null);
    if (!info || !info.title) {
      info = { title: `Anime ${animeId}`, japaneseTitle: '', synonyms: [] };
    }
    const { runProviderDiagnostic } = require('../services/provider.service');
    const diagnostic = await runProviderDiagnostic(animeId, epNum, info);
    return res.status(200).json(diagnostic);
  } catch (error) {
    return res.status(500).json({ error: 'Diagnostic test failed', message: error.message });
  }
});

/**
 * @route   GET /api/provider/episodes/:animeId
 * @desc    Fetch episode list dynamically resolved across the 5 providers
 */
router.get('/episodes/:animeId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { animeId } = req.params;
    console.log(`[EPISODES] Resolving episode list for ID: ${animeId}`);

    let info = await getAnimeInfoWithFallback(animeId).catch(() => null);
    if (!info || !info.title) {
      info = { title: `Anime ${animeId}`, japaneseTitle: '', synonyms: [], totalEpisodes: 24 };
    }

    const { resolveEpisodes } = require('../services/provider.service');
    const episodes = await resolveEpisodes(animeId, info);

    return res.status(200).json(episodes);
  } catch (error) {
    console.error(`[ERROR] Stage: episode-list-fetch | Reason: ${error.message}`);
    return res.status(500).json({ error: 'Unable to load episode list', message: error.message });
  }
});

/**
 * @route   GET /api/provider/stream/:animeId/:episodeNumber
 * @desc    Lazy single-episode stream resolution across 5-provider fallback cascade
 */
router.get('/stream/:animeId/:episodeNumber', (req, res) => {
  return getLiveStreamSources(req, res);
});

/**
 * @route   GET /api/provider/episode/:animeId/:episodeNumber
 * @desc    Alias for lazy single-episode resolution
 */
router.get('/episode/:animeId/:episodeNumber', (req, res) => {
  return getLiveStreamSources(req, res);
});

/**
 * @route   DELETE /api/provider/stream/:animeId/:episodeNumber
 * @desc    Invalidate stream cache for an episode (e.g., when player reports broken link)
 */
router.delete('/stream/:animeId/:episodeNumber', (req, res) => {
  return invalidateStreamCache(req, res);
});

module.exports = router;
