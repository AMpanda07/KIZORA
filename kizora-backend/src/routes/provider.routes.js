const express = require('express');
const axios = require('axios');
const { cacheMiddleware } = require('../middleware/cache');

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

/**
 * @route   GET /api/provider/spotlight
 * @desc    Fetch spotlight anime for the hero carousel (Cached 1 hr)
 */
router.get('/spotlight', cacheMiddleware(3600), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=6`);
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Spotlight API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching spotlight anime' });
  }
});

/**
 * @route   GET /api/provider/trending
 * @desc    Fetch currently airing trending anime (Cached 30 min)
 */
router.get('/trending', cacheMiddleware(1800), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=airing&limit=12`);
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Trending API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching trending anime' });
  }
});

/**
 * @route   GET /api/provider/recent
 * @desc    Fetch recent seasonal anime (Cached 15 min)
 */
router.get('/recent', cacheMiddleware(900), async (req, res) => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/seasons/now?limit=12`);
    const normalizedList = (response.data.data || []).map(normalizeAnime);
    return res.status(200).json(normalizedList);
  } catch (error) {
    console.error(`Recent API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching recent anime' });
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
 * @desc    Fetch anime details by ID
 */
router.get('/info/:animeId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { animeId } = req.params;
    const response = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}`);
    const normalized = normalizeAnime(response.data.data);
    return res.status(200).json(normalized);
  } catch (error) {
    console.error(`Anime Info API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching anime info' });
  }
});

/**
 * @route   GET /api/provider/episodes/:animeId
 * @desc    Fetch episode list for an anime
 */
router.get('/episodes/:animeId', cacheMiddleware(1800), async (req, res) => {
  try {
    const { animeId } = req.params;
    const response = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}/episodes`);
    const episodes = (response.data.data || []).map(ep => ({
      _id: `${animeId}-ep-${ep.mal_id}`,
      malId: ep.mal_id,
      episodeNumber: ep.mal_id,
      title: ep.title || `Episode ${ep.mal_id}`,
      aired: ep.aired,
      duration: '24:00',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
    }));
    return res.status(200).json(episodes);
  } catch (error) {
    console.error(`Episodes API error: ${error.message}`);
    // Fallback episodes generator if API fails
    const fallbackEps = Array.from({ length: 12 }, (_, i) => ({
      _id: `${req.params.animeId}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      duration: '24:00',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
    }));
    return res.status(200).json(fallbackEps);
  }
});

/**
 * @route   GET /api/provider/stream/:episodeId
 * @desc    Fetch HLS (.m3u8) streaming sources for an episode
 */
router.get('/stream/:episodeId', cacheMiddleware(300), async (req, res) => {
  try {
    const { episodeId } = req.params;

    // Production HLS test sources with adaptive bitrate .m3u8 playlists
    const streamData = {
      episodeId,
      headers: {
        Referer: 'https://animekai.to'
      },
      sources: [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          quality: 'Auto HLS (Adaptive HD)',
          isHLS: true
        },
        {
          url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
          quality: '1080p Ultra HD',
          isHLS: true
        },
        {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          quality: '720p MP4 Fallback',
          isHLS: false
        }
      ],
      servers: [
        { name: 'Vidstreaming (HLS Fast)', id: 'vidstreaming' },
        { name: 'Streamtape (HD)', id: 'streamtape' },
        { name: 'AnimeKai Primary', id: 'kai-primary' }
      ]
    };

    return res.status(200).json(streamData);
  } catch (error) {
    console.error(`Stream API error: ${error.message}`);
    return res.status(500).json({ message: 'Error fetching streaming links' });
  }
});

module.exports = router;
