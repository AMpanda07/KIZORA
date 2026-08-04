const cron = require('node-cron');
const axios = require('axios');
const Anime = require('../models/Anime');

const JIKAN_AIRING_URL = 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=25';

/**
 * Normalizes Jikan API response item to match Mongoose Anime model schema
 * @param {Object} item - Raw anime object from Jikan v4 API
 * @returns {Object} Normalized anime document schema object
 */
const normalizeAnime = (item) => {
  const title = item.title_english || item.title || 'Untitled Anime';
  const rawSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const slug = rawSlug || `anime-${item.mal_id}`;

  return {
    malId: item.mal_id,
    title: title,
    slug: slug,
    synopsis: item.synopsis || '',
    coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
    bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
    genres: item.genres ? item.genres.map(g => g.name) : ['Action'],
    totalEpisodes: item.episodes || 0,
    status: item.status === 'Currently Airing' ? 'Ongoing' : (item.status === 'Finished Airing' ? 'Completed' : 'Upcoming'),
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : new Date().getFullYear())
  };
};

/**
 * Fetches top airing anime from Jikan API and executes bulkWrite upserts into MongoDB
 */
const syncTopAiringAnime = async (retryCount = 0) => {
  console.log('🔄 [CRON] Starting daily update of top currently airing anime...');

  try {
    const response = await axios.get(JIKAN_AIRING_URL);
    const animeList = response.data?.data || [];

    if (animeList.length === 0) {
      console.log('⚠️ [CRON] No anime data returned from Jikan API.');
      return;
    }

    // Build bulkWrite operations using updateOne with upsert: true filtered by malId
    const bulkOps = animeList.map(item => {
      const animeData = normalizeAnime(item);
      return {
        updateOne: {
          filter: { malId: item.mal_id },
          update: { $set: animeData },
          upsert: true
        }
      };
    });

    // Execute bulkWrite operation on Mongoose model
    const result = await Anime.bulkWrite(bulkOps);

    console.log(
      `✅ [CRON] Daily update complete! ${result.upsertedCount} documents upserted, ${result.modifiedCount} documents modified.`
    );
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn('⚠️ [CRON] Jikan API Rate Limit (429) hit. Retrying in 5 seconds...');
      if (retryCount < 3) {
        setTimeout(() => syncTopAiringAnime(retryCount + 1), 5000);
      } else {
        console.error('❌ [CRON] Max retries reached after 429 rate limit.');
      }
    } else {
      console.error(`❌ [CRON] Failed to update top airing anime: ${error.message}`);
    }
  }
};

/**
 * Initializes the node-cron scheduler (Runs daily at midnight: 0 0 * * *)
 */
const initCatalogCron = () => {
  // Cron schedule: Daily at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    syncTopAiringAnime();
  });

  // Run an initial sync check on server start if database has low entry count
  Anime.countDocuments()
    .then(count => {
      if (count < 5) {
        console.log('📦 [DATABASE] Initializing database with top currently airing anime...');
        syncTopAiringAnime();
      }
    })
    .catch(err => console.error('Error checking Anime count:', err.message));
};

module.exports = {
  initCatalogCron,
  syncTopAiringAnime
};
