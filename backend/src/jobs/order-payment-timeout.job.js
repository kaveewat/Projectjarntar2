const cron = require('node-cron');
const db = require('../config/db');
const orderLogModel = require('../models/order-status-log.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Job 7.10: Check and expire orders that haven't been paid within 2 hours
 */
const checkPaymentTimeouts = async () => {
  try {
    const conn = await db.getConnection();
    try {
      // Find orders past deadline
      const [expiredOrders] = await conn.query(`
        SELECT id, listing_id, buyer_id, seller_id, order_number, status 
        FROM orders 
        WHERE status IN ('CREATED', 'PENDING_PAYMENT')
          AND (payment_deadline <= NOW() OR created_at <= DATE_SUB(NOW(), INTERVAL 2 HOUR))
      `);

      if (!expiredOrders || expiredOrders.length === 0) {
        return { processed: 0 };
      }

      logger.info(`[Payment Timeout Job] Found ${expiredOrders.length} expired order(s). Processing...`);

      for (const order of expiredOrders) {
        await conn.beginTransaction();
        try {
          // 1. Transition order to EXPIRED
          await conn.query(
            `UPDATE orders 
             SET status = 'EXPIRED', cancelled_at = NOW(), cancel_reason = 'Payment deadline expired (2 hours)', updated_at = NOW()
             WHERE id = ?`,
            [order.id]
          );

          // 2. Relist listing back to ACTIVE
          await conn.query(
            `UPDATE account_listings SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
            [order.listing_id]
          );

          // 3. Log status change
          await orderLogModel.logStatusChange({
            connection: conn,
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'EXPIRED',
            changedBy: null,
            note: 'Auto-expired: Payment deadline of 2 hours exceeded',
          });

          await conn.commit();
          notificationService.notifyOrderExpired(order).catch(() => {});
          logger.info(`[Payment Timeout Job] Order ${order.id} expired; listing ${order.listing_id} restored to ACTIVE.`);
        } catch (subErr) {
          await conn.rollback();
          logger.error(`[Payment Timeout Job] Failed to expire order ${order.id}: ${subErr.message}`);
        }
      }


      return { processed: expiredOrders.length };
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error(`[Payment Timeout Job Error]: ${err.message}`);
    return { processed: 0, error: err.message };
  }
};

/**
 * Start cron schedule: runs every 5 minutes
 */
const startPaymentTimeoutCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('[Payment Timeout Cron] Running 5-minute check...');
    await checkPaymentTimeouts();
  });
  logger.info('⏰ Payment timeout cron scheduled (every 5 minutes)');
};

module.exports = {
  checkPaymentTimeouts,
  startPaymentTimeoutCron,
};
