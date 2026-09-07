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
    duration: item.duration || '24 min',
  };
};

/**
 * Fetch trending/airing anime catalog from our backend provider route.
 * Falls back to a static list if the backend is unavailable.
 */
export const fetchTrendingAnime = async () => {
  try {
    const response = await API.get('/provider/trending');
    if (response.data && response.data.length > 0) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] Trending fetch failed, trying fallback catalog:', err.message);
  }

  // Second attempt: try the local MongoDB catalog
  try {
    const response = await API.get('/anime');
    if (response.data && response.data.length > 0) {
      return response.data.map(normalizeAnime);
    }
  } catch (err) {
    console.warn('[API] MongoDB catalog fetch also failed:', err.message);
  }

  // Static fallback data so the UI always renders something
  return FALLBACK_CATALOG.map(normalizeAnime);
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
  return FALLBACK_CATALOG.slice(0, 5).map(normalizeAnime);
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
  return FALLBACK_CATALOG.slice(4, 10).map(normalizeAnime);
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
  return [
    { id: 1, name: 'Action', count: 4800 },
    { id: 2, name: 'Adventure', count: 3900 },
    { id: 4, name: 'Comedy', count: 6800 },
    { id: 8, name: 'Drama', count: 3100 },
    { id: 10, name: 'Fantasy', count: 4200 },
    { id: 22, name: 'Romance', count: 2100 },
    { id: 24, name: 'Sci-Fi', count: 2800 },
    { id: 41, name: 'Suspense', count: 980 },
    { id: 36, name: 'Slice of Life', count: 1800 },
    { id: 30, name: 'Sports', count: 1100 },
    { id: 7, name: 'Mystery', count: 1400 },
    { id: 40, name: 'Psychological', count: 850 },
    { id: 14, name: 'Horror', count: 720 },
    { id: 37, name: 'Supernatural', count: 2400 },
  ];
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
  // Client-side fallback search across static catalog if backend fails
  if (query) {
    const qLower = query.toLowerCase();
    return FALLBACK_CATALOG.filter(
      (a) =>
        a.title.toLowerCase().includes(qLower) ||
        (a.genres && a.genres.some((g) => g.toLowerCase().includes(qLower)))
    ).map(normalizeAnime);
  }
  return [];
};

/**
 * Fetch anime catalogue with filtering and pagination
 */
export const fetchAnimeList = async ({ q, genre, type, page = 1, limit = 24 }) => {
  try {
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
  } catch (err) {
    console.warn('[API] Catalogue fetch failed:', err.message);
  }

  return {
    data: FALLBACK_CATALOG.map(normalizeAnime),
    page: 1,
    hasMore: false,
  };
};

/**
 * Fetch anime detail by ID from provider route.
 */
export const fetchAnimeInfo = async (animeId) => {
  try {
    const response = await API.get(`/provider/info/${animeId}`);
    return normalizeAnime(response.data);
  } catch (err) {
    console.warn('[API] Anime info fetch failed, finding in fallback:', err.message);
    const found = FALLBACK_CATALOG.find((a) => String(a._id) === String(animeId) || String(a.malId) === String(animeId));
    if (found) return normalizeAnime(found);
    throw err;
  }
};

/**
 * Fetch episodes for a given anime ID.
 */
