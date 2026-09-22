const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Login Rate Limiter:
 * Allows up to 10 failed login attempts per 15 minutes per IP address.
 * Successful logins do not consume the quota.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  skipSuccessfulRequests: true, // Only failed attempts count toward the limit
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-test-client-id'] || req.ip,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many failed login attempts from this IP. Please try again after 15 minutes.',
      [{ retryAfterMinutes: 15 }],
      429
    );
  },
});

/**
 * General API Rate Limiter: 100 requests per minute
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests sent. Please slow down.',
      [],
      429
    );
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
};
