const cron = require('node-cron');
const db = require('../config/db');
const escrowService = require('../services/escrow.service');
const handoverModel = require('../models/handover.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

let cronTask = null;

/**
 * Job 8.11: Auto-release escrow to seller if buyer does not confirm or dispute within 48 hours
 */
const checkBuyerAutoRelease = async () => {
  try {
    const [rooms] = await db.query(`
      SELECT id, order_id, status, auto_release_at 
      FROM handover_rooms 
      WHERE status IN ('INFO_PROVIDED', 'BUYER_REVIEWING')
        AND (auto_release_at <= NOW() OR seller_submitted_at <= DATE_SUB(NOW(), INTERVAL 48 HOUR))
    `);

    if (!rooms || rooms.length === 0) {
      return { processed: 0 };
    }

    logger.info(`[Auto-Release Job] Found ${rooms.length} room(s) past 48h buyer review deadline. Releasing...`);

    let count = 0;
    for (const room of rooms) {
      try {
        // Fetch order details before release
        const [orders] = await db.query(`SELECT * FROM orders WHERE id = ?`, [room.order_id]);
        const order = orders && orders[0] ? orders[0] : null;

        // 1. Release escrow to seller & mark order as COMPLETED
        await escrowService.releaseEscrow({
          orderId: room.order_id,
          userId: null,
          note: 'Auto-released: 48-hour buyer review period expired without problem report',
        });

        // 2. Hard delete confidential credentials
        await handoverModel.hardDeleteMessages(room.id);

        // 3. Update room status to AUTO_RELEASED
        await handoverModel.updateRoom(room.id, {
          status: 'AUTO_RELEASED',
          data_deleted_at: new Date(),
        });

        // 4. Log access event
        await handoverModel.logAccess({
          roomId: room.id,
          userId: null,
          action: 'ROOM_CLOSED',
          ipAddress: 'SYSTEM',
          userAgent: 'Auto-Release Cron Job',
        });

        // 5. Trigger notifications (N13 & N14)
        if (order) {
          await notificationService.notifyAutoReleased(order);
        }

        count++;
        logger.info(`[Auto-Release Job] Room ${room.id} (Order ${room.order_id}) auto-released to seller and credentials purged.`);
      } catch (subErr) {
        logger.error(`[Auto-Release Job] Failed to auto-release order ${room.order_id}: ${subErr.message}`);
      }
    }

    return { processed: count };
  } catch (err) {
    logger.error(`[Auto-Release Job Error]: ${err.message}`);
    return { processed: 0, error: err.message };
  }
};

/**
 * Start cron schedule: runs every 15 minutes
 */
const startBuyerAutoReleaseCron = () => {
  if (cronTask) return cronTask;
  cronTask = cron.schedule('*/15 * * * *', async () => {
    logger.debug('[Auto-Release Cron] Running 15-minute check...');
    await checkBuyerAutoRelease();
  });
  logger.info('⏰ Buyer auto-release cron scheduled (every 15 minutes)');
  return cronTask;
};

/**
 * Stop cron schedule
 */
const stopBuyerAutoReleaseCron = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('🛑 Buyer auto-release cron stopped');
  }
};

module.exports = {
  checkBuyerAutoRelease,
  startBuyerAutoReleaseCron,
  stopBuyerAutoReleaseCron,
};