export const fetchEpisodes = async (animeId) => {
  try {
    const response = await API.get(`/provider/episodes/${animeId}`);
    return response.data;
  } catch (err) {
    console.warn('[API] Episodes fetch failed:', err.message);
    // If backend episodes route fails, generate basic episode placeholders based on known count
    const info = FALLBACK_CATALOG.find((a) => String(a._id) === String(animeId));
    const count = info?.totalEpisodes || 12;
    return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      _id: `${animeId}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      thumbnail: info?.coverImage || '',
      duration: '24:00',
    }));
  }
};

/**
 * Lazy fetch stream sources for a specific anime ID and episode number.
 * Only resolves the requested episode without fetching all other episodes.
 */
export const fetchEpisodeStream = async (animeId, episodeNumber) => {
  const epNum = episodeNumber || 1;
  const response = await API.get(`/provider/stream/${animeId}/${epNum}`);
  return response.data;
};

/**
 * Fetch stream sources for a given episode ID (e.g. "21-ep-1").
 */
export const fetchStreamSources = async (episodeId) => {
  const response = await API.get(`/provider/stream/${episodeId}`);
  return response.data;
};

export default API;

// ΓöÇΓöÇΓöÇ Static fallback catalog ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const FALLBACK_CATALOG = [
  {
    _id: '21',
    malId: 21,
    title: 'One Piece',
    synopsis:
      'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure in the world, known as the "One Piece," in order to become the next Pirate King.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    genres: ['Action', 'Adventure', 'Comedy'],
    totalEpisodes: 1122,
    status: 'Ongoing',
    releaseYear: 1999,
    score: 8.7,
  },
  {
    _id: '16498',
    malId: 16498,
    title: 'Attack on Titan',
    synopsis:
      'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
    genres: ['Action', 'Drama', 'Fantasy'],
    totalEpisodes: 87,
    status: 'Completed',
    releaseYear: 2013,
    score: 9.0,
  },
  {
    _id: '5114',
    malId: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    synopsis:
      "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes wrong, leaving them in damaged physical forms.",
    coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    genres: ['Action', 'Adventure', 'Drama'],
    totalEpisodes: 64,
    status: 'Completed',
    releaseYear: 2009,
    score: 9.1,
  },
  {
    _id: '1535',
    malId: 1535,
    title: 'Death Note',
    synopsis:
      'A high school student discovers a supernatural notebook that allows him to kill anyone whose name he writes in it and decides to use it to cleanse the world of criminals.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    genres: ['Mystery', 'Supernatural', 'Thriller'],
    totalEpisodes: 37,
    status: 'Completed',
    releaseYear: 2006,
    score: 8.6,
  },
  {
    _id: '11061',
    malId: 11061,
    title: 'Hunter x Hunter (2011)',
    synopsis:
      'Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks out his missing father.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg',
    genres: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 148,
    status: 'Completed',
    releaseYear: 2011,
    score: 9.0,
  },
  {
    _id: '38000',
    malId: 38000,
    title: 'Demon Slayer',
    synopsis:
      'A young boy becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon, joining the Demon Slayer Corps to cure her.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    genres: ['Action', 'Fantasy', 'Historical'],
    totalEpisodes: 26,
    status: 'Completed',
    releaseYear: 2019,
    score: 8.7,
  },
  {
    _id: '20',
    malId: 20,
    title: 'Naruto',
    synopsis:
      'A young ninja, Naruto Uzumaki, seeks recognition from his peers and dreams of becoming the Hokage, the leader of his village.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
    genres: ['Action', 'Adventure', 'Martial Arts'],
    totalEpisodes: 220,
    status: 'Completed',
    releaseYear: 2002,
    score: 8.4,
  },
  {
    _id: '269',
    malId: 269,
    title: 'Bleach',
    synopsis:
      'High school student Ichigo Kurosaki becomes a soul reaper and vows to protect the innocent and vanquish the evil that threatens his world.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg',
    genres: ['Action', 'Adventure', 'Supernatural'],
    totalEpisodes: 366,
    status: 'Completed',
    releaseYear: 2004,
    score: 8.2,
  },
  {
    _id: '35760',
    malId: 35760,
    title: 'My Hero Academia',
    synopsis:
      "In a world where most people have superpowers, a boy born without them strives to become the world's greatest hero by inheriting the power of the greatest hero.",
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',
    genres: ['Action', 'Comedy', 'School'],
    totalEpisodes: 138,
    status: 'Completed',
    releaseYear: 2016,
    score: 8.0,
  },
  {
    _id: '1',
    malId: 1,
    title: 'Cowboy Bebop',
    synopsis:
      "A ragtag crew of bounty hunters chases down the galaxy's most dangerous criminals. They'll save the world... for the right price.",
    coverImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',
    genres: ['Action', 'Sci-Fi', 'Drama'],
    totalEpisodes: 26,
    status: 'Completed',
    releaseYear: 1998,
    score: 8.8,
  },
  {
    _id: '30276',
    malId: 30276,
    title: 'One Punch Man',
    synopsis:
      'Saitama is a hero who can defeat any opponent with a single punch, but seeks to find a worthy opponent and the thrill of a good battle.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    totalEpisodes: 12,
    status: 'Completed',
    releaseYear: 2015,
    score: 8.8,
  },
  {
    _id: '37779',
    malId: 37779,
    title: 'Sword Art Online',
    synopsis:
      'In 2022, a virtual reality massive multiplayer online role-playing game (VRMMORPG) called Sword Art Online is released. Players discover they cannot log out.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg',
    genres: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 25,
    status: 'Completed',
    releaseYear: 2012,
    score: 7.2,
  },
];
