import axios from 'axios';

// VITE_API_URL must be set in Vercel dashboard ΓåÆ Environment Variables
// Local dev: create kizora-frontend/.env.local with VITE_API_URL=http://localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Normalizes any anime object to the standard KIZORA Anime interface
 */
export const normalizeAnime = (item) => {
  if (!item) return null;
  const id = String(item._id || item.malId || item.mal_id || item.id || '');
  return {
    _id: id,
    malId: item.malId || item.mal_id || parseInt(id, 10) || null,
    title: item.title || item.title_english || item.name || 'Untitled Anime',
    alternativeTitles: item.synonyms || item.alternativeTitles || (item.japaneseTitle ? [item.japaneseTitle] : []),
    japaneseTitle: item.japaneseTitle || item.title_japanese || '',
    synopsis: item.synopsis || item.description || 'No synopsis available for this title.',
    coverImage:
      item.coverImage ||
      item.poster ||
      item.images?.jpg?.large_image_url ||
      item.images?.jpg?.image_url ||
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600',
    bannerImage:
      item.bannerImage ||
      item.banner ||
      item.trailer?.images?.maximum_image_url ||
      item.images?.jpg?.large_image_url ||
      item.coverImage ||
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600',
    genres: Array.isArray(item.genres)
      ? item.genres.map((g) => (typeof g === 'string' ? g : g.name || ''))
      : ['Action', 'Fantasy'],
    totalEpisodes: item.totalEpisodes || item.episodes || null,
    status: item.status || 'Ongoing',
    releaseYear: item.releaseYear || item.year || 2024,
    score: item.score ? Number(item.score).toFixed(1) : null,
    rating: item.rating || 'PG-13',
    type: item.type || 'TV',
    duration: item.duration || null,
  };
};

/**
 * Fetch trending/airing anime catalog from our backend provider route.
 */
export const fetchTrendingAnime = async () => {
  try {
    const response = await API.get('/provider/trending');
    if (response.data && response.data.length > 0) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] Trending fetch failed:', err.message);
  }
  return [];
};

/**
 * Fetch spotlight/hero anime for featured banner
 */
export const fetchSpotlight = async () => {
  try {
    const response = await API.get('/provider/spotlight');
    if (response.data && response.data.length > 0) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] Spotlight fetch failed:', err.message);
  }
  return [];
};

/**
 * Fetch recent anime releases
 */
export const fetchRecent = async () => {
  try {
    const response = await API.get('/provider/recent');
    if (response.data && response.data.length > 0) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] Recent fetch failed:', err.message);
  }
  return [];
};

/**
 * Fetch available genres
 */
export const fetchGenres = async () => {
  try {
    const response = await API.get('/provider/genres');
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn('[API] Genres fetch failed:', err.message);
  }
  return [];
};

/**
 * Search anime with text query, genre, or type
 */
export const fetchSearchResults = async (query, genre, type) => {
  if (!query && !genre && !type) return [];
  try {
    const params = {};
    if (query) params.q = query;
    if (genre) params.genre = genre;
    if (type) params.type = type;

    const response = await API.get('/provider/search', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] Search error:', err.message);
  }
  return [];
};

/**
 * Fetch anime catalogue with filtering and pagination
 */
export const fetchAnimeList = async ({ q, genre, type, page = 1, limit = 24 }) => {
  if (q || genre || type) {
    const results = await fetchSearchResults(q, genre, type);
    return {
      data: results,
      page,
      hasMore: false,
    };
  }

  const response = await API.get('/provider/trending');
  if (response.data && response.data.length > 0) {
    return {
      data: response.data.map(normalizeAnime),
      page,
      hasMore: false,
    };
  }

  return {
    data: [],
    page: 1,
    hasMore: false,
  };
};

/**
 * Fetch anime detail by ID from provider route.
 */
export const fetchAnimeInfo = async (animeId) => {
  const response = await API.get(`/provider/info/${animeId}`);
  return normalizeAnime(response.data);
};

/**
 * Fetch episodes for a given anime ID.
 */
export const fetchEpisodes = async (animeId) => {
  const response = await API.get(`/provider/episodes/${animeId}`);
  return response.data;
};

/**
 * Lazy fetch stream sources for a specific anime ID and episode number.
 * Only resolves the requested episode without fetching all other episodes.
 */
export const fetchEpisodeStream = async (animeId, episodeNumber, signal) => {
  const epNum = episodeNumber || 1;
  const response = await API.get(`/provider/stream/${animeId}/${epNum}`, { signal });
  return response.data;
};

/**
 * Invalidate cached stream on playback error
 */
export const invalidateEpisodeStream = async (animeId, episodeNumber) => {
  try {
    await API.delete(`/provider/stream/${animeId}/${episodeNumber}`);
  } catch (err) {
    console.warn('[API] Stream cache invalidation failed:', err.message);
  }
};

/**
 * Fetch stream sources for a given episode ID (e.g. "21-ep-1").
 */
export const fetchStreamSources = async (episodeId, signal) => {
  const response = await API.get(`/provider/stream/${episodeId}`, { signal });
  return response.data;
};

/**
 * Fetch release schedule by day of week
 */
export const fetchSchedule = async (day) => {
  try {
    const response = await API.get('/provider/schedule', { params: day ? { day } : {} });
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((item) => ({
        ...normalizeAnime(item),
        airingTime: item.airingTime || 'TBA',
        airingDay: item.airingDay || day || 'Unknown',
        broadcastString: item.broadcastString || '',
      }));
    }
  } catch (err) {
    console.warn('[API] Schedule fetch failed:', err.message);
  }
  return [];
};

export default API;
