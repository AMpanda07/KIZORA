const axios = require('axios');
const BaseAdapter = require('../BaseAdapter');

const BASE_URL = process.env.FETCH_STREAM_API_URL || 'https://fetch-stream.vercel.app';
const TIMEOUT = 12000;

class FetchStreamAdapter extends BaseAdapter {
  constructor() {
    super('fetch-stream', 2); // Priority 2
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
   * Search Anime across AnimeSalt and ToonStream
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    try {
      const queries = [title, japaneseTitle, ...(synonyms || [])].filter(Boolean);
      for (const query of queries) {
        const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        const res = await this.client.get('/search', { params: { q: cleanQuery } });
        if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
          const results = res.data.results;
          // Prefer series over movies if available
          const match = results.find(r => r.type === 'series') || results[0];
          this.recordSuccess();
          return JSON.stringify({ link: match.link, source: match.source, title: match.title });
        }
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  /**
   * Parse provider anime payload
   */
  _parseAnimeId(providerAnimeId) {
    if (!providerAnimeId) return null;
    if (typeof providerAnimeId === 'object') return providerAnimeId;
    try {
      return JSON.parse(providerAnimeId);
    } catch {
      return { link: providerAnimeId, source: providerAnimeId.includes('animesalt') ? 'AnimeSalt' : 'ToonStream' };
    }
  }

  /**
   * Get Episodes list
   */
  async getEpisodes(providerAnimeId, canonicalId) {
    const parsed = this._parseAnimeId(providerAnimeId);
    if (!parsed || !parsed.link) return [];

    const isAnimeSalt = parsed.source === 'AnimeSalt' || parsed.link.includes('animesalt');
    const endpoint = isAnimeSalt ? '/animesalt/episodes' : '/toonstream/episodes';

    try {
      const res = await this.client.get(endpoint, { params: { url: parsed.link } });
      if (res.data && Array.isArray(res.data.episodes)) {
        this.recordSuccess();
        return res.data.episodes.map((ep, idx) => {
          const epNum = ep.epNum ? parseInt(ep.epNum, 10) : (idx + 1);
          return {
            providerEpisodeId: ep.link, // Direct episode URL
            episodeNumber: epNum,
            title: ep.title || `Episode ${epNum}`,
            thumbnail: ep.image || null,
            source: parsed.source
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
    const parsed = this._parseAnimeId(providerAnimeId);
    let epLink = (providerEpisodeId && typeof providerEpisodeId === 'string' && providerEpisodeId.startsWith('http')) ? providerEpisodeId : null;

    if (!this.epLinkCache) {
      this.epLinkCache = new Map();
    }

    const cacheKey = parsed?.link ? `${parsed.link}:${episodeNumber}` : null;
    if (!epLink && cacheKey && this.epLinkCache.has(cacheKey)) {
      epLink = this.epLinkCache.get(cacheKey);
    }

    // 1. Direct derivation for ToonStream (deterministic: /series/:slug/ -> /episode/:slug-1x:epNum/)
    if (!epLink && parsed?.link && (parsed.source === 'ToonStream' || parsed.link.includes('toon-stream'))) {
      const match = parsed.link.match(/\/series\/([^\/]+)/);
      if (match && match[1]) {
        epLink = `https://toon-stream.site/episode/${match[1]}-1x${episodeNumber}/`;
      }
    }

    // 2. Only if direct derivation is not possible, query episode list and cache the requested episode link
    if (!epLink && providerAnimeId) {
      try {
        const eps = await this.getEpisodes(providerAnimeId);
        if (eps && eps.length > 0) {
          for (const item of eps) {
            if (item.providerEpisodeId && parsed?.link) {
              this.epLinkCache.set(`${parsed.link}:${item.episodeNumber}`, item.providerEpisodeId);
            }
          }
          const matched = eps.find(e => e.episodeNumber === episodeNumber);
          if (matched) epLink = matched.providerEpisodeId;
        }
      } catch (e) {
        // Continue to fallback
      }
    }

    if (!epLink) return null;
    if (cacheKey && epLink) {
      this.epLinkCache.set(cacheKey, epLink);
    }

    const isAnimeSalt = epLink.includes('animesalt');
    const endpoint = isAnimeSalt ? '/animesalt/streams' : '/toonstream/streams';

    try {
      const res = await this.client.get(endpoint, { params: { url: epLink } });
      if (res.data && Array.isArray(res.data.streams) && res.data.streams.length > 0) {
        const streams = res.data.streams;
        this.recordSuccess();

        // Check if any stream is direct m3u8
        const hlsStream = streams.find(s => s.link && s.link.includes('.m3u8'));
        if (hlsStream) {
          return {
            provider: 'fetch-stream',
            type: 'hls',
            url: hlsStream.link,
            isIframe: false,
            sources: [{ url: hlsStream.link, isM3U8: true }],
            servers: streams.map(s => ({
              name: s.server || s.serverName || 'Server',
              url: s.link,
              isIframe: !s.link.includes('.m3u8')
            }))
          };
        }

        // Otherwise return first playable embed / stream
        const primary = streams[0];
        return {
          provider: 'fetch-stream',
          type: 'iframe',
          url: primary.link,
          isIframe: true,
          sources: [],
          servers: streams.map(s => ({
            name: s.server || s.serverName || 'Server',
            url: s.link,
            isIframe: true
          }))
        };
      }
      return null;
    } catch (err) {
      this.recordFailure(err);
      return null;
    }
  }

  /**
   * TMDB Episode Screenshot Resolver
   */
  async getTmdbThumbnail(title, season = 1, episode = 1) {
    if (!title) return null;
    try {
      const res = await this.client.get('/tmdb/episode-thumbnail', {
        params: { title, season, episode }
      });
      if (res.data && res.data.found && res.data.thumbnails) {
        return res.data.thumbnails.w500 || res.data.thumbnails.original || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async healthCheck() {
    try {
      const res = await this.client.get('/');
      const healthy = res.status === 200 && res.data?.status === 'Active';
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

module.exports = FetchStreamAdapter;
