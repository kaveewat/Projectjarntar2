const { verifyAccessToken } = require('../utils/jwt');
const userModel = require('../models/user.model');
const { sendError } = require('../utils/response');

/**
 * Require valid JWT Bearer token middleware
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'UNAUTHORIZED',
      'Authentication token is required. Please provide a valid Bearer token in the Authorization header.',
      [],
      401
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Verify user still exists in database and is active
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return sendError(res, 'USER_NOT_FOUND', 'User belonging to this token no longer exists.', [], 401);
    }

    if (user.is_banned) {
      return sendError(res, 'ACCOUNT_BANNED', 'This account has been permanently banned.', [], 403);
    }

    if (user.is_suspended) {
      return sendError(res, 'ACCOUNT_SUSPENDED', 'This account is temporarily suspended.', [], 403);
    }

    // Attach user to request
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'TOKEN_EXPIRED', 'Token has expired. Please log in again.', [], 401);
    }
    return sendError(res, 'INVALID_TOKEN', 'Invalid or malformed authentication token.', [], 401);
  }
};

/**
 * Optional authentication: attaches user if token is valid, continues if not
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await userModel.findById(decoded.id);
    if (user && !user.is_banned && !user.is_suspended) {
      req.user = user;
    }
  } catch (_e) {
    // Ignore invalid token in optional auth
  }

  return next();
};

module.exports = {
  requireAuth,
  optionalAuth,
};
