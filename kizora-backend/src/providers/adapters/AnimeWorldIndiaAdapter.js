const axios = require('axios');
const BaseAdapter = require('../BaseAdapter');

const BASE_URL = process.env.ANIME_WORLD_INDIA_API_URL || 'http://127.0.0.1:3001/api';
const TIMEOUT = 8000;

class AnimeWorldIndiaAdapter extends BaseAdapter {
  constructor() {
    super('animeworldindia', 3); // Priority 3
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Accept': 'application/json',
      }
    });
  }

  /**
   * Search Anime
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    try {
      const queries = [title, japaneseTitle, ...(synonyms || [])].filter(Boolean);
      for (const query of queries) {
        const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        const res = await this.client.get('/search', { params: { q: cleanQuery } });
        if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const match = res.data.data[0];
          this.recordSuccess();
          return match.id || null;
        }
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  /**
   * Get Anime Info
   */
  async getAnimeInfo(providerAnimeId, canonicalId) {
    if (!providerAnimeId) return null;
    try {
      const res = await this.client.get(`/info/${providerAnimeId}`);
      if (res.data && res.data.success && res.data.data) {
        this.recordSuccess();
        const d = res.data.data;
        return {
          title: d.title,
          synopsis: d.synopsis,
          coverImage: d.image || d.poster,
          status: d.status,
          genres: d.genres || []
        };
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  /**
   * Get Episodes
   */
  async getEpisodes(providerAnimeId, canonicalId) {
    if (!providerAnimeId) return [];
    try {
      const res = await this.client.get(`/episodes/${providerAnimeId}/1`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        this.recordSuccess();
        return res.data.data.map((ep, idx) => ({
          providerEpisodeId: ep.id || `${providerAnimeId}-ep-${idx + 1}`,
          episodeNumber: ep.number || (idx + 1),
          title: ep.title || `Episode ${ep.number || (idx + 1)}`,
          thumbnail: ep.image || null
        }));
      }
      return [];
    } catch (err) {
      this.recordFailure(err);
      return [];
    }
  }

  /**
   * Get Stream
   */
  async getStream(providerAnimeId, episodeNumber, providerEpisodeId) {
    const id = providerEpisodeId || `${providerAnimeId}-ep-${episodeNumber}`;
    if (!id) return null;

    try {
      const res = await this.client.get(`/embed/${id}`);
      if (res.data && res.data.success && res.data.data?.embedUrl) {
        this.recordSuccess();
        const embedUrl = res.data.data.embedUrl;
        return {
          provider: 'animeworldindia',
          type: 'iframe',
          url: embedUrl,
          isIframe: true,
          sources: [],
          servers: [{ name: 'AnimeWorld Embed', url: embedUrl, isIframe: true }]
        };
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  async healthCheck() {
    try {
      const res = await this.client.get('/health');
      const healthy = res.status === 200 && res.data?.data?.status === 'healthy';
      return {
        name: this.name,
        priority: this.priority,
        status: healthy ? (this.isInCooldown() ? 'degraded' : 'healthy') : 'down',
        endpoint: BASE_URL,
        uptime: res.data?.data?.uptime,
        failureCount: this.failureCount
      };
    } catch (err) {
      return {
        name: this.name,
        priority: this.priority,
        status: 'down',
        error: err.message,
        failureCount: this.failureCount
      };
    }
  }
}

module.exports = AnimeWorldIndiaAdapter;
