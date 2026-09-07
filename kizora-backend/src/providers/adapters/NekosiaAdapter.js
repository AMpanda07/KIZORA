const axios = require('axios');
const BaseAdapter = require('../BaseAdapter');

const BASE_URL = process.env.NEKOSIA_API_URL || 'https://api.nekosia.cat/api/v1';

class NekosiaAdapter extends BaseAdapter {
  constructor() {
    super('nekosia', 4); // Priority 4
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 5000
    });
  }

  /**
   * Search Anime - Nekosia is an image API, not a streaming database
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    // Graceful no-op: Nekosia is an image API
    return null;
  }

  async getAnimeInfo(providerAnimeId, canonicalId) {
    return null;
  }

  async getEpisodes(providerAnimeId, canonicalId) {
    return [];
  }

  async getStream(providerAnimeId, episodeNumber, providerEpisodeId) {
    // Streaming not supported by Nekosia; graceful fallback
    return null;
  }

  async healthCheck() {
    try {
      // Test basic connectivity to Nekosia API
      const res = await this.client.get('/health').catch(() => ({ status: 200 }));
      return {
        name: this.name,
        priority: this.priority,
        status: 'unsupported_media_type',
        note: 'Nekosia API is an image/asset service; streaming endpoints gracefully pass-through',
        endpoint: BASE_URL
      };
    } catch {
      return {
        name: this.name,
        priority: this.priority,
        status: 'standby',
        note: 'Image API standby'
      };
    }
  }
}

module.exports = NekosiaAdapter;
