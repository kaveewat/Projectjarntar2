const db = require('../config/db');

/**
 * Payment Transaction Model
 */

/**
 * Create a new payment record
 * @param {object} param0
 */
const createPayment = async ({
  connection = null,
  orderId,
  amount,
  paymentMethod = 'PROMPTPAY',
  paymentProofUrl,
  bankReference = null,
}) => {
  const client = connection || db;
  const sql = `
    INSERT INTO payments (
      order_id, amount, payment_method, payment_proof_url, bank_reference, status
    ) VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
  `;
  const [result] = await client.query(sql, [
    orderId,
    amount,
    paymentMethod,
    paymentProofUrl,
    bankReference,
  ]);
  return result.insertId;
};

/**
 * Find payment record by order ID
 * @param {number} orderId
 * @param {object} connection
 */
const findByOrderId = async (orderId, connection = null) => {
  const client = connection || db;
  const sql = `
    SELECT p.*, u.display_name AS reviewer_name
    FROM payments p
    LEFT JOIN users u ON p.reviewed_by = u.id
    WHERE p.order_id = ?
    ORDER BY p.id DESC
    LIMIT 1
  `;
  const [rows] = await client.query(sql, [orderId]);
  if (!rows || rows.length === 0) return null;

  return {
    ...rows[0],
    amount: Number(rows[0].amount),
  };
};

/**
 * Find payment by ID
 * @param {number} id
 */
const findById = async (id) => {
  const sql = `
    SELECT p.*, u.display_name AS reviewer_name
    FROM payments p
    LEFT JOIN users u ON p.reviewed_by = u.id
    WHERE p.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  return {
    ...rows[0],
    amount: Number(rows[0].amount),
  };
};

/**
 * Update payment review status
 * @param {object} param0
 */
const updateStatus = async ({
  connection = null,
  paymentId,
  status,
  reviewedBy,
  rejectReason = null,
}) => {
  const client = connection || db;
  const sql = `
    UPDATE payments 
    SET status = ?, reviewed_by = ?, reviewed_at = NOW(), reject_reason = ?
    WHERE id = ?
  `;
  const [result] = await client.query(sql, [status, reviewedBy, rejectReason, paymentId]);
  return result.affectedRows > 0;
};

module.exports = {
  createPayment,
  findByOrderId,
  findById,
  updateStatus,
};
