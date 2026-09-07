const express = require('express');
const axios = require('axios');
const { cacheMiddleware } = require('../middleware/cache');
const { getTitleWithFallback, getAnimeInfoWithFallback } = require('../utils/metadata');
const { getLiveStreamSources } = require('../controllers/stream.controller');

const router = express.Router();
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Static fallback catalog — used when Jikan API is rate-limited or unavailable
const STATIC_FALLBACK = [
  { _id: '21', malId: 21, title: 'One Piece', synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure in the world.', coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', genres: ['Action', 'Adventure', 'Comedy'], totalEpisodes: 1122, status: 'Ongoing', releaseYear: 1999, score: 8.7 },
  { _id: '16498', malId: 16498, title: 'Attack on Titan', synopsis: 'After his hometown is destroyed and his mother killed, young Eren vows to cleanse the earth of Titans.', coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', genres: ['Action', 'Drama', 'Fantasy'], totalEpisodes: 87, status: 'Completed', releaseYear: 2013, score: 9.0 },
  { _id: '5114', malId: 5114, title: 'Fullmetal Alchemist: Brotherhood', synopsis: 'Two brothers search for a Philosopher\'s Stone after a failed alchemy attempt.', coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', genres: ['Action', 'Adventure', 'Drama'], totalEpisodes: 64, status: 'Completed', releaseYear: 2009, score: 9.1 },
  { _id: '1535', malId: 1535, title: 'Death Note', synopsis: 'A student uses a supernatural notebook to rid the world of criminals.', coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', genres: ['Mystery', 'Supernatural', 'Thriller'], totalEpisodes: 37, status: 'Completed', releaseYear: 2006, score: 8.6 },
  { _id: '11061', malId: 11061, title: 'Hunter x Hunter (2011)', synopsis: 'Gon aspires to become a Hunter and seeks out his missing father across dangerous lands.', coverImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', genres: ['Action', 'Adventure', 'Fantasy'], totalEpisodes: 148, status: 'Completed', releaseYear: 2011, score: 9.0 },
  { _id: '38000', malId: 38000, title: 'Demon Slayer', synopsis: 'A young boy becomes a demon slayer to cure his sister who was turned into a demon.', coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', genres: ['Action', 'Fantasy', 'Historical'], totalEpisodes: 26, status: 'Completed', releaseYear: 2019, score: 8.7 },
  { _id: '20', malId: 20, title: 'Naruto', synopsis: 'A young ninja seeks recognition from his peers and dreams of becoming the Hokage.', coverImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', genres: ['Action', 'Adventure', 'Martial Arts'], totalEpisodes: 220, status: 'Completed', releaseYear: 2002, score: 8.4 },
  { _id: '30276', malId: 30276, title: 'One Punch Man', synopsis: 'Saitama is a hero who defeats any opponent with a single punch but seeks a worthy rival.', coverImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', genres: ['Action', 'Comedy', 'Sci-Fi'], totalEpisodes: 12, status: 'Completed', releaseYear: 2015, score: 8.8 },
  { _id: '269', malId: 269, title: 'Bleach', synopsis: 'Ichigo Kurosaki becomes a soul reaper and vows to protect the innocent and vanquish evil.', coverImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg', genres: ['Action', 'Adventure', 'Supernatural'], totalEpisodes: 366, status: 'Completed', releaseYear: 2004, score: 8.2 },
  { _id: '1', malId: 1, title: 'Cowboy Bebop', synopsis: 'A ragtag crew of bounty hunters chases the galaxy\'s most dangerous criminals.', coverImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg', genres: ['Action', 'Sci-Fi', 'Drama'], totalEpisodes: 26, status: 'Completed', releaseYear: 1998, score: 8.8 },
  { _id: '35760', malId: 35760, title: 'My Hero Academia', synopsis: 'A boy born without superpowers strives to become the world\'s greatest hero.', coverImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg', genres: ['Action', 'Comedy', 'School'], totalEpisodes: 138, status: 'Completed', releaseYear: 2016, score: 8.0 },
  { _id: '37779', malId: 37779, title: 'Sword Art Online', synopsis: 'Players of a virtual reality MMO discover they cannot log out and must clear all floors to escape.', coverImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg', genres: ['Action', 'Adventure', 'Fantasy'], totalEpisodes: 25, status: 'Completed', releaseYear: 2012, score: 7.2 }
];

// Helper to normalize Jikan anime objects into KIZORA schema
const normalizeAnime = (item) => {
  if (!item) return null;
  return {
    _id: item.mal_id ? item.mal_id.toString() : (item._id || '1'),
    malId: item.mal_id,
    title: item.title_english || item.title || 'Untitled Anime',
    japaneseTitle: item.title_japanese || item.title,
    slug: item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'anime',
    synopsis: item.synopsis || 'No synopsis available for this title.',
    coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    genres: item.genres ? item.genres.map(g => g.name) : ['Action', 'Fantasy'],
    totalEpisodes: item.episodes || 24,
    status: item.status === 'Currently Airing' ? 'Ongoing' : (item.status === 'Finished Airing' ? 'Completed' : 'Upcoming'),
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 2024),
    score: item.score || 8.5,
    rating: item.rating || 'PG-13',
    type: item.type || 'TV'
  };
};

// Route constants above...

/**
 * @route   GET /api/provider/spotlight
 * @desc    Fetch spotlight anime for the hero carousel (Cached 1 hr)
 */
router.get('/spotlight', cacheMiddleware(3600), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=6`, { timeout: 8000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Spotlight API error: ${error.message}`);
    return res.status(200).json(STATIC_FALLBACK.slice(0, 6));
  }
});

/**
 * @route   GET /api/provider/trending
 * @desc    Fetch currently airing trending anime (Cached 30 min)
 */
router.get('/trending', cacheMiddleware(1800), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=airing&limit=12`, { timeout: 8000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Trending API error: ${error.message}`);
    console.log('⚡ [STATIC FALLBACK] Jikan unavailable, serving static trending list.');
    return res.status(200).json(STATIC_FALLBACK);
  }
});

/**
 * @route   GET /api/provider/recent
 * @desc    Fetch recent seasonal anime (Cached 15 min)
 */
router.get('/recent', cacheMiddleware(900), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/seasons/now?limit=12`, { timeout: 8000 });
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Recent API error: ${error.message}`);
    return res.status(200).json(STATIC_FALLBACK);
  }
});

/**
 * @route   GET /api/provider/genres
 * @desc    Fetch genre list (Cached 24 hrs)
 */
router.get('/genres', cacheMiddleware(86400), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/genres/anime`);
    const genres = (response.data.data || []).map(g => ({
      id: g.mal_id,
      name: g.name,
      count: g.count
    }));
    return res.status(200).json(genres);
  } catch (error) {
    console.error(`Genres API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching genres' });
  }
});

