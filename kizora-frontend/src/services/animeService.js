import { 
  fetchTrendingAnime, 
  fetchSpotlight, 
  fetchRecent, 
  fetchAnimeInfo, 
  fetchEpisodes, 
  fetchSearchResults 
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
    // map the episodes if needed, otherwise return as-is
    return data;
  },

  async searchAnime(query) {
    const data = await fetchSearchResults(query);
    return data.map(mapAnimeForUI);
  },

  // Temporarily kept for Schedule page - if Jikan fallback is needed later
  async getSchedule(day) {
    // For now, return empty or fallback
    return [];
  },
  
  async getProfile() {
    return null;
  }
};
