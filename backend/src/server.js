const http = require('http');
const createApp = require('./app');
const env = require('./config/env');
const db = require('./config/db');
const logger = require('./utils/logger');

const app = createApp();
const server = http.createServer(app);

const PORT = env.port || 5001;

// Start listening
server.listen(PORT, async () => {
  logger.info(`🚀 Server running in [${env.env}] mode on port ${PORT}`);
  logger.info(`📡 Health Check endpoint: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🛡️  Security headers active via Helmet`);
  logger.info(`🌐 CORS enabled for origin(s): ${env.cors.origin}`);

  // Initialize and verify database connection
  await db.initConnection();

  // Automatically ensure correct eFHUB card tiers in database
  try {
    const { fixCardTiers } = require('./services/card-tier-fixer.service');
    await fixCardTiers();
  } catch (tierErr) {
    logger.warn(`Card tiers auto-fix skipped: ${tierErr.message}`);
  }

  // Start background schedulers via Scheduler Service (Phase 16)
  const schedulerService = require('./services/scheduler.service');
  schedulerService.initSchedulers();
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.warn(`⚠️  Received ${signal}. Initiating graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error('⏰ Shutdown timed out after 10 seconds. Forcing immediate termination.');
    process.exit(1);
  }, 10000);

  // Stop background schedulers
  try {
    const schedulerService = require('./services/scheduler.service');
    schedulerService.stopSchedulers();
  } catch (err) {
    logger.error(`❌ Error stopping schedulers: ${err.message}`);
  }

  // Stop accepting new HTTP connections
  server.close(async () => {
    logger.info('🛑 HTTP server closed.');

    try {
      await db.closePool();
      logger.info('💾 Database connection pool terminated.');
      clearTimeout(shutdownTimeout);
      logger.info('👋 Graceful shutdown complete. Exiting cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error(`❌ Error closing database connections: ${err.message}`);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  });
};


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process-level exception handling
process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught Exception detected:', err);
  // Log and shut down to prevent corrupted state
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

module.exports = server;
