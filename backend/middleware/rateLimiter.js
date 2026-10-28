const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip;
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: {
        message: 'Too many requests',
        status: 429,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      }
    });
  }
};

module.exports = rateLimiterMiddleware;
