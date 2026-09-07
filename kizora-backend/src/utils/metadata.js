const axios = require('axios');

// ─── Constants ───────────────────────────────────────────────────────────────
const TIMEOUT = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Try AniList GraphQL
const fetchAniListInfo = async (anilistId) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
          large
        }
        bannerImage
        genres
        episodes
        status
        seasonYear
        averageScore
      }
    }
  `;
  const response = await axios.post('https://graphql.anilist.co', {
    query,
    variables: { id: parseInt(anilistId) }
  }, { 
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT
    }
  });
  
  const media = response.data?.data?.Media;
  if (!media) throw new Error('AniList returned no data for ID: ' + anilistId);
  return media;
};

// Normalize AniList data into KIZORA schema
const normalizeAniListAnime = (media) => {
  return {
    _id: media.id.toString(), // anilistId is the primary ID
    anilistId: media.id,
    malId: media.idMal,
    title: media.title.english || media.title.romaji || 'Untitled Anime',
    japaneseTitle: media.title.native || media.title.romaji,
    slug: (media.title.english || media.title.romaji || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    synopsis: media.description || 'No synopsis available.',
    coverImage: media.coverImage?.extraLarge || media.coverImage?.large,
    bannerImage: media.bannerImage || media.coverImage?.extraLarge,
    genres: media.genres || ['Anime'],
    totalEpisodes: media.episodes || null,
    status: media.status === 'RELEASING' ? 'Ongoing' : (media.status === 'FINISHED' ? 'Completed' : 'Upcoming'),
    releaseYear: media.seasonYear || new Date().getFullYear(),
    score: (media.averageScore / 10) || null,
    type: 'TV',
    source: 'AniList'
  };
};

// Try Jikan (MAL) with Retry Logic
const fetchJikanWithRetry = async (malId, attempt = 1) => {
  const MAX_RETRIES = 3;
  try {
    console.log(`[JIKAN] Attempt ${attempt}/${MAX_RETRIES}: ${malId}`);
    const response = await axios.get(`https://api.jikan.moe/v4/anime/${malId}`, { 
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'curl/8.4.0',
        'Accept': '*/*'
      }
    });
    console.log(`[JIKAN] Success: ${malId}`);
    return response.data?.data;
  } catch (err) {
    const status = err.response?.status;
    const isTransient = !status || status === 429 || status === 502 || status === 503 || status === 504;
    
    if (isTransient && attempt < MAX_RETRIES) {
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`[JIKAN] Received ${status || 'timeout'}, retrying in ${waitTime/1000}s`);
      await new Promise(res => setTimeout(res, waitTime));
      return fetchJikanWithRetry(malId, attempt + 1);
    }
    
    console.warn(`[JIKAN] Failed after ${attempt} attempts: ${malId}`);
    throw err;
  }
};

// Normalize Jikan data into KIZORA schema
const normalizeJikanAnime = (item) => {
  if (!item) return null;
  return {
    _id: item.mal_id.toString(),
    anilistId: item.mal_id, // We fallback to treating MAL ID as AniList ID for the UI
    malId: item.mal_id,
    title: item.title_english || item.title || 'Untitled Anime',
    japaneseTitle: item.title_japanese || item.title,
    slug: (item.title_english || item.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    synopsis: item.synopsis || 'No synopsis available.',
    coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
    bannerImage: item.trailer?.images?.maximum_image_url || item.images?.jpg?.large_image_url,
    genres: item.genres ? item.genres.map(g => g.name) : ['Anime'],
    totalEpisodes: item.episodes || null,
    status: item.status === 'Currently Airing' ? 'Ongoing' : (item.status === 'Finished Airing' ? 'Completed' : 'Upcoming'),
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : new Date().getFullYear()),
    score: item.score || null,
    type: item.type || 'TV',
    source: 'Jikan (Fallback)'
  };
};

// ─── Exports ─────────────────────────────────────────────────────────────────

const getTitleWithFallback = async (animeId) => {
  try {
    const anilistMedia = await fetchAniListInfo(animeId);
    return anilistMedia.title.english || anilistMedia.title.romaji;
  } catch (err) {
    console.warn(`[WARNING] AniList metadata fetch failed for ID: ${animeId}. Error: ${err.message}`);
    if (err.response?.data) console.warn('[WARNING] AniList Response:', JSON.stringify(err.response.data));
    
    // Fallback to Jikan
    console.log(`[INFO] Falling back to Jikan for title resolution (using ID ${animeId} as MAL ID)`);
    const jikanData = await fetchJikanWithRetry(animeId);
    if (!jikanData) throw new Error('Jikan returned no data');
    return jikanData.title_english || jikanData.title;
  }
};

// Map to hold in-flight promises to prevent duplicate concurrent requests
const pendingRequests = new Map();

const _getAnimeInfoWithFallbackInternal = async (animeId) => {
  console.log(`[METADATA] Fetching metadata: ${animeId}`);
  try {
    const anilistMedia = await fetchAniListInfo(animeId);
    return normalizeAniListAnime(anilistMedia);
  } catch (err) {
    console.warn(`[METADATA] AniList failed: ${err.response?.status || err.message}`);
    
    // Fallback to Jikan
    console.log(`[METADATA] Falling back to Jikan: ${animeId}`);
    const jikanData = await fetchJikanWithRetry(animeId);
    if (!jikanData) throw new Error('Jikan returned no data');
    return normalizeJikanAnime(jikanData);
  }
};

const getAnimeInfoWithFallback = async (animeId) => {
  // Deduplication logic
  if (pendingRequests.has(animeId)) {
    console.log(`[METADATA] Request already in flight: ${animeId}`);
    return await pendingRequests.get(animeId);
  }

  const promise = _getAnimeInfoWithFallbackInternal(animeId);
  pendingRequests.set(animeId, promise);

  try {
    return await promise;
  } finally {
    pendingRequests.delete(animeId);
  }
};

module.exports = {
  getTitleWithFallback,
  getAnimeInfoWithFallback
};
