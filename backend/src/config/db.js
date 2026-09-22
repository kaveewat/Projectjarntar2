const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

// Create MySQL2 connection pool
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl,
  waitForConnections: env.db.waitForConnections,
  connectionLimit: env.db.connectionLimit,
  queueLimit: env.db.queueLimit,
  connectTimeout: env.db.connectTimeout,
  charset: 'utf8mb4',
  timezone: '+07:00',
  dateStrings: true,
});

let isConnected = false;

/**
 * Health check test using a lightweight SELECT 1 query
 * @returns {Promise<boolean>}
 */
const healthCheck = async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS health');
    isConnected = rows && rows[0] && rows[0].health === 1;
    return isConnected;
  } catch (err) {
    isConnected = false;
    logger.warn(`Database health check failed: ${err.message}`);
    return false;
  }
};

/**
 * Initialize and verify DB connection with retry logic
 * Non-blocking: will not crash server if DB is temporarily unavailable
 * @param {number} maxRetries 
 * @param {number} delayMs 
 */
const initConnection = async (maxRetries = 5, delayMs = 3000) => {
  let attempts = 0;

  const attemptConnect = async () => {
    attempts += 1;
    try {
      const connection = await pool.getConnection();
      logger.info(`✅ Connected to MySQL database [${env.db.name}] at ${env.db.host}:${env.db.port}`);
      isConnected = true;
      connection.release();
    } catch (err) {
      isConnected = false;
      logger.error(`❌ Database connection attempt ${attempts}/${maxRetries} failed: ${err.message}`);

      if (attempts < maxRetries) {
        logger.warn(`⏳ Retrying database connection in ${delayMs / 1000}s...`);
        setTimeout(attemptConnect, delayMs);
      } else {
        logger.error(`🚨 Max database connection attempts reached. Server running in degraded mode without active DB.`);
      }
    }
  };

  await attemptConnect();
};

/**
 * Gracefully close the connection pool
 */
const closePool = async () => {
  try {
    await pool.end();
    isConnected = false;
    logger.info('Database connection pool closed successfully.');
  } catch (err) {
    logger.error(`Error closing database pool: ${err.message}`);
    throw err;
  }
};

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
  healthCheck,
  initConnection,
  closePool,
  get isConnected() {
    return isConnected;
  },
};
