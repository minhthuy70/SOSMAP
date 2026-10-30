const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

// General API rate limiter
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
});

// Strict rate limiter for sensitive operations
const strictRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.STRICT_RATE_LIMIT_MAX) || 10,
  duration: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW) || 60000, // 1 minute
});

// Upload rate limiter
const uploadRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 5,
  duration: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW) || 3600000, // 1 hour
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
    res.status(429).json({
      error: {
        message: 'Too many requests',
        status: 429,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      }
    });
  }
};

const strictRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await strictRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
    res.status(429).json({
      error: {
        message: 'Too many requests for this operation',
        status: 429,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      }
    });
  }
};

const uploadRateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await uploadRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
    res.status(429).json({
      error: {
        message: 'Upload limit exceeded',
        status: 429,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      }
    });
  }
};

// User-specific rate limiter
const userRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.USER_RATE_LIMIT_MAX) || 200,
  duration: parseInt(process.env.USER_RATE_LIMIT_WINDOW) || 900000,
});

const userRateLimiterMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    await userRateLimiter.consume(userId);
    next();
  } catch (rejRes) {
    logger.warn('User rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
    res.status(429).json({
      error: {
        message: 'User rate limit exceeded',
        status: 429,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      }
    });
  }
};

// Get rate limit status
function getRateLimitStatus(key, limiter) {
  return limiter.getRes(key);
}

// Reset rate limit for a key (admin only)
function resetRateLimit(key, limiter) {
  limiter.delete(key);
  logger.info('Rate limit reset', { key });
}

module.exports = {
  rateLimiterMiddleware,
  strictRateLimiterMiddleware,
  uploadRateLimiterMiddleware,
  userRateLimiterMiddleware,
  getRateLimitStatus,
  resetRateLimit
};
