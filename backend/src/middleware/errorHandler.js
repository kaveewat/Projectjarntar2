const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Operational Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, _next) => {
  return sendError(
    res,
    'NOT_FOUND',
    `Resource not found: ${req.method} ${req.originalUrl}`,
    [],
    404
  );
};

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, _next) => {
  // 1. Invalid JSON body parse error (Express built-in syntax error)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`Invalid JSON received from ${req.ip} on ${req.method} ${req.originalUrl}: ${err.message}`);
    return sendError(
      res,
      'INVALID_JSON',
      'Invalid JSON format in request body. Please verify JSON syntax.',
      [{ details: err.message }],
      400
    );
  }

  // 2. Joi Validation Error
  if (err.isJoi || (err.details && Array.isArray(err.details) && err.name === 'ValidationError')) {
    const details = err.details.map((item) => ({
      field: item.path ? item.path.join('.') : undefined,
      message: item.message,
    }));
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed for request parameters', details, 400);
  }

  // 3. Known Operational AppError
  if (err instanceof AppError || err.isOperational) {
    return sendError(
      res,
      err.code || 'APP_ERROR',
      err.message,
      err.details || [],
      err.statusCode || 400
    );
  }

  // 4. CORS Error
  if (err.code === 'CORS_ERROR' || err.message?.includes?.('CORS')) {
    logger.warn(`CORS blocked request: ${err.message}`);
    return sendError(res, 'CORS_FORBIDDEN', err.message, [], 403);
  }

  // 5. MySQL Specific Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'DUPLICATE_RESOURCE', 'A duplicate record already exists.', [{ error: err.sqlMessage }], 409);
  }
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    logger.error('Database connection refused:', err);
    return sendError(res, 'DATABASE_UNAVAILABLE', 'Database server is currently unavailable.', [], 503);
  }

  // 6. Default Unhandled 500 Internal Server Error
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    isDev ? err.message : 'An unexpected internal server error occurred',
    isDev && err.stack ? [{ stack: err.stack }] : [],
    500
  );
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
