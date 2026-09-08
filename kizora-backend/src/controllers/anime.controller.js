const axios = require('axios');
const Anime = require('../models/Anime');
const Episode = require('../models/Episode');

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// ─── Static fallback catalog (used when Jikan & MongoDB are both unavailable) ──
const STATIC_CATALOG_FALLBACK = [
  { _id: '21', malId: 21, title: 'One Piece', synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure in the world.', coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', genres: ['Action', 'Adventure', 'Comedy'], totalEpisodes: 1122, status: 'Ongoing', releaseYear: 1999, score: 8.7 },
  { _id: '16498', malId: 16498, title: 'Attack on Titan', synopsis: 'A young boy becomes a soldier to fight the giant humanoid Titans threatening humanity.', coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', genres: ['Action', 'Drama', 'Fantasy'], totalEpisodes: 87, status: 'Completed', releaseYear: 2013, score: 9.0 },
  { _id: '5114', malId: 5114, title: 'Fullmetal Alchemist: Brotherhood', synopsis: 'Two brothers search for a Philosopher\'s Stone after a failed attempt to revive their deceased mother.', coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', genres: ['Action', 'Adventure', 'Drama'], totalEpisodes: 64, status: 'Completed', releaseYear: 2009, score: 9.1 },
  { _id: '1535', malId: 1535, title: 'Death Note', synopsis: 'A student who discovers a supernatural notebook uses it to cleanse the world of criminals.', coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', genres: ['Mystery', 'Supernatural', 'Thriller'], totalEpisodes: 37, status: 'Completed', releaseYear: 2006, score: 8.6 },
  { _id: '11061', malId: 11061, title: 'Hunter x Hunter (2011)', synopsis: 'Gon Freecss aspires to become a Hunter capable of greatness and seeks out his missing father.', coverImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', genres: ['Action', 'Adventure', 'Fantasy'], totalEpisodes: 148, status: 'Completed', releaseYear: 2011, score: 9.0 },
  { _id: '38000', malId: 38000, title: 'Demon Slayer', synopsis: 'A young boy becomes a demon slayer to cure his sister who was turned into a demon.', coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', genres: ['Action', 'Fantasy', 'Historical'], totalEpisodes: 26, status: 'Completed', releaseYear: 2019, score: 8.7 },
  { _id: '20', malId: 20, title: 'Naruto', synopsis: 'A young ninja seeks recognition from his peers and dreams of becoming the Hokage of his village.', coverImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', genres: ['Action', 'Adventure', 'Martial Arts'], totalEpisodes: 220, status: 'Completed', releaseYear: 2002, score: 8.4 },
  { _id: '30276', malId: 30276, title: 'One Punch Man', synopsis: 'Saitama is a hero who can defeat any opponent with a single punch but seeks a worthy challenge.', coverImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', genres: ['Action', 'Comedy', 'Sci-Fi'], totalEpisodes: 12, status: 'Completed', releaseYear: 2015, score: 8.8 }
];

/**
 * Controller: Get Anime Catalog (DB First, API Fallback)
 */
const getAnimeCatalog = async (req, res) => {
  try {
    let catalog = await Anime.find().sort({ createdAt: -1 }).limit(30);

    // Cache Miss: Fetch from Jikan API and save to DB
    if (!catalog || catalog.length === 0) {
      console.log('⚡ [CACHE MISS] Fetching fresh catalog from external provider...');
      const apiRes = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=20`, { timeout: 8000 });
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
    return res.status(500).json({ error: 'Catalog temporarily unavailable', message: error.message });
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
      console.warn('External episodes API rate-limited or unavailable.');
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
          videoUrl: `/api/provider/stream/${animeId}/${epNum}`,
          thumbnail: null,
          duration: null
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
