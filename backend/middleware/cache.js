const NodeCache = require('node-cache');

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired items every 60 seconds
  useClones: false // For better performance
});

// Cache middleware factory
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if no-cache header is present
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const key = req.originalUrl || req.url;

    // Check if data is in cache
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log('Cache hit:', key);
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data) => {
      cache.set(key, data, duration);
      console.log('Cache set:', key);
      return originalJson(data);
    };

    next();
  };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (pattern && key.includes(pattern)) {
      cache.del(key);
      console.log('Cache invalidated:', key);
    }
  });
};

// Invalidate specific cache key
const invalidateKey = (key) => {
  cache.del(key);
  console.log('Cache key invalidated:', key);
};

// Clear all cache
const clearCache = () => {
  cache.flushAll();
  console.log('All cache cleared');
};

// Get cache stats
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  invalidateKey,
  clearCache,
  getCacheStats
};
