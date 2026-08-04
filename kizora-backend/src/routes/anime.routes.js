const express = require('express');
const {
  getAnimeCatalog,
  getAnimeDetails,
  getAnimeEpisodes
} = require('../controllers/anime.controller');
const { getLiveStreamSources } = require('../controllers/stream.controller');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

/**
 * @route   GET /api/anime
 * @desc    Fetch anime catalog (MongoDB first, on-demand sync)
 */
router.get('/', cacheMiddleware(600), getAnimeCatalog);

/**
 * @route   GET /api/anime/:animeId
 * @desc    Fetch single anime details (MongoDB first, on-demand sync)
 */
router.get('/:animeId', cacheMiddleware(1800), getAnimeDetails);

/**
 * @route   GET /api/anime/:animeId/episodes
 * @desc    Fetch episodes for anime (MongoDB first, on-demand sync)
 */
router.get('/:animeId/episodes', cacheMiddleware(1800), getAnimeEpisodes);

/**
 * @route   GET /api/stream/:episodeId
 * @desc    Live HLS video stream resolver (Never persisted to DB)
 */
router.get('/stream/:episodeId', getLiveStreamSources);

module.exports = router;
