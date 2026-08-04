const express = require('express');
const Anime = require('../models/Anime');
const Episode = require('../models/Episode');

const router = express.Router();

/**
 * @route   GET /api/anime
 * @desc    Fetch all anime catalog entries
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const catalog = await Anime.find().sort({ createdAt: -1 });
    return res.status(200).json(catalog);
  } catch (error) {
    console.error(`Error fetching anime catalog: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching anime catalog' });
  }
});

/**
 * @route   GET /api/anime/:animeId
 * @desc    Fetch single anime by ID
 * @access  Public
 */
router.get('/:animeId', async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.animeId);
    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }
    return res.status(200).json(anime);
  } catch (error) {
    console.error(`Error fetching anime: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching anime details' });
  }
});

/**
 * @route   GET /api/anime/:animeId/episodes
 * @desc    Fetch all episodes for a specific anime
 * @access  Public
 */
router.get('/:animeId/episodes', async (req, res) => {
  try {
    const episodes = await Episode.find({ animeId: req.params.animeId }).sort({ episodeNumber: 1 });
    return res.status(200).json(episodes);
  } catch (error) {
    console.error(`Error fetching episodes: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching episodes' });
  }
});

/**
 * @route   GET /api/episodes/:episodeId
 * @desc    Fetch single episode details with populated anime data
 * @access  Public
 */
router.get('/episode-detail/:episodeId', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.episodeId).populate('animeId');
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }
    return res.status(200).json(episode);
  } catch (error) {
    console.error(`Error fetching episode detail: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching episode details' });
  }
});

module.exports = router;
