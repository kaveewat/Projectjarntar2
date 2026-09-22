const { sendError } = require('../utils/response');

/**
 * Role-based authorization middleware factory
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'UNAUTHORIZED',
        'Authentication is required to access this resource.',
        [],
        401
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'FORBIDDEN',
        `Access forbidden. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: [${req.user.role}].`,
        [{ requiredRoles: allowedRoles, currentRole: req.user.role }],
        403
      );
    }

    return next();
  };
};

module.exports = {
  requireRole,
};
