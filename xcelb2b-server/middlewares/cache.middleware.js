import { ApiResponse } from "../utils/ApiResponse.js";

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < duration) {
      // Return cached response
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function (data) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          status: res.statusCode,
          timestamp: Date.now(),
        });
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// Clear cache for specific routes
export const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Clear all cache
export const clearAllCache = () => {
  cache.clear();
};

// Get cache stats
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};
