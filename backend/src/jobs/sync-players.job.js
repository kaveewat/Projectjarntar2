const cron = require('node-cron');
const { syncLatestPlayers } = require('../services/player-sync.service');
const logger = require('../utils/logger');

let cronTask = null;

/**
 * Job: Automatic Card Synchronization Job
 * Periodically pulls the latest eFootball cards from eFHUB into player_cards table
 */
const runPlayerSyncJob = async () => {
  try {
    logger.info('⏰ [Cron] Starting scheduled eFootball card synchronization...');
    const result = await syncLatestPlayers({ limit: 100 });
    logger.info(`✅ [Cron] Player sync completed. Added ${result.added} new cards.`);
    return result;
  } catch (err) {
    logger.error(`❌ [Cron] Player sync error: ${err.message}`);
    return { error: err.message };
  }
};

/**
 * Start cron schedule:
 * Runs every 12 hours (at 03:00 and 15:00 UTC) to catch weekly Thursday maintenance + daily drops
 */
const startPlayerSyncCron = () => {
  if (cronTask) {
    return cronTask;
  }

  // Runs at 03:00 and 15:00 every day
  cronTask = cron.schedule('0 3,15 * * *', runPlayerSyncJob);
  logger.info('⏰ eFootball player cards auto-sync cron scheduled (every 12 hours: 03:00 & 15:00 UTC)');
  return cronTask;
};

const stopPlayerSyncCron = () => {
  if (cronTask && typeof cronTask.stop === 'function') {
    cronTask.stop();
    cronTask = null;
    logger.info('🛑 eFootball player cards auto-sync cron stopped.');
  }
};

module.exports = {
  startPlayerSyncCron,
  stopPlayerSyncCron,
  runPlayerSyncJob,
};
