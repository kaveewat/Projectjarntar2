const db = require('../config/db');

/**
 * Seller Payouts Model
 */

/**
 * Create a new seller payout request/record
 * @param {object} param0
 */
const create = async ({
  escrowId,
  sellerId,
  amount,
  bankName = null,
  bankAccountNumber = null,
  bankAccountName = null,
  note = null,
}) => {
  const sql = `
    INSERT INTO seller_payouts (
      escrow_id, seller_id, amount, bank_name, bank_account_number, bank_account_name,
      status, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), NOW())
  `;
  const [result] = await db.query(sql, [
    escrowId,
    sellerId,
    amount,
    bankName,
    bankAccountNumber,
    bankAccountName,
    note,
  ]);
  return result.insertId;
};

/**
 * Find payouts by seller ID
 * @param {number} sellerId
 * @param {object} param1
 */
const findBySeller = async (sellerId, { limit = 20, offset = 0 } = {}) => {
  const countSql = `SELECT COUNT(*) AS total FROM seller_payouts WHERE seller_id = ?`;
  const [countRows] = await db.query(countSql, [sellerId]);
  const total = countRows[0].total;

  const dataSql = `
    SELECT sp.*, er.order_id, o.order_number
    FROM seller_payouts sp
    JOIN escrow_records er ON sp.escrow_id = er.id
    JOIN orders o ON er.order_id = o.id
    WHERE sp.seller_id = ?
    ORDER BY sp.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, [sellerId, limit, offset]);

  return { payouts: rows, total };
};

/**
 * Find all payouts (Admin)
 * @param {object} param0
 */
const findAll = async ({ status = null, limit = 20, offset = 0 } = {}) => {
  const conditions = [];
  const params = [];

  if (status && status !== 'ALL') {
    conditions.push('sp.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM seller_payouts sp ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0].total;

  const dataSql = `
    SELECT sp.*, u.display_name AS seller_name, u.email AS seller_email,
           er.order_id, o.order_number,
           u_proc.display_name AS processed_by_name
    FROM seller_payouts sp
    JOIN users u ON sp.seller_id = u.id
    JOIN escrow_records er ON sp.escrow_id = er.id
    JOIN orders o ON er.order_id = o.id
    LEFT JOIN users u_proc ON sp.processed_by = u_proc.id
    ${whereClause}
    ORDER BY sp.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, [...params, limit, offset]);

  return { payouts: rows, total };
};

/**
 * Find payout by ID
 * @param {number} id
 */
const findById = async (id) => {
  if (!id || isNaN(Number(id))) return null;
  const sql = `
    SELECT sp.*, u.display_name AS seller_name, u.email AS seller_email,
           er.order_id, o.order_number
    FROM seller_payouts sp
    JOIN users u ON sp.seller_id = u.id
    JOIN escrow_records er ON sp.escrow_id = er.id
    JOIN orders o ON er.order_id = o.id
    WHERE sp.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
};

/**
 * Update payout status (Admin)
 * @param {number} id
 * @param {object} param1
 */
const updateStatus = async (id, { status, processedBy, bankReference = null, transferSlipUrl = null, note = null }) => {
  const sql = `
    UPDATE seller_payouts
    SET status = ?,
        processed_by = ?,
        processed_at = NOW(),
        bank_reference = COALESCE(?, bank_reference),
        transfer_slip_url = COALESCE(?, transfer_slip_url),
        note = COALESCE(?, note),
        updated_at = NOW()
    WHERE id = ?
  `;
  const [result] = await db.query(sql, [status, processedBy, bankReference, transferSlipUrl, note, id]);
  return result.affectedRows > 0;
};

module.exports = {
  create,
  findBySeller,
  findAll,
  findById,
  updateStatus,
};
