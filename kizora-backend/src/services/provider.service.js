const providerManager = require('../providers/ProviderManager');

/**
 * Provider Service
 * Delegates to ProviderManager which orchestrates the 5 anime providers:
 * 1. Aniwixi (Priority 1)
 * 2. Fetch-Stream (Priority 2)
 * 3. AnimeWorldIndia (Priority 3)
 * 4. Nekosia (Priority 4)
 * 5. AnimeStreamingBoost (Priority 5)
 */

const resolveEpisodes = async (animeId, metadata) => {
  return providerManager.resolveEpisodes(animeId, metadata);
};

const resolveStream = async (animeId, episodeNumber, metadata) => {
  return providerManager.resolveStream(animeId, episodeNumber, metadata);
};

const getProviderHealth = async () => {
  return providerManager.getHealth();
};

const runProviderDiagnostic = async (animeId, episodeNumber, metadata) => {
  return providerManager.runDiagnostic(animeId, episodeNumber, metadata);
};

module.exports = {
  providerManager,
  resolveEpisodes,
  resolveStream,
  getProviderHealth,
  runProviderDiagnostic
};
