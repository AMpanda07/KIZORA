import { 
  fetchTrendingAnime, 
  fetchSpotlight, 
  fetchRecent, 
  fetchAnimeInfo, 
  fetchEpisodes, 
  fetchSearchResults,
  fetchSchedule,
  fetchGenres
} from './api';

// Adapter to map old backend properties to the new UI properties
const mapAnimeForUI = (anime) => {
  if (!anime) return null;
  return {
    ...anime,
    id: anime._id || anime.malId || anime.id, // the UI expects "id"
  };
};

export const animeService = {
  async getSpotlight() {
    const data = await fetchSpotlight();
    return data.map(mapAnimeForUI);
  },

  async getTrending() {
    const data = await fetchTrendingAnime();
    return data.map(mapAnimeForUI);
  },

  async getTopAiring() {
    const data = await fetchRecent();
    return data.map(mapAnimeForUI);
  },

  async getAnime(id) {
    const data = await fetchAnimeInfo(id);
    return mapAnimeForUI(data);
  },

  async getEpisodes(id) {
    const data = await fetchEpisodes(id);
    return data;
  },

  async searchAnime(query, genre = null, type = null) {
    const data = await fetchSearchResults(query, genre, type);
    return data.map(mapAnimeForUI);
  },

  async getSchedule(weekOffset = 0) {
    return await fetchSchedule(weekOffset);
  },

  async getGenres() {
    return await fetchGenres();
  },
  
  async getProfile() {
    return null;
  }
};
