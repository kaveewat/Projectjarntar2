const db = require('../config/db');

/**
 * Append-only escrow status log model
 */

/**
 * Log escrow status transition
 * @param {object} param0
 */
const logEscrowChange = async ({
  connection = null,
  escrowId,
  orderId,
  fromStatus = null,
  toStatus,
  amount,
  actionBy = null,
  actionNote = null,
}) => {
  const client = connection || db;
  const sql = `
    INSERT INTO escrow_status_logs (escrow_id, order_id, from_status, to_status, amount, action_by, action_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await client.query(sql, [
    escrowId,
    orderId,
    fromStatus,
    toStatus,
    amount,
    actionBy,
    actionNote,
  ]);
  return result.insertId;
};

/**
 * Get all escrow transition logs for an order
 * @param {number} orderId
 */
const getLogsByOrderId = async (orderId) => {
  const sql = `
    SELECT esl.*, u.display_name AS action_by_name, u.role AS action_by_role
    FROM escrow_status_logs esl
    LEFT JOIN users u ON esl.action_by = u.id
    WHERE esl.order_id = ?
    ORDER BY esl.created_at ASC, esl.id ASC
  `;
  const [rows] = await db.query(sql, [orderId]);
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
};

module.exports = {
  logEscrowChange,
  getLogsByOrderId,
};
