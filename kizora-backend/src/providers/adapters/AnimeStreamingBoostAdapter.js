const BaseAdapter = require('../BaseAdapter');

class AnimeStreamingBoostAdapter extends BaseAdapter {
  constructor() {
    super('anime-streaming-boost', 5); // Priority 5
  }

  /**
   * Safe pass-through: Upstream repository does not provide an active trusted streaming backend
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    return null;
  }

  async getAnimeInfo(providerAnimeId, canonicalId) {
    return null;
  }

  async getEpisodes(providerAnimeId, canonicalId) {
    return [];
  }

  async getStream(providerAnimeId, episodeNumber, providerEpisodeId) {
    return null;
  }

  async healthCheck() {
    return {
      name: this.name,
      priority: this.priority,
      status: 'disabled',
      note: 'Provider flagged as untrusted/inactive; safely quarantined'
    };
  }
}

module.exports = AnimeStreamingBoostAdapter;
