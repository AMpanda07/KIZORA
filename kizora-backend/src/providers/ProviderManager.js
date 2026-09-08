const AniwixiAdapter = require('./adapters/AniwixiAdapter');
const FetchStreamAdapter = require('./adapters/FetchStreamAdapter');
const AnimeWorldIndiaAdapter = require('./adapters/AnimeWorldIndiaAdapter');
const NekosiaAdapter = require('./adapters/NekosiaAdapter');
const AnimeStreamingBoostAdapter = require('./adapters/AnimeStreamingBoostAdapter');

class ProviderManager {
  constructor() {
    this.adapters = [
      new AniwixiAdapter(),             // Priority 1
      new FetchStreamAdapter(),         // Priority 2
      new AnimeWorldIndiaAdapter(),     // Priority 3
      new NekosiaAdapter(),             // Priority 4
      new AnimeStreamingBoostAdapter()  // Priority 5
    ];

    // In-flight promise deduplication
    this.pendingRequests = new Map();

    // In-memory cache for provider mapping and episodes (15 min TTL)
    this.cache = new Map();
    this.cacheTtlMs = 15 * 60 * 1000;
  }

  /**
   * Get all providers sorted by priority and active health
   */
  getSortedProviders() {
    return [...this.adapters].sort((a, b) => {
      // If one is in cooldown and the other is not, deprioritize the degraded one
      const aCooldown = a.isInCooldown() ? 1 : 0;
      const bCooldown = b.isInCooldown() ? 1 : 0;
      if (aCooldown !== bCooldown) return aCooldown - bCooldown;

      // Otherwise sort by default priority
      return a.priority - b.priority;
    });
  }

