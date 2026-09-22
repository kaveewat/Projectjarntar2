const { startPaymentTimeoutCron } = require('../jobs/order-payment-timeout.job');
const { startHandoverSellerTimeoutCron } = require('../jobs/handover-seller-timeout.job');
const { startBuyerAutoReleaseCron, stopBuyerAutoReleaseCron } = require('../jobs/buyer-auto-release.job');
const { startDisputeSlaCron, stopDisputeSlaCron } = require('../jobs/dispute-sla.job');
const logger = require('../utils/logger');

let paymentCronTask = null;
let handoverCronTask = null;
let autoReleaseCronTask = null;
let disputeSlaCronTask = null;
let isInitialized = false;

/**
 * Service 16.6: Background Job Scheduler Service
 * Centralizes lifecycle management and registration for all system cron tasks
 */
const initSchedulers = () => {
  if (isInitialized) {
    logger.warn('⚠️  Schedulers already initialized, skipping re-initialization.');
    return;
  }

  logger.info('⚙️  Initializing background job schedulers...');

  // 1. Order payment timeout check (every 5 mins)
  paymentCronTask = startPaymentTimeoutCron();

  // 2. Handover seller credentials timeout check (every 15 mins)
  handoverCronTask = startHandoverSellerTimeoutCron();

  // 3. Buyer 48h auto-release check (every 15 mins)
  autoReleaseCronTask = startBuyerAutoReleaseCron();

  // 4. Dispute SLA warning check (hourly)
  disputeSlaCronTask = startDisputeSlaCron();

  isInitialized = true;
  logger.info('✅ All 4 background schedulers active and registered.');
};

/**
 * Gracefully stop all active schedulers
 */
const stopSchedulers = () => {
  logger.info('🛑 Stopping all background job schedulers...');

  if (paymentCronTask && typeof paymentCronTask.stop === 'function') {
    paymentCronTask.stop();
  }
  if (handoverCronTask && typeof handoverCronTask.stop === 'function') {
    handoverCronTask.stop();
  }
  stopBuyerAutoReleaseCron();
  stopDisputeSlaCron();

  isInitialized = false;
  logger.info('💤 Schedulers successfully terminated.');
};

module.exports = {
  initSchedulers,
  stopSchedulers,
};
