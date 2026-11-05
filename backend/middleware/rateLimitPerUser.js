/**
 * Per-User Rate Limiting Middleware
 * Limits API requests per user with different limits for different roles
 */

const rateLimit = require('express-rate-limit');

// Store for rate limit data (in production, use Redis)
const userRateLimits = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRateLimits.entries()) {
    if (now - data.resetTime > 60000) { // 1 minute
      userRateLimits.delete(key);
    }
  }
}, 60000);

/**
 * Rate limit configuration by role
 */
const RATE_LIMITS = {
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: 'Too many requests from admin account'
  },
  user: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests from your account'
  },
  guest: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Too many requests, please register for higher limits'
  }
};

/**
 * Custom rate limiter that works per user
 */
function createUserRateLimiter() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const userRole = req.user?.role || 'guest';
      
      const config = RATE_LIMITS[userRole] || RATE_LIMITS.guest;
      const now = Date.now();
      const key = `${userId}:${userRole}`;
      
      // Get or create user rate limit data
      let userData = userRateLimits.get(key);
      
      if (!userData || now - userData.resetTime > config.windowMs) {
        userData = {
          count: 0,
          resetTime: now + config.windowMs
        };
        userRateLimits.set(key, userData);
      }
      
      // Check if limit exceeded
      if (userData.count >= config.max) {
        const resetIn = Math.ceil((userData.resetTime - now) / 1000);
        
        return res.status(429).json({
          error: {
            message: config.message,
            status: 429,
            retryAfter: resetIn
          }
        });
      }
      
      // Increment counter
      userData.count++;
      userRateLimits.set(key, userData);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - userData.count);
      res.setHeader('X-RateLimit-Reset', new Date(userData.resetTime).toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Fail open
    }
  };
}

/**
 * Specific rate limiter for auth endpoints (stricter)
 */
function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
  });
}

/**
 * Specific rate limiter for upload endpoints (stricter)
 */
function createUploadRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many upload requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Get current rate limit status for a user
 */
function getUserRateLimitStatus(userId, role = 'guest') {
  const key = `${userId}:${role}`;
  const userData = userRateLimits.get(key);
  const config = RATE_LIMITS[role] || RATE_LIMITS.guest;
  
  if (!userData) {
    return {
      limit: config.max,
      remaining: config.max,
      reset: new Date(Date.now() + config.windowMs).toISOString()
    };
  }
  
  return {
    limit: config.max,
    remaining: Math.max(0, config.max - userData.count),
    reset: new Date(userData.resetTime).toISOString()
  };
}

/**
 * Reset rate limit for a user (admin only)
 */
function resetUserRateLimit(userId, role = 'guest') {
  const key = `${userId}:${role}`;
  userRateLimits.delete(key);
  return true;
}

module.exports = {
  createUserRateLimiter,
  createAuthRateLimiter,
  createUploadRateLimiter,
  getUserRateLimitStatus,
  resetUserRateLimit,
  RATE_LIMITS
};