  /**
   * Deduplicate concurrent async operations
   */
  async deduplicate(key, fn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Cache helper
   */
  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  setCache(key, value, ttlMs = this.cacheTtlMs) {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  /**
   * Helper: Get cached provider anime identifier mapping
   */
  getProviderAnimeId(canonicalAnimeId, providerName) {
    const mapping = this.getFromCache(`animeMapping:${canonicalAnimeId}`);
    return mapping ? mapping[providerName] : null;
  }

  /**
   * Helper: Save cached provider anime identifier mapping (24 hr TTL)
   */
  setProviderAnimeId(canonicalAnimeId, providerName, providerAnimeId) {
    const key = `animeMapping:${canonicalAnimeId}`;
    let mapping = this.getFromCache(key) || {};
    mapping[providerName] = providerAnimeId;
    this.setCache(key, mapping, 24 * 60 * 60 * 1000);
  }

  /**
   * Validate stream result from provider adapter
   */
  validateStreamSource(stream) {
    if (!stream || !stream.url || typeof stream.url !== 'string') return false;
    const url = stream.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    if (url.includes('127.0.0.1') || url.includes('localhost')) return false;
    // Check for common error pages
    if (url.endsWith('/404') || url.endsWith('/error')) return false;
    return true;
  }

  /**
   * Invalidate cached stream for an episode (e.g. upon playback error)
   */
  invalidateStreamCache(animeId, episodeNumber, language = 'sub', quality = 'default') {
    const epNum = parseInt(episodeNumber, 10) || 1;
    const key = `stream:${animeId}:${epNum}:${language}:${quality}`;
    this.cache.delete(key);
    console.log(`[CACHE INVALIDATED] ${key}`);
  }

  /**
   * Resolve Episode List for an anime from canonical metadata (Lazy UI)
   * Does NOT scrape full catalogs across the 5 providers to avoid rate limits
   */
  async resolveEpisodes(animeId, metadata) {
    const cacheKey = `episodes:${animeId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const total = metadata.totalEpisodes || 12;
    const fallbackThumbnail = metadata.bannerImage || metadata.coverImage || '';

    const normalizedEpisodes = Array.from({ length: total }, (_, i) => ({
      _id: `${animeId}-ep-${i + 1}`,
      anilistId: metadata.anilistId || animeId,
      providerEpisodeId: `${i + 1}`,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      duration: null,
      thumbnail: fallbackThumbnail,
      sourceProvider: 'metadata'
    }));

    this.setCache(cacheKey, normalizedEpisodes, 3600 * 1000);
    return normalizedEpisodes;
  }

  /**
   * Lazy Resolve Stream Source sequentially across the 5 providers for Episode N only
   * Fallback is strictly per-episode:
   * Provider 1 (Ep N) -> fail -> Provider 2 (Ep N) -> fail -> Provider 3 (Ep N)...
   * Max 5 attempts (1 per provider). Stops on first success. Never cycles back.
   */
  async resolveStream(animeId, episodeNumber, metadata, language = 'sub', quality = 'default') {
    const epNum = parseInt(episodeNumber, 10) || 1;
    const streamCacheKey = `stream:${animeId}:${epNum}:${language}:${quality}`;

    // 1. Check Stream Cache (10 min TTL)
    const cachedStream = this.getFromCache(streamCacheKey);
    if (cachedStream) {
      console.log(`[WATCH] Anime: ${animeId}`);
      console.log(`[WATCH] Episode: ${epNum}`);
      console.log(`[STREAM] ${cachedStream.provider} (from cache)`);
      return cachedStream;
    }

    // 2. In-flight Promise Deduplication: episode:animeId:epNum:lang:qual
    const dedupKey = `episode:${animeId}:${epNum}:${language}:${quality}`;

    return this.deduplicate(dedupKey, async () => {
      // Re-check cache in case another request resolved it while waiting
      const rechecked = this.getFromCache(streamCacheKey);
      if (rechecked) return rechecked;

      console.log(`[WATCH] Anime: ${animeId} (${metadata.title})`);
      console.log(`[WATCH] Episode: ${epNum}`);

      const providers = this.getSortedProviders();
      const attempted = [];
      let attemptsCount = 0;
      const MAX_PROVIDER_ATTEMPTS = 5;

      for (const adapter of providers) {
        if (attemptsCount >= MAX_PROVIDER_ATTEMPTS) break;
        attemptsCount++;

        console.log(`[${adapter.name}] Resolving Episode ${epNum}...`);

        try {
          // A. Resolve provider-specific anime ID
          let providerAnimeId = this.getProviderAnimeId(animeId, adapter.name);

          if (!providerAnimeId) {
            if (adapter.name === 'aniwixi') {
              providerAnimeId = metadata.anilistId || (await adapter.searchAnime(metadata.title, metadata.japaneseTitle, metadata.synonyms));
            } else {
              providerAnimeId = await adapter.searchAnime(metadata.title, metadata.japaneseTitle, metadata.synonyms);
            }

            if (providerAnimeId) {
              this.setProviderAnimeId(animeId, adapter.name, providerAnimeId);
            }
          }

          if (!providerAnimeId) {
            attempted.push({ provider: adapter.name, status: 'anime_not_found' });
            continue;
          }

          // B. Fetch single episode stream with transient retry
          const stream = await adapter.executeWithTransientRetry(
            () => adapter.getStream(providerAnimeId, epNum, `${epNum}`),
            1 // max 1 retry for transient errors
          );

          // C. Validate stream URL before accepting
          if (stream && this.validateStreamSource(stream)) {
            adapter.recordSuccess();
            console.log(`[STREAM SUCCESS] Provider: ${adapter.name} | Ep: ${epNum}`);

            const payload = {
              success: true,
              animeId: String(animeId),
              episodeNumber: epNum,
              provider: adapter.name,
              url: stream.url,
              type: stream.type || (stream.url.includes('.m3u8') ? 'hls' : 'iframe'),
              isIframe: stream.isIframe !== false,
              sources: stream.sources || (stream.url.includes('.m3u8') ? [{ url: stream.url, isM3U8: true }] : []),
              servers: stream.servers || [],
              attemptedProviders: attempted
            };

            // Cache successful stream (10 minutes)
            this.setCache(streamCacheKey, payload, 10 * 60 * 1000);
            return payload;
          } else {
            console.warn(`[${adapter.name}] Stream validation failed for Episode ${epNum}`);
            attempted.push({ provider: adapter.name, status: 'invalid_stream_returned' });
          }
        } catch (err) {
          adapter.recordFailure(err);
          console.warn(`[${adapter.name}] Episode ${epNum} failed: ${err.message}`);
          attempted.push({ provider: adapter.name, status: 'error', message: err.message });
        }
      }

      // All 5 providers failed for this episode
      console.log(`[STREAM FAILED] All providers failed for anime ${animeId} Ep ${epNum}`);
      return {
        success: false,
        error: {
          code: 'ALL_PROVIDERS_FAILED',
          message: `Unable to resolve playable stream for Episode ${epNum}.`,
          animeId: String(animeId),
          episode: epNum
        },
        attemptedProviders: attempted
      };
    });
  }

  /**
   * Run health checks on all 5 providers
   */
  async getHealth() {
    const results = await Promise.all(this.adapters.map(a => a.healthCheck()));
    const sortedOrder = this.getSortedProviders().map(a => a.name);

    return {
      status: results.some(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      activeFallbackOrder: sortedOrder,
      providers: results
    };
  }

  /**
   * Run diagnostic test for a specific anime episode across all 5 providers
   */
  async runDiagnostic(animeId, episodeNumber, metadata) {
    const diagnostic = [];

    for (const adapter of this.adapters) {
      const start = Date.now();
      try {
        const searchId = await adapter.searchAnime(metadata.title, metadata.japaneseTitle, metadata.synonyms);
        const stream = await adapter.getStream(searchId, episodeNumber, `${episodeNumber}`);
        diagnostic.push({
          provider: adapter.name,
          priority: adapter.priority,
          latencyMs: Date.now() - start,
          success: Boolean(stream && stream.url),
          streamUrl: stream ? stream.url : null,
          type: stream ? stream.type : null,
          details: stream || 'No stream sources found'
        });
      } catch (err) {
        diagnostic.push({
          provider: adapter.name,
          priority: adapter.priority,
          latencyMs: Date.now() - start,
          success: false,
          error: err.message
        });
      }
    }

    return {
      animeId,
      episodeNumber,
      title: metadata.title,
      results: diagnostic
    };
  }
}

// Singleton instance
const providerManager = new ProviderManager();

module.exports = providerManager;
