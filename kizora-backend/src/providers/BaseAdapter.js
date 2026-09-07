/**
 * Base Provider Adapter
 * Standardized interface that all 5 KIZORA providers must implement.
 */
class BaseAdapter {
  /**
   * @param {string} name - Unique name of the provider
   * @param {number} priority - Default execution priority (lower = higher priority)
   */
  constructor(name, priority = 10) {
    this.name = name;
    this.priority = priority;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.cooldownMs = 2 * 60 * 1000; // 2 minutes temporary deprioritization cooldown
  }

  /**
   * Check if provider is currently in temporary cooldown due to failures
   */
  isInCooldown() {
    if (!this.lastFailureTime) return false;
    const elapsed = Date.now() - this.lastFailureTime;
    if (elapsed > this.cooldownMs) {
      // Cooldown expired, restore provider
      this.failureCount = Math.max(0, this.failureCount - 1);
      if (this.failureCount === 0) {
        this.lastFailureTime = null;
      }
      return false;
    }
    return true;
  }

  /**
   * Record a temporary failure
   */
  recordFailure(error) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    console.warn(`[${this.name}] Failure #${this.failureCount}: ${error.message}`);
  }

  /**
   * Record a successful request
   */
  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Check if an error is transient (network timeout, 5xx, rate limit) versus permanent (404, 400)
   */
  isTransientError(error) {
    if (!error) return false;
    const status = error.response?.status;
    if (status === 404 || status === 400 || status === 422) return false;
    if (!status || status === 429 || status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return true;
    }
    return false;
  }

  /**
   * Execute an operation with exponential backoff ONLY for transient errors
   */
  async executeWithTransientRetry(fn, maxRetries = 1) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt > maxRetries || !this.isTransientError(err)) {
          throw err;
        }
        const delay = Math.pow(2, attempt - 1) * 800;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  /**
   * Search anime on provider
   * @param {string} title - Primary title
   * @param {string} [japaneseTitle] - Japanese title
   * @param {string[]} [synonyms] - Title synonyms
   * @returns {Promise<string|object|null>} Provider anime identifier
   */
  async searchAnime(title, japaneseTitle, synonyms = []) {
    throw new Error(`searchAnime not implemented in ${this.name}`);
  }

  /**
   * Get anime info from provider
   * @param {string} providerAnimeId
   * @param {string} [canonicalId] - MAL or AniList ID
   * @returns {Promise<object|null>}
   */
  async getAnimeInfo(providerAnimeId, canonicalId) {
    return null;
  }

  /**
   * Get episode list for anime from provider
   * @param {string} providerAnimeId
   * @param {string} [canonicalId]
   * @returns {Promise<Array<{ providerEpisodeId: string, episodeNumber: number, title: string, thumbnail?: string }>>}
   */
  async getEpisodes(providerAnimeId, canonicalId) {
    throw new Error(`getEpisodes not implemented in ${this.name}`);
  }

  /**
   * Get streaming source for episode from provider
   * @param {string} providerAnimeId
   * @param {number} episodeNumber
   * @param {string} [providerEpisodeId]
   * @returns {Promise<{ provider: string, type: 'iframe'|'hls', url: string, isIframe: boolean, sources?: Array, servers?: Array }|null>}
   */
  async getStream(providerAnimeId, episodeNumber, providerEpisodeId) {
    throw new Error(`getStream not implemented in ${this.name}`);
  }

  /**
   * Health check for provider
   * @returns {Promise<{ name: string, status: 'healthy'|'degraded'|'unsupported'|'disabled', message?: string }>}
   */
  async healthCheck() {
    return {
      name: this.name,
      status: this.isInCooldown() ? 'degraded' : 'healthy',
      failureCount: this.failureCount
    };
  }
}

module.exports = BaseAdapter;