/**
 * @route   GET /api/provider/search
 * @desc    Search anime by query, genre, or type
 */
router.get('/search', cacheMiddleware(300), async (req, res) => {
  try {
    const { q, genre, type } = req.query;
    let url = `${JIKAN_BASE_URL}/anime?limit=20`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (genre) url += `&genres=${genre}`;
    if (type) url += `&type=${type}`;

    const response = await axios.get(url);
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Search API error: ${error.message}`);
    return res.status(500).json({ message: 'Error searching anime' });
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
 * @route   GET /api/provider/episodes/:animeId
 * @desc    Fetch episode list for an anime using Jikan API
 */
router.get('/episodes/:animeId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { animeId } = req.params; // This is the AniList ID

    // 1. Get Anime info to resolve the MAL ID
    console.log(`[EPISODES] Step 1: Fetching info for ID: ${animeId}`);
    const info = await getAnimeInfoWithFallback(animeId);
    if (!info || !info.malId) {
      throw new Error(`Could not resolve MAL ID for ${animeId}`);
    }

    // 2. Fetch episodes from Jikan API using MAL ID
    console.log(`[EPISODES] Step 2: Fetching Jikan episodes for MAL ID: ${info.malId}`);
    const epsRes = await axios.get(`${JIKAN_BASE_URL}/anime/${info.malId}/episodes`, { timeout: 15000 });
    const rawEpisodes = epsRes.data?.data || [];

    // Jikan sometimes doesn't have episodes for movies/oneshots. Create a dummy Ep 1 if empty.
    if (rawEpisodes.length === 0) {
      console.log(`[EPISODES] No episodes found on Jikan, generating fallback Episode 1`);
      return res.status(200).json([{
        _id: `${animeId}-ep-1`,
        anilistId: animeId,
        providerEpisodeId: `${info.slug}-episode-1`,
        episodeNumber: 1,
        title: `Episode 1`,
        duration: '24:00',
        thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
      }]);
    }

    console.log(`[EPISODES] Fetched ${rawEpisodes.length} episodes for MAL ID ${info.malId}`);

    // 3. Map to our KIZORA schema
    const episodes = rawEpisodes.map(ep => ({
      _id: `${animeId}-ep-${ep.mal_id}`, // bind to AniList ID for frontend routing
      anilistId: animeId,
      providerEpisodeId: `${info.slug}-episode-${ep.mal_id}`, // Generate a friendly slug for the iframe proxy
      episodeNumber: ep.mal_id, // Jikan uses mal_id for episode number
      title: ep.title || `Episode ${ep.mal_id}`,
      duration: '24:00',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
    }));

    return res.status(200).json(episodes);
  } catch (error) {
    console.error(`[ERROR] Stage: episode-list-fetch | Reason: ${error.message}`);
    return res.status(500).json({ error: 'Unable to load episode list', message: error.message });
  }
});

/**
 * @route   GET /api/provider/stream/:episodeId
 * @desc    Fetch dynamic HLS (.m3u8) streaming sources via provider cascade:
 *          Consumet/Gogoanime → Consumet/Zoro → AnimeKai → static HLS fallback
 *          NOTE: Streams are NOT cached (5-min CDN tokens expire quickly).
 */
router.get('/stream/:episodeId', (req, res) => {
  // Re-map param name so controller receives req.params.id
  req.params.id = req.params.episodeId;
  return getLiveStreamSources(req, res);
});

module.exports = router;
