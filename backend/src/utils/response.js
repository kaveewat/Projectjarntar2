/**
 * Standard API Response Utilities conforming to 06-api-contract.md
 */

/**
 * Send standard success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {object|null} meta
 * @param {number} statusCode
 */
const sendSuccess = (res, data = null, message = 'OK', meta = null, statusCode = 200) => {
  const payload = {
    success: true,
    data,
    message,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Send 201 Created response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 */
const sendCreated = (res, data = null, message = 'Created successfully') => {
  return sendSuccess(res, data, message, null, 201);
};

/**
 * Send paginated success response
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @param {string} message
 */
const sendPaginated = (res, data = [], page = 1, limit = 20, total = 0, message = 'OK') => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Number(limit) || 20);
  const parsedTotal = Math.max(0, Number(total) || 0);
  const totalPages = Math.ceil(parsedTotal / parsedLimit) || 1;

  const meta = {
    page: parsedPage,
    limit: parsedLimit,
    total: parsedTotal,
    totalPages,
    hasNextPage: parsedPage < totalPages,
    hasPrevPage: parsedPage > 1,
  };

  return sendSuccess(res, data, message, meta, 200);
};

/**
 * Send standard error response
 * @param {import('express').Response} res
 * @param {string} code
 * @param {string} message
 * @param {Array|object} details
 * @param {number} statusCode
 */
const sendError = (res, code = 'INTERNAL_SERVER_ERROR', message = 'Internal Server Error', details = [], statusCode = 500) => {
  const formattedDetails = Array.isArray(details) ? details : [details];

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: formattedDetails,
    },
  });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
};
