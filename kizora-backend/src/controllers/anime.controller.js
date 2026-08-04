const axios = require('axios');
const Anime = require('../models/Anime');
const Episode = require('../models/Episode');

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

/**
 * Controller: Get Anime Catalog (DB First, API Fallback)
 */
const getAnimeCatalog = async (req, res) => {
  try {
    let catalog = await Anime.find().sort({ createdAt: -1 }).limit(30);

    // Cache Miss: Fetch from Jikan API and save to DB
    if (!catalog || catalog.length === 0) {
      console.log('⚡ [CACHE MISS] Fetching fresh catalog from external provider...');
      const apiRes = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=20`);
      const rawData = apiRes.data?.data || [];

      const docs = [];
      for (const item of rawData) {
        const slug = (item.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const animeObj = {
          title: item.title_english || item.title,
          slug: slug,
          synopsis: item.synopsis || '',
          coverImage: item.images?.jpg?.large_image_url || '',
          bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || '',
          genres: item.genres ? item.genres.map(g => g.name) : ['Action'],
          totalEpisodes: item.episodes || 24,
          status: item.status === 'Currently Airing' ? 'Ongoing' : 'Completed',
          releaseYear: item.year || 2024
        };

        const saved = await Anime.findOneAndUpdate(
          { slug: animeObj.slug },
          animeObj,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        docs.push(saved);
      }
      catalog = docs;
    } else {
      console.log(`⚡ [CACHE HIT] Serving ${catalog.length} anime directly from MongoDB.`);
    }

    return res.status(200).json(catalog);
  } catch (error) {
    console.error(`Error in getAnimeCatalog: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching anime catalog' });
  }
};

/**
 * Controller: Get Single Anime Details (DB First, On-Demand Cache)
 */
const getAnimeDetails = async (req, res) => {
  try {
    const { animeId } = req.params;

    // Check MongoDB by ID or Slug
    let anime = null;
    if (animeId.match(/^[0-9a-fA-F]{24}$/)) {
      anime = await Anime.findById(animeId);
    } else {
      anime = await Anime.findOne({ slug: animeId });
    }

    // Cache Hit
    if (anime) {
      console.log(`⚡ [CACHE HIT] Serving anime detail for "${anime.title}" from MongoDB.`);
      return res.status(200).json(anime);
    }

    // Cache Miss: Fetch from Jikan API and save to DB
    console.log(`⚡ [CACHE MISS] Fetching on-demand anime info for ID/Slug: ${animeId}`);
    const apiRes = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}`);
    const item = apiRes.data?.data;

    if (!item) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    const slug = (item.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newAnimeData = {
      title: item.title_english || item.title,
      slug: slug,
      synopsis: item.synopsis || '',
      coverImage: item.images?.jpg?.large_image_url || '',
      bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || '',
      genres: item.genres ? item.genres.map(g => g.name) : ['Action'],
      totalEpisodes: item.episodes || 24,
      status: item.status === 'Currently Airing' ? 'Ongoing' : 'Completed',
      releaseYear: item.year || 2024
    };

    const newAnime = await Anime.findOneAndUpdate(
      { slug: newAnimeData.slug },
      newAnimeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(newAnime);
  } catch (error) {
    console.error(`Error in getAnimeDetails: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching anime details' });
  }
};

/**
 * Controller: Get Anime Episodes (DB First, On-Demand Cache)
 */
const getAnimeEpisodes = async (req, res) => {
  try {
    const { animeId } = req.params;

    // Check DB for existing episodes
    let episodes = await Episode.find({ animeId: animeId }).sort({ episodeNumber: 1 });

    if (episodes && episodes.length > 0) {
      console.log(`⚡ [CACHE HIT] Serving ${episodes.length} episodes for animeId ${animeId} from MongoDB.`);
      return res.status(200).json(episodes);
    }

    // Cache Miss: Fetch episode list and populate DB
    console.log(`⚡ [CACHE MISS] Fetching on-demand episodes for animeId ${animeId}`);
    let apiEps = [];
    try {
      const apiRes = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}/episodes`);
      apiEps = apiRes.data?.data || [];
    } catch (e) {
      console.warn('External episodes API rate-limited or unavailable, generating fallback list.');
    }

    if (apiEps.length === 0) {
      apiEps = Array.from({ length: 12 }, (_, i) => ({
        mal_id: i + 1,
        title: `Episode ${i + 1}`
      }));
    }

    const docs = [];
    for (const ep of apiEps) {
      const epNum = ep.mal_id || 1;
      const epDoc = await Episode.findOneAndUpdate(
        { animeId: animeId, episodeNumber: epNum },
        {
          animeId: animeId,
          episodeNumber: epNum,
          title: ep.title || `Episode ${epNum}`,
          videoUrl: `http://localhost:5000/api/stream/${animeId}-ep-${epNum}`,
          thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
          duration: 1440
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      docs.push(epDoc);
    }

    return res.status(200).json(docs);
  } catch (error) {
    console.error(`Error in getAnimeEpisodes: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching episodes' });
  }
};

module.exports = {
  getAnimeCatalog,
  getAnimeDetails,
  getAnimeEpisodes
};
