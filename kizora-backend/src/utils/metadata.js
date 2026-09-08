const axios = require('axios');

// ─── Constants ───────────────────────────────────────────────────────────────
const TIMEOUT = 6000;
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
      'User-Agent': USER_AGENT,
      'Origin': 'https://anilist.co',
      'Referer': 'https://anilist.co/'
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
  const MAX_RETRIES = 1;
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
    synonyms: item.title_synonyms || [],
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

const STATIC_CATALOG = [
  { _id: '21', anilistId: 21, malId: 21, title: 'One Piece', japaneseTitle: 'ONE PIECE', synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure in the world.', coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg', genres: ['Action', 'Adventure', 'Comedy'], totalEpisodes: 1122, status: 'Ongoing', releaseYear: 1999, score: 8.7 },
  { _id: '16498', anilistId: 16498, malId: 16498, title: 'Attack on Titan', japaneseTitle: 'Shingeki no Kyojin', synopsis: 'After his hometown is destroyed and his mother killed, young Eren vows to cleanse the earth of Titans.', coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', genres: ['Action', 'Drama', 'Fantasy'], totalEpisodes: 87, status: 'Completed', releaseYear: 2013, score: 9.0 },
  { _id: '5114', anilistId: 5114, malId: 5114, title: 'Fullmetal Alchemist: Brotherhood', japaneseTitle: 'Hagane no Renkinjutsushi', synopsis: 'Two brothers search for a Philosopher\'s Stone after a failed alchemy attempt.', coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg', genres: ['Action', 'Adventure', 'Drama'], totalEpisodes: 64, status: 'Completed', releaseYear: 2009, score: 9.1 },
  { _id: '1535', anilistId: 1535, malId: 1535, title: 'Death Note', japaneseTitle: 'Death Note', synopsis: 'A student uses a supernatural notebook to rid the world of criminals.', coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg', genres: ['Mystery', 'Supernatural', 'Thriller'], totalEpisodes: 37, status: 'Completed', releaseYear: 2006, score: 8.6 },
  { _id: '11061', anilistId: 11061, malId: 11061, title: 'Hunter x Hunter (2011)', japaneseTitle: 'HUNTER×HUNTER', synopsis: 'Gon aspires to become a Hunter and seeks out his missing father across dangerous lands.', coverImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg', genres: ['Action', 'Adventure', 'Fantasy'], totalEpisodes: 148, status: 'Completed', releaseYear: 2011, score: 9.0 },
  { _id: '38000', anilistId: 38000, malId: 38000, title: 'Demon Slayer', japaneseTitle: 'Kimetsu no Yaiba', synopsis: 'A young boy becomes a demon slayer to cure his sister who was turned into a demon.', coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg', genres: ['Action', 'Fantasy', 'Historical'], totalEpisodes: 26, status: 'Completed', releaseYear: 2019, score: 8.7 },
  { _id: '20', anilistId: 20, malId: 20, title: 'Naruto', japaneseTitle: 'NARUTO', synopsis: 'A young ninja seeks recognition from his peers and dreams of becoming the Hokage.', coverImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg', genres: ['Action', 'Adventure', 'Martial Arts'], totalEpisodes: 220, status: 'Completed', releaseYear: 2002, score: 8.4 },
  { _id: '30276', anilistId: 30276, malId: 30276, title: 'One Punch Man', japaneseTitle: 'One Punch Man', synopsis: 'Saitama is a hero who defeats any opponent with a single punch.', coverImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', bannerImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', genres: ['Action', 'Comedy', 'Sci-Fi'], totalEpisodes: 12, status: 'Completed', releaseYear: 2015, score: 8.8 }
];

const fetchAniwixiInfo = async (animeId) => {
  const res = await axios.get(`https://aniwixi.xyz/wp-json/aniwixi/v1/anilist/${animeId}`, { timeout: 8000 });
  if (res.data && res.data.status === 'success' && res.data.data?.info) {
    const info = res.data.data.info;
    return {
      _id: `${animeId}`,
      anilistId: parseInt(info.anilist_id || animeId, 10),
      malId: parseInt(info.mal_id || animeId, 10),
      title: info.title?.english || info.title?.romaji || info.title?.native,
      japaneseTitle: info.title?.native || info.title?.romaji,
      synopsis: info.synopsis ? info.synopsis.replace(/<[^>]*>?/gm, '') : '',
      coverImage: info.poster,
      bannerImage: info.banner || info.poster,
      status: info.status === 'RELEASING' ? 'Ongoing' : 'Completed',
      genres: info.genres || ['Action'],
      totalEpisodes: res.data.data.episodes?.length || 24,
      releaseYear: parseInt(info.year, 10) || 2020,
      score: (parseFloat(info.score) / 10) || 8.0,
      type: 'TV',
      source: 'AniWixi'
    };
  }
  throw new Error('AniWixi info not available');
};

const _getAnimeInfoWithFallbackInternal = async (animeId) => {
  console.log(`[METADATA] request (animeId: ${animeId})`);
  
  // Step 1: AniList
  try {
    const anilistMedia = await fetchAniListInfo(animeId);
    return normalizeAniListAnime(anilistMedia);
  } catch (err) {
    console.warn(`[METADATA] AniList failed: ${err.response?.status || err.message}`);
  }

  // Step 2: Jikan
  try {
    console.log(`[METADATA] Falling back to Jikan: ${animeId}`);
    const jikanData = await fetchJikanWithRetry(animeId);
    if (jikanData) return normalizeJikanAnime(jikanData);
  } catch (err) {
    console.warn(`[METADATA] Jikan failed: ${err.response?.status || err.message}`);
  }

  // Step 3: AniWixi Provider Info
  try {
    console.log(`[METADATA] Falling back to AniWixi: ${animeId}`);
    const aniwixiData = await fetchAniwixiInfo(animeId);
    if (aniwixiData) return aniwixiData;
  } catch (err) {
    console.warn(`[METADATA] AniWixi metadata failed: ${err.message}`);
  }

  throw new Error(`Could not resolve metadata for anime ID "${animeId}" across any metadata provider.`);
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
