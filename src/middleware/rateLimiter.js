/**
 * Rate limiting middleware
 * Implements in-memory rate limiting (for production, use Redis)
 */

const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

// In-memory store for rate limiting
const requestCounts = new Map();

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 0) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limiter options
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let requestData = requestCounts.get(key);

    // Initialize or reset if window expired
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
      requestCounts.set(key, requestData);
    }

    requestData.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    if (requestData.count > maxRequests) {
      logger.warn('Rate limit exceeded', { key, count: requestData.count });
      
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests to this endpoint, please try again later'
});

/**
 * Standard rate limiter
 */
const standardRateLimiter = rateLimiter();

module.exports = {
  rateLimiter,
  strictRateLimiter,
  standardRateLimiter
};
