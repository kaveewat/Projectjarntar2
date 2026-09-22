const env = require('./env');

const allowedOrigins = (env.cors.origin || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Direct match or wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // In development mode, allow any localhost port
    if (env.env === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    const err = new Error(`CORS policy does not allow access from origin: ${origin}`);
    err.statusCode = 403;
    err.code = 'CORS_ERROR';
    return callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

module.exports = corsOptions;
