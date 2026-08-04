const NodeCache = require('node-cache');

// Default cache instance
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Cache middleware for Express routes
 * @param {number} durationInSeconds - Cache TTL in seconds
 */
const cacheMiddleware = (durationInSeconds = 600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, durationInSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { cache, cacheMiddleware };
