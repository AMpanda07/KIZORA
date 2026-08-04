const cron = require('node-cron');
const axios = require('axios');
const Anime = require('../models/Anime');

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

/**
 * Normalizes Jikan API object to Mongoose Anime Schema format
 */
const normalizeToSchema = (item) => {
  if (!item || !item.title) return null;
  const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  return {
    title: item.title_english || item.title,
    slug: slug,
    synopsis: item.synopsis || 'No synopsis available.',
    coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
    bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || '',
    genres: item.genres ? item.genres.map(g => g.name) : ['Action'],
    totalEpisodes: item.episodes || 24,
    status: item.status === 'Currently Airing' ? 'Ongoing' : (item.status === 'Finished Airing' ? 'Completed' : 'Upcoming'),
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 2024)
  };
};

/**
 * Core function to sync top anime to MongoDB
 */
const syncCatalog = async () => {
  console.log('🔄 [CRON JOB] Starting automated anime catalog sync...');
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=25`);
    const animeList = response.data?.data || [];

    let upsertedCount = 0;
    for (const rawItem of animeList) {
      const animeData = normalizeToSchema(rawItem);
      if (animeData) {
        await Anime.findOneAndUpdate(
          { slug: animeData.slug },
          animeData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upsertedCount++;
      }
    }

    console.log(`✅ [CRON JOB] Catalog sync complete! ${upsertedCount} anime upserted into MongoDB.`);
  } catch (error) {
    console.error(`❌ [CRON JOB] Error syncing anime catalog: ${error.message}`);
  }
};

/**
 * Initializes Cron Schedule & Initial Sync
 */
const initCatalogCron = () => {
  // Schedule to run every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', () => {
    syncCatalog();
  });

  // Run initial sync check on server boot if database has < 5 anime entries
  Anime.countDocuments().then(count => {
    if (count < 5) {
      console.log('📦 [DATABASE] Low entry count detected. Triggering initial catalog sync...');
      syncCatalog();
    }
  }).catch(err => console.error('Error checking catalog count:', err.message));
};

module.exports = { initCatalogCron, syncCatalog };
