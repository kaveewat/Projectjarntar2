const db = require('../config/db');
const disputeModel = require('../models/dispute.model');
const orderModel = require('../models/order.model');
const escrowModel = require('../models/escrow.model');
const escrowService = require('./escrow.service');
const handoverModel = require('../models/handover.model');
const orderLogModel = require('../models/order-status-log.model');
const notificationService = require('./notification.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Dispute Resolution Service: Open, Freeze Escrow, Resolve Seller/Buyer
 */

/**
 * Buyer opens a formal dispute -> freezes escrow & updates order/room
 * @param {object} param0
 */
const openDispute = async ({ orderId, buyerId, disputeReasonId, description }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }

    const order = orders[0];
    if (order.buyer_id !== buyerId) {
      throw new AppError('Only the buyer of this order can open a dispute', 403, 'FORBIDDEN');
    }

    const allowed = ['PAYMENT_APPROVED', 'HANDOVER_OPEN', 'HANDOVER_INFO_PROVIDED', 'BUYER_REVIEWING'];
    if (!allowed.includes(order.status)) {
      throw new AppError(
        `Cannot open dispute: Current order status is '${order.status}'. Disputes can only be opened during active handover.`,
        422,
        'ORDER_WRONG_STATUS'
      );
    }

    const [disputeRows] = await conn.query('SELECT id FROM disputes WHERE order_id = ? LIMIT 1', [orderId]);
    if (disputeRows && disputeRows.length > 0) {
      throw new AppError('A dispute is already open for this order', 409, 'DISPUTE_ALREADY_EXISTS');
    }

    // 1. Create dispute record
    const disputeId = await disputeModel.createDispute({
      orderId,
      openedBy: buyerId,
      disputeReasonId,
      description,
      connection: conn,
    });

    // 2. Freeze Escrow funds
    await escrowModel.updateStatus({
      connection: conn,
      orderId,
      newStatus: 'FROZEN',
      actionBy: buyerId,
      actionNote: `Dispute opened by buyer: ${description.substring(0, 100)}`,
    });

    // 3. Update order status to DISPUTED
    await conn.query(
      `UPDATE orders SET status = 'DISPUTED', updated_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // 4. Log order status
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: order.status,
      toStatus: 'DISPUTED',
      changedBy: buyerId,
      note: `Dispute opened: ${description}`,
    });

    // 5. Update handover room status to DISPUTED if room exists
    const [roomRows] = await conn.query('SELECT id FROM handover_rooms WHERE order_id = ? LIMIT 1', [orderId]);
    if (roomRows && roomRows.length > 0) {
      const roomId = roomRows[0].id;
      await conn.query(
        `UPDATE handover_rooms SET status = 'DISPUTED' WHERE id = ?`,
        [roomId]
      );
      await handoverModel.logAccess({
        roomId,
        userId: buyerId,
        action: 'DISPUTE_OPENED',
        connection: conn,
      });
    }

    await conn.commit();

    const createdDispute = await disputeModel.findById(disputeId);
    notificationService.notifyDisputeOpened(createdDispute, order).catch(() => {});
    return createdDispute;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Admin resolves dispute in favor of Seller -> Releases Escrow & marks Order COMPLETED
 * @param {object} param0
 */
const resolveForSeller = async ({ disputeId, adminId, resolutionNote }) => {
  const dispute = await disputeModel.findById(disputeId);
  if (!dispute) {
    throw new AppError(`Dispute with ID ${disputeId} not found`, 404, 'NOT_FOUND');
  }

  if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
    throw new AppError(
      `Cannot resolve dispute: Current status is '${dispute.status}'.`,
      422,
      'DISPUTE_ALREADY_RESOLVED'
    );
  }

  // 1. Release escrow funds to seller
  await escrowService.releaseEscrow({
    orderId: dispute.order_id,
    userId: adminId,
    note: `Dispute resolved in favor of seller: ${resolutionNote}`,
  });

  // 2. Mark dispute as RESOLVED_SELLER
  await disputeModel.resolveDispute(disputeId, {
    status: 'RESOLVED_SELLER',
    resolvedBy: adminId,
    resolutionNote,
  });

  notificationService.notifyDisputeResolved(
    dispute,
    { id: dispute.order_id, seller_id: dispute.seller_id, buyer_id: dispute.buyer_id, amount: dispute.order_amount },
    'SELLER'
  ).catch(() => {});

  return disputeModel.findById(disputeId);
};

/**
 * Admin resolves dispute in favor of Buyer -> Refunds Escrow & relists Listing to ACTIVE
 * @param {object} param0
 */
const resolveForBuyer = async ({ disputeId, adminId, resolutionNote }) => {
  const dispute = await disputeModel.findById(disputeId);
  if (!dispute) {
    throw new AppError(`Dispute with ID ${disputeId} not found`, 404, 'NOT_FOUND');
  }

  if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
    throw new AppError(
      `Cannot resolve dispute: Current status is '${dispute.status}'.`,
      422,
      'DISPUTE_ALREADY_RESOLVED'
    );
  }

  // 1. Refund escrow funds to buyer & relist listing to ACTIVE
  await escrowService.refundEscrow({
    orderId: dispute.order_id,
    adminId,
    reason: `Dispute resolved in favor of buyer: ${resolutionNote}`,
  });

  // 2. Mark dispute as RESOLVED_BUYER
  await disputeModel.resolveDispute(disputeId, {
    status: 'RESOLVED_BUYER',
    resolvedBy: adminId,
    resolutionNote,
  });

  notificationService.notifyDisputeResolved(
    dispute,
    { id: dispute.order_id, seller_id: dispute.seller_id, buyer_id: dispute.buyer_id, amount: dispute.order_amount },
    'BUYER'
  ).catch(() => {});

  return disputeModel.findById(disputeId);
};

module.exports = {
  openDispute,
  resolveForSeller,
  resolveForBuyer,
};
