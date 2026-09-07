const axios = require('axios');

const PROVIDER_BASE_URL = process.env.ANIWATCH_API_URL || 'https://aniwatch-api-v1-0.onrender.com';
const TIMEOUT = 15000;

/**
 * Normalizes a string for comparison.
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Searches the provider API for the matching anime.
 */
const searchProviderAnime = async (title, japaneseTitle, synonyms = []) => {
  try {
    const safeSynonyms = synonyms || [];
    console.log(`[PROVIDER] Debug Args -> Title: "${title}", JP: "${japaneseTitle}", Synonyms:`, safeSynonyms);
    
    let results = [];
    const fallbackTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const searchQueries = [title, fallbackTitle, ...safeSynonyms].filter(Boolean);

    for (const query of searchQueries) {
      try {
        const url = `${PROVIDER_BASE_URL}/api/v2/hianime/search?q=${encodeURIComponent(query)}`;
        console.log(`[PROVIDER] Trying search URL: ${url}`);
        const response = await axios.get(url, { 
          timeout: TIMEOUT,
          headers: { 'User-Agent': 'curl/8.4.0', 'Accept': '*/*' }
        });
        if (response.data && response.data.data && response.data.data.animes && response.data.data.animes.length > 0) {
          results = response.data.data.animes;
          console.log(`[PROVIDER] Success with query: ${query}`);
          break; // Stop on first successful query
        }
      } catch (e) {
        if (e.response && e.response.status === 404) {
          console.log(`[PROVIDER] 404 on query: ${query}, moving to next...`);
        } else {
          console.warn(`[PROVIDER] Error on query: ${query}`, e.message);
        }
      }
    }
    
    if (results.length === 0) {
      console.log(`[PROVIDER] No results found for ${title}`);
      return null;
    }

    const normTarget = normalizeString(title);
    const normJp = normalizeString(japaneseTitle);
    const normSynonyms = safeSynonyms.map(normalizeString);

    // Prefer exact match
    for (const res of results) {
      const normRes = normalizeString(res.name);
      const normResJp = normalizeString(res.jname);
      if (normRes === normTarget || normResJp === normJp || normSynonyms.includes(normRes) || normSynonyms.includes(normResJp)) {
        console.log(`[PROVIDER] Found exact match: ${res.id}`);
        return res.id;
      }
    }

    // Fallback: return the first result
    console.log(`[PROVIDER] No exact match, using first result: ${results[0].id}`);
    return results[0].id;

  } catch (err) {
    console.error(`[PROVIDER] Search failed: ${err.message}`);
    return null;
  }
};

/**
 * Fetches episodes for a given provider anime ID.
 */
const getProviderEpisodes = async (providerAnimeId) => {
  try {
    console.log(`[PROVIDER] Fetching episodes for: ${providerAnimeId}`);
    const response = await axios.get(`${PROVIDER_BASE_URL}/api/v2/hianime/anime/${providerAnimeId}/episodes`, { 
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'curl/8.4.0', 'Accept': '*/*' }
    });
    
    const episodes = (response.data && response.data.data && response.data.data.episodes) || [];
    console.log(`[PROVIDER] Found ${episodes.length} episodes`);
    
    // Map to normalized format
    return episodes.map(ep => ({
      id: ep.episodeId, // use the actual Aniwatch episode ID for playback
      number: ep.number,
      title: ep.title || `Episode ${ep.number}`,
      isFiller: ep.isFiller || false
    }));
  } catch (err) {
    console.error(`[PROVIDER] Episodes fetch failed: ${err.message}`);
    return [];
  }
};

/**
 * Fetches stream sources for a specific provider episode ID.
 */
const getProviderStream = async (providerEpisodeId) => {
  try {
    console.log(`[PROVIDER] Fetching stream for: ${providerEpisodeId}`);
    const response = await axios.get(`${PROVIDER_BASE_URL}/api/v2/hianime/episode/sources?animeEpisodeId=${providerEpisodeId}&category=sub`, { 
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'curl/8.4.0', 'Accept': '*/*' }
    });
    
    const sources = (response.data && response.data.data && response.data.data.sources) || [];
    if (sources.length === 0) {
      throw new Error('No stream sources returned from provider');
    }
    
    // AniWatch returns HLS sources
    const defaultSource = sources.find(s => s.isM3U8) || sources[0];
    
    return {
      type: defaultSource.isM3U8 ? 'hls' : 'iframe',
      url: defaultSource.url
    };
  } catch (err) {
    console.error(`[PROVIDER] Stream fetch failed: ${err.message}`);
    throw err;
  }
};

module.exports = {
  searchProviderAnime,
  getProviderEpisodes,
  getProviderStream
};
