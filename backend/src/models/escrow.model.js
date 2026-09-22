const db = require('../config/db');
const escrowLogModel = require('./escrow-status-log.model');

/**
 * Escrow Record Model
 */

/**
 * Create a new escrow record in HELD state
 * @param {object} param0
 */
const createEscrow = async ({
  connection = null,
  orderId,
  amountHeld,
  platformFee,
  sellerPayout,
  actionBy = null,
  actionNote = 'Escrow held upon payment approval',
}) => {
  const client = connection || db;
  const sql = `
    INSERT INTO escrow_records (
      order_id, amount_held, platform_fee, seller_payout,
      status, held_at, action_by, action_note
    ) VALUES (?, ?, ?, ?, 'HELD', NOW(), ?, ?)
  `;
  const [result] = await client.query(sql, [
    orderId,
    amountHeld,
    platformFee,
    sellerPayout,
    actionBy,
    actionNote,
  ]);

  const escrowId = result.insertId;

  // Append-only log
  await escrowLogModel.logEscrowChange({
    connection: client,
    escrowId,
    orderId,
    fromStatus: null,
    toStatus: 'HELD',
    amount: amountHeld,
    actionBy,
    actionNote,
  });

  return escrowId;
};

/**
 * Update escrow status (RELEASED, REFUNDED, FROZEN)
 * @param {object} param0
 */
const updateStatus = async ({
  connection = null,
  orderId,
  newStatus,
  actionBy = null,
  actionNote = null,
}) => {
  const client = connection || db;

  // Get current record first
  const [current] = await client.query('SELECT * FROM escrow_records WHERE order_id = ?', [orderId]);
  if (!current || current.length === 0) return null;

  const escrow = current[0];
  const fromStatus = escrow.status;

  const updates = ['status = ?', 'action_by = ?', 'action_note = ?'];
  const params = [newStatus, actionBy, actionNote];

  if (newStatus === 'RELEASED') {
    updates.push('released_at = NOW()');
  } else if (newStatus === 'REFUNDED') {
    updates.push('refunded_at = NOW()');
  }

  params.push(orderId);
  const sql = `UPDATE escrow_records SET ${updates.join(', ')} WHERE order_id = ?`;
  await client.query(sql, params);

  // Append-only log
  await escrowLogModel.logEscrowChange({
    connection: client,
    escrowId: escrow.id,
    orderId,
    fromStatus,
    toStatus: newStatus,
    amount: Number(escrow.amount_held),
    actionBy,
    actionNote,
  });

  return true;
};

/**
 * Find escrow record by order ID
 * @param {number} orderId
 * @param {object} connection
 */
const findByOrderId = async (orderId, connection = null) => {
  const client = connection || db;
  const sql = `SELECT * FROM escrow_records WHERE order_id = ? LIMIT 1`;
  const [rows] = await client.query(sql, [orderId]);
  if (!rows || rows.length === 0) return null;

  return {
    ...rows[0],
    amount_held: Number(rows[0].amount_held),
    platform_fee: Number(rows[0].platform_fee),
    seller_payout: Number(rows[0].seller_payout),
  };
};

/**
 * Get Escrow overview for Admin
 */
const getOverview = async () => {
  const sumSql = `
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'HELD' THEN amount_held ELSE 0 END), 0) AS total_held,
      COALESCE(SUM(CASE WHEN status = 'RELEASED' THEN amount_held ELSE 0 END), 0) AS total_released,
      COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount_held ELSE 0 END), 0) AS total_refunded,
      COUNT(*) AS total_records
    FROM escrow_records
  `;
  const [sumRows] = await db.query(sumSql);

  const listSql = `
    SELECT e.*, o.order_number, o.buyer_id, o.seller_id
    FROM escrow_records e
    LEFT JOIN orders o ON e.order_id = o.id
    ORDER BY e.held_at DESC
    LIMIT 20
  `;
  const [records] = await db.query(listSql);

  return {
    total_held: Number(sumRows[0].total_held),
    total_released: Number(sumRows[0].total_released),
    total_refunded: Number(sumRows[0].total_refunded),
    total_records: sumRows[0].total_records,
    records: records.map((r) => ({
      ...r,
      amount_held: Number(r.amount_held),
      platform_fee: Number(r.platform_fee),
      seller_payout: Number(r.seller_payout),
    })),
  };
};

module.exports = {
  createEscrow,
  updateStatus,
  findByOrderId,
  getOverview,
};
