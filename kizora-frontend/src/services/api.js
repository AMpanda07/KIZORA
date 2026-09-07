import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * Fetch trending/airing anime catalog from our backend provider route.
 * Falls back to a static list if the backend or Jikan API is unavailable.
 */
export const fetchTrendingAnime = async () => {
  try {
    const response = await API.get('/provider/trending');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (err) {
    console.warn('[API] Trending fetch failed, trying fallback catalog:', err.message);
  }

  // Second attempt: try the local MongoDB catalog
  try {
    const response = await API.get('/anime');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (err) {
    console.warn('[API] MongoDB catalog fetch also failed:', err.message);
  }

  // Static fallback data so the UI always renders something
  return FALLBACK_CATALOG;
};

/**
 * Fetch anime detail by ID from provider route.
 */
export const fetchAnimeInfo = async (animeId) => {
  const response = await API.get(`/provider/info/${animeId}`);
  return response.data;
};

/**
 * Fetch episodes for a given anime ID.
 */
export const fetchEpisodes = async (animeId) => {
  const response = await API.get(`/provider/episodes/${animeId}`);
  return response.data;
};

/**
 * Lazy fetch stream sources for a specific anime ID and episode number.
 * Only resolves the requested episode without fetching all other episodes.
 */
export const fetchEpisodeStream = async (animeId, episodeNumber) => {
  const epNum = episodeNumber || 1;
  const response = await API.get(`/provider/stream/${animeId}/${epNum}`);
  return response.data;
};

/**
 * Fetch stream sources for a given episode ID (e.g. "21-ep-1").
 */
export const fetchStreamSources = async (episodeId) => {
  const response = await API.get(`/provider/stream/${episodeId}`);
  return response.data;
};

export default API;

// ─── Static fallback catalog ─────────────────────────────────────────────────
const FALLBACK_CATALOG = [
  {
    _id: '21',
    malId: 21,
    title: 'One Piece',
    synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure in the world, known as the "One Piece," in order to become the next Pirate King.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    genres: ['Action', 'Adventure', 'Comedy'],
    totalEpisodes: 1122,
    status: 'Ongoing',
    releaseYear: 1999,
    score: 8.7
  },
  {
    _id: '16498',
    malId: 16498,
    title: 'Attack on Titan',
    synopsis: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
    genres: ['Action', 'Drama', 'Fantasy'],
    totalEpisodes: 87,
    status: 'Completed',
    releaseYear: 2013,
    score: 9.0
  },
  {
    _id: '5114',
    malId: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, leaving them in damaged physical forms.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    genres: ['Action', 'Adventure', 'Drama'],
    totalEpisodes: 64,
    status: 'Completed',
    releaseYear: 2009,
    score: 9.1
  },
  {
    _id: '1535',
    malId: 1535,
    title: 'Death Note',
    synopsis: 'A high school student discovers a supernatural notebook that allows him to kill anyone whose name he writes in it and decides to use it to cleanse the world of criminals.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    genres: ['Mystery', 'Supernatural', 'Thriller'],
    totalEpisodes: 37,
    status: 'Completed',
    releaseYear: 2006,
    score: 8.6
  },
  {
    _id: '11061',
    malId: 11061,
    title: 'Hunter x Hunter (2011)',
    synopsis: 'Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks out his missing father.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/11/33657l.jpg',
    genres: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 148,
    status: 'Completed',
    releaseYear: 2011,
    score: 9.0
  },
  {
    _id: '38000',
    malId: 38000,
    title: 'Demon Slayer',
    synopsis: 'A young boy becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon, joining the Demon Slayer Corps to cure her.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    genres: ['Action', 'Fantasy', 'Historical'],
    totalEpisodes: 26,
    status: 'Completed',
    releaseYear: 2019,
    score: 8.7
  },
  {
    _id: '20',
    malId: 20,
    title: 'Naruto',
    synopsis: 'A young ninja, Naruto Uzumaki, seeks recognition from his peers and dreams of becoming the Hokage, the leader of his village.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
    genres: ['Action', 'Adventure', 'Martial Arts'],
    totalEpisodes: 220,
    status: 'Completed',
    releaseYear: 2002,
    score: 8.4
  },
  {
    _id: '269',
    malId: 269,
    title: 'Bleach',
    synopsis: 'High school student Ichigo Kurosaki becomes a soul reaper and vows to protect the innocent and vanquish the evil that threatens his world.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg',
    genres: ['Action', 'Adventure', 'Supernatural'],
    totalEpisodes: 366,
    status: 'Completed',
    releaseYear: 2004,
    score: 8.2
  },
  {
    _id: '35760',
    malId: 35760,
    title: 'My Hero Academia',
    synopsis: 'In a world where most people have superpowers, a boy born without them strives to become the world\'s greatest hero by inheriting the power of the greatest hero.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',
    genres: ['Action', 'Comedy', 'School'],
    totalEpisodes: 138,
    status: 'Completed',
    releaseYear: 2016,
    score: 8.0
  },
  {
    _id: '1',
    malId: 1,
    title: 'Cowboy Bebop',
    synopsis: 'A ragtag crew of bounty hunters chases down the galaxy\'s most dangerous criminals. They\'ll save the world... for the right price.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',
    genres: ['Action', 'Sci-Fi', 'Drama'],
    totalEpisodes: 26,
    status: 'Completed',
    releaseYear: 1998,
    score: 8.8
  },
  {
    _id: '30276',
    malId: 30276,
    title: 'One Punch Man',
    synopsis: 'Saitama is a hero who can defeat any opponent with a single punch, but seeks to find a worthy opponent and the thrill of a good battle.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    totalEpisodes: 12,
    status: 'Completed',
    releaseYear: 2015,
    score: 8.8
  },
  {
    _id: '37779',
    malId: 37779,
    title: 'Sword Art Online',
    synopsis: 'In 2022, a virtual reality massive multiplayer online role-playing game (VRMMORPG) called Sword Art Online is released. Players discover they cannot log out.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg',
    genres: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 25,
    status: 'Completed',
    releaseYear: 2012,
    score: 7.2
  }
];
