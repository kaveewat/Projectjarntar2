const cron = require('node-cron');
const db = require('../config/db');
const escrowService = require('../services/escrow.service');
const logger = require('../utils/logger');

/**
 * Job 7.11: Check and auto-cancel/refund orders where seller didn't provide account details within 72 hours
 */
const checkHandoverSellerTimeouts = async () => {
  try {
    const [orders] = await db.query(`
      SELECT id, status, listing_id 
      FROM orders 
      WHERE status IN ('PAYMENT_APPROVED', 'HANDOVER_OPEN')
        AND (handover_deadline <= NOW() OR updated_at <= DATE_SUB(NOW(), INTERVAL 72 HOUR))
    `);

    if (!orders || orders.length === 0) {
      return { processed: 0 };
    }

    logger.info(`[Seller Handover Timeout Job] Found ${orders.length} order(s) past 72h handover deadline. Refunding...`);

    let count = 0;
    for (const order of orders) {
      try {
        await escrowService.refundEscrow({
          orderId: order.id,
          adminId: null,
          reason: 'Auto-cancelled & refunded: Seller failed to provide account credentials within 72 hours',
        });
        count++;
        logger.info(`[Seller Handover Timeout Job] Order ${order.id} refunded and listing ${order.listing_id} restored to ACTIVE.`);
      } catch (subErr) {
        logger.error(`[Seller Handover Timeout Job] Failed to refund order ${order.id}: ${subErr.message}`);
      }
    }

    return { processed: count };
  } catch (err) {
    logger.error(`[Seller Handover Timeout Job Error]: ${err.message}`);
    return { processed: 0, error: err.message };
  }
};

/**
 * Start cron schedule: runs every 15 minutes
 */
const startHandoverSellerTimeoutCron = () => {
  cron.schedule('*/15 * * * *', async () => {
    logger.debug('[Seller Handover Timeout Cron] Running 15-minute check...');
    await checkHandoverSellerTimeouts();
  });
  logger.info('⏰ Seller handover timeout cron scheduled (every 15 minutes)');
};

module.exports = {
  checkHandoverSellerTimeouts,
  startHandoverSellerTimeoutCron,
};
