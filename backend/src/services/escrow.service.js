const db = require('../config/db');
const escrowModel = require('../models/escrow.model');
const paymentModel = require('../models/payment.model');
const orderLogModel = require('../models/order-status-log.model');
const notificationService = require('./notification.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Escrow Service: Hold, Release, Refund, and Payment Moderation
 */

/**
 * Moderator / Admin approves payment -> holds escrow & opens handover window (72h)
 * @param {object} param0
 */
const holdEscrow = async ({ orderId, adminId, note = 'Payment verified and approved by moderator' }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock order row
    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }

    const order = orders[0];
    if (order.status !== 'PAYMENT_SUBMITTED') {
      throw new AppError(
        `Cannot approve payment: Current order status is '${order.status}'. Only PAYMENT_SUBMITTED orders can be approved.`,
        422,
        'ORDER_WRONG_STATUS'
      );
    }

    // 2. Update payment status to APPROVED
    const [payments] = await conn.query(
      `SELECT id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [orderId]
    );

    if (payments && payments.length > 0) {
      await conn.query(
        `UPDATE payments SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
        [adminId, payments[0].id]
      );
    }

    // 3. Update order status to PAYMENT_APPROVED & set 72h handover deadline
    await conn.query(
      `UPDATE orders 
       SET status = 'PAYMENT_APPROVED', handover_deadline = DATE_ADD(NOW(), INTERVAL 72 HOUR), updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    // 4. Create escrow record in HELD state
    await escrowModel.createEscrow({
      connection: conn,
      orderId,
      amountHeld: Number(order.amount),
      platformFee: Number(order.platform_fee),
      sellerPayout: Number(order.seller_payout),
      actionBy: adminId,
      actionNote: note,
    });

    // 5. Append-only order status log
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: 'PAYMENT_SUBMITTED',
      toStatus: 'PAYMENT_APPROVED',
      changedBy: adminId,
      note,
    });

    await conn.commit();
    notificationService.notifyPaymentApproved(order).catch(() => {});

    return {
      order_id: orderId,
      status: 'PAYMENT_APPROVED',
      escrow_status: 'HELD',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Moderator / Admin rejects payment -> cancels order & relists listing
 * @param {object} param0
 */
const rejectPayment = async ({ orderId, adminId, reason }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }

    const order = orders[0];
    if (order.status !== 'PAYMENT_SUBMITTED') {
      throw new AppError(
        `Cannot reject payment: Current order status is '${order.status}'. Only PAYMENT_SUBMITTED orders can be rejected.`,
        422,
        'ORDER_WRONG_STATUS'
      );
    }

    // 1. Update payment status to REJECTED
    const [payments] = await conn.query(
      `SELECT id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [orderId]
    );

    if (payments && payments.length > 0) {
      await conn.query(
        `UPDATE payments SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ? WHERE id = ?`,
        [adminId, reason, payments[0].id]
      );
    }

    // 2. Update order to CANCELLED
    await conn.query(
      `UPDATE orders 
       SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_by = ?, cancel_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [adminId, reason, orderId]
    );

    // 3. Relist listing back to ACTIVE
    await conn.query(
      `UPDATE account_listings SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
      [order.listing_id]
    );

    // 4. Append-only order status log
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: 'PAYMENT_SUBMITTED',
      toStatus: 'CANCELLED',
      changedBy: adminId,
      note: `Payment rejected: ${reason}`,
    });

    await conn.commit();
    notificationService.notifyPaymentRejected(order, reason).catch(() => {});

    return {
      order_id: orderId,
      status: 'CANCELLED',
      listing_id: order.listing_id,
      listing_status: 'ACTIVE',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Release escrow to seller upon confirmed handover or auto-release
 * @param {object} param0
 */
const releaseEscrow = async ({ orderId, userId, note = 'Handover confirmed by buyer' }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }
    const order = orders[0];

    // 1. Update escrow to RELEASED
    await escrowModel.updateStatus({
      connection: conn,
      orderId,
      newStatus: 'RELEASED',
      actionBy: userId,
      actionNote: note,
    });

    // 2. Update order to COMPLETED
    await conn.query(
      `UPDATE orders SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // 3. Update listing to SOLD
    await conn.query(
      `UPDATE account_listings SET status = 'SOLD', sold_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [order.listing_id]
    );

    // 4. Create Seller Payout Record
    const [escrowRows] = await conn.query('SELECT id, seller_payout FROM escrow_records WHERE order_id = ?', [orderId]);
    if (escrowRows && escrowRows.length > 0) {
      const escrowRec = escrowRows[0];
      const payoutAmount = escrowRec.seller_payout || (Number(order.amount) - Number(order.platform_fee));
      await conn.query(
        `INSERT INTO seller_payouts (escrow_id, seller_id, amount, status, note, created_at, updated_at)
         VALUES (?, ?, ?, 'PENDING', ?, NOW(), NOW())`,
        [escrowRec.id, order.seller_id, payoutAmount, `Automated payout upon escrow release for order #${order.order_number}`]
      );
    }

    // 5. Log order status
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: order.status,
      toStatus: 'COMPLETED',
      changedBy: userId,
      note,
    });

    await conn.commit();
    notificationService.notifyHandoverConfirmed(order).catch(() => {});
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Refund escrow back to buyer (timeout or dispute resolution)
 * @param {object} param0
 */
const refundEscrow = async ({ orderId, adminId, reason = 'Refunded to buyer' }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }
    const order = orders[0];

    // 1. Update escrow to REFUNDED
    await escrowModel.updateStatus({
      connection: conn,
      orderId,
      newStatus: 'REFUNDED',
      actionBy: adminId,
      actionNote: reason,
    });

    // 2. Update order to REFUNDED
    await conn.query(
      `UPDATE orders 
       SET status = 'REFUNDED', cancelled_at = NOW(), cancelled_by = ?, cancel_reason = ?, updated_at = NOW() 
       WHERE id = ?`,
      [adminId, reason, orderId]
    );

    // 3. Relist listing to ACTIVE
    await conn.query(
      `UPDATE account_listings SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
      [order.listing_id]
    );

    // 4. Log order status
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: order.status,
      toStatus: 'REFUNDED',
      changedBy: adminId,
      note: reason,
    });

    await conn.commit();
    notificationService.notify({
      userId: order.buyer_id,
      type: 'ESCROW_REFUNDED',
      title: 'คืนเงิน Escrow สำเร็จ',
      message: `คำสั่งซื้อ #${order.order_number} ได้รับการคืนเงินจำนวน ฿${order.amount} เรียบร้อยแล้ว (${reason})`,
      referenceType: 'ORDER',
      referenceId: order.id,
    }).catch(() => {});
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  holdEscrow,
  rejectPayment,
  releaseEscrow,
  refundEscrow,
};
