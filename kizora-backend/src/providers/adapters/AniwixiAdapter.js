const axios = require('axios');
const BaseAdapter = require('../BaseAdapter');

const BASE_URL = process.env.ANIWIXI_API_URL || 'https://aniwixi.xyz/wp-json/aniwixi/v1';
const TIMEOUT = 10000;

class AniwixiAdapter extends BaseAdapter {
  constructor() {
    super('aniwixi', 1); // Priority 1 (highest)
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
  }

  /**
   * Search Anime on AnimeWixi
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    try {
      const queries = [title, japaneseTitle, ...(synonyms || [])].filter(Boolean);
      for (const query of queries) {
        const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        const res = await this.client.get('/search', { params: { q: cleanQuery } });
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (list.length > 0) {
          // Look for exact slug or title match first
          const normTarget = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = list.find(item => {
            const itemSlug = (item.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const itemEng = (item.title?.english || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const itemRom = (item.title?.romaji || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return itemSlug === normTarget || itemEng === normTarget || itemRom === normTarget;
          }) || list[0];

          this.recordSuccess();
          return match.anilist_id || match.slug || match.id || null;
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
    const id = canonicalId || providerAnimeId;
    if (!id) return null;

    try {
      const res = await this.client.get(`/anilist/${id}`);
      if (res.data && res.data.status === 'success' && res.data.data) {
        const { info } = res.data.data;
        this.recordSuccess();
        return {
          title: info.title?.english || info.title?.romaji || info.title?.native,
          japaneseTitle: info.title?.native,
          synopsis: info.synopsis ? info.synopsis.replace(/<[^>]*>?/gm, '') : '',
          coverImage: info.poster,
          bannerImage: info.banner,
          status: info.status,
          year: info.year,
          score: info.score,
          genres: info.genres || []
        };
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  /**
   * Get Episodes list
   */
  async getEpisodes(providerAnimeId, canonicalId) {
    const id = canonicalId || providerAnimeId;
    if (!id) return [];

    try {
      const res = await this.client.get(`/anilist/${id}`);
      if (res.data && res.data.status === 'success' && res.data.data?.episodes) {
        const rawEpisodes = res.data.data.episodes;
        this.recordSuccess();

        return rawEpisodes.map((ep, idx) => {
          const epNum = ep.episode_no ? parseInt(ep.episode_no, 10) : (idx + 1);
          const rawTitle = ep.title || `Episode ${epNum}`;
          const cleanTitle = rawTitle.replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/<[^>]*>?/gm, '').trim();

          return {
            providerEpisodeId: ep.episode_no || `${epNum}`,
            episodeNumber: epNum,
            title: cleanTitle,
            thumbnail: null, // Populated via TMDB/Banner enrichment
            embedUrl: ep.embed_url_en || ep.embed_url || ep.embed_url_short_en,
            servers: [
              { name: 'AniWixi HD (English)', url: ep.embed_url_en || ep.embed_url, isIframe: true },
              { name: 'AniWixi Fast Player', url: ep.embed_url_short_en || ep.embed_url_short, isIframe: true }
            ]
          };
        });
      }
      return [];
    } catch (err) {
      this.recordFailure(err);
      return [];
    }
  }

  /**
   * Get Streaming Source
   */
  async getStream(providerAnimeId, episodeNumber, providerEpisodeId) {
    const id = providerAnimeId;
    const ep = episodeNumber;
    if (!id || !ep) return null;

    try {
      // Endpoint: /anilist/:id/ep/:ep
      const res = await this.client.get(`/anilist/${id}/ep/${ep}`);
      if (res.data && res.data.status === 'success' && res.data.data?.player_data) {
        const player = res.data.data.player_data;
        const mainUrl = player.embed_url_en || player.embed_url || player.embed_url_short_en || player.embed_url_short;

        if (!mainUrl) return null;

        const servers = (player.servers || []).map(s => ({
          name: s.name,
          url: s.url,
          quality: s.quality || '1080p HD',
          isIframe: s.is_embed !== false
        }));

        this.recordSuccess();

        return {
          provider: 'aniwixi',
          type: 'iframe',
          url: mainUrl,
          isIframe: true,
          sources: [],
          servers: servers.length > 0 ? servers : [
            { name: 'AniWixi HD (English)', url: mainUrl, isIframe: true }
          ]
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
      const res = await this.client.get('/anime', { params: { page: 1, per_page: 1 } });
      const healthy = res.status === 200;
      return {
        name: this.name,
        priority: this.priority,
        status: healthy ? (this.isInCooldown() ? 'degraded' : 'healthy') : 'down',
        endpoint: BASE_URL,
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

module.exports = AniwixiAdapter;
