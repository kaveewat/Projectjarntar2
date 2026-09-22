const db = require('../config/db');

/**
 * Append-only order status log model
 */

/**
 * Log order status transition
 * @param {object} param0
 */
const logStatusChange = async ({
  connection = null,
  orderId,
  fromStatus = null,
  toStatus,
  changedBy = null,
  note = null,
}) => {
  const client = connection || db;
  const sql = `
    INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, note)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await client.query(sql, [
    orderId,
    fromStatus,
    toStatus,
    changedBy,
    note,
  ]);
  return result.insertId;
};

/**
 * Get all status transition logs for an order
 * @param {number} orderId
 */
const getLogsByOrderId = async (orderId) => {
  const sql = `
    SELECT osl.*, u.display_name AS changed_by_name, u.role AS changed_by_role
    FROM order_status_logs osl
    LEFT JOIN users u ON osl.changed_by = u.id
    WHERE osl.order_id = ?
    ORDER BY osl.created_at ASC, osl.id ASC
  `;
  const [rows] = await db.query(sql, [orderId]);
  return rows;
};

module.exports = {
  logStatusChange,
  getLogsByOrderId,
};
