const morgan = require('morgan');
const logger = require('../utils/logger');

// Format: :method :url :status :res[content-length] - :response-time ms
const morganFormat = ':method :url :status :res[content-length]b - :response-time ms';

const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req) => {
    // Optionally skip logging static assets or health checks if needed; for now log all
    return false;
  },
});

module.exports = requestLogger;
