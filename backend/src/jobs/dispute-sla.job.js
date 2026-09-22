const cron = require('node-cron');
const db = require('../config/db');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

let cronTask = null;

/**
  * Job 16.5: Check disputes approaching SLA deadline (< 12h left or opened > 36h)
  * Sends DISPUTE_SLA_WARNING (N25) to Admins and Moderators
  */
const checkDisputeSlaWarnings = async () => {
  try {
    const [disputes] = await db.query(`
      SELECT d.id, d.order_id, d.opened_by, d.status, d.opened_at, d.sla_deadline, o.order_number
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      WHERE d.status IN ('OPEN', 'UNDER_REVIEW')
        AND (
          d.sla_deadline <= DATE_ADD(NOW(), INTERVAL 12 HOUR)
          OR d.opened_at <= DATE_SUB(NOW(), INTERVAL 36 HOUR)
        )
    `);

    if (!disputes || disputes.length === 0) {
      return { processed: 0 };
    }

    let warnedCount = 0;
    for (const dispute of disputes) {
      // Prevent spamming: Check if notification was already dispatched in past 24 hours
      const [existingAlerts] = await db.query(
        `SELECT id FROM notifications 
         WHERE type = 'DISPUTE_SLA_WARNING' 
           AND reference_type = 'DISPUTE' 
           AND reference_id = ? 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         LIMIT 1`,
        [dispute.id]
      );

      if (existingAlerts.length === 0) {
        await notificationService.notifyDisputeSlaWarning(dispute);
        warnedCount++;
        logger.warn(`[Dispute SLA Job] Sent SLA warning for dispute #${dispute.id} (Order #${dispute.order_number})`);
      }
    }

    return { processed: warnedCount, total_flagged: disputes.length };
  } catch (err) {
    logger.error(`[Dispute SLA Job Error]: ${err.message}`);
    return { processed: 0, error: err.message };
  }
};

/**
 * Start cron schedule: runs every hour at minute 0
 */
const startDisputeSlaCron = () => {
  if (cronTask) {
    return cronTask;
  }
  cronTask = cron.schedule('0 * * * *', async () => {
    logger.debug('[Dispute SLA Cron] Running hourly SLA check...');
    await checkDisputeSlaWarnings();
  });
  logger.info('⏰ Dispute SLA warning cron scheduled (hourly)');
  return cronTask;
};

/**
 * Stop cron schedule
 */
const stopDisputeSlaCron = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('🛑 Dispute SLA warning cron stopped');
  }
};

module.exports = {
  checkDisputeSlaWarnings,
  startDisputeSlaCron,
  stopDisputeSlaCron,
};
