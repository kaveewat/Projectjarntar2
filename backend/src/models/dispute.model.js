const db = require('../config/db');

/**
 * Dispute Resolution Model
 */

/**
 * Create a new dispute with 48h SLA deadline
 * @param {object} param0
 */
const createDispute = async ({
  orderId,
  openedBy,
  disputeReasonId,
  description,
  connection = null,
}) => {
  const client = connection || db;
  const sql = `
    INSERT INTO disputes (
      order_id, opened_by, dispute_reason_id, description,
      status, opened_at, sla_deadline
    ) VALUES (?, ?, ?, ?, 'OPEN', NOW(), DATE_ADD(NOW(), INTERVAL 48 HOUR))
  `;
  const [result] = await client.query(sql, [
    orderId,
    openedBy,
    disputeReasonId,
    description.trim(),
  ]);
  return result.insertId;
};

/**
 * Find dispute by ID with full details
 * @param {number} id
 */
const findById = async (id) => {
  if (!id || isNaN(Number(id))) return null;
  const sql = `
    SELECT d.*,
           dr.code AS reason_code, dr.description_th AS reason_title,
           u_open.display_name AS opened_by_name, u_open.role AS opened_by_role,
           u_assign.display_name AS assigned_to_name,
           u_res.display_name AS resolved_by_name,
           o.order_number, o.amount AS order_amount, o.buyer_id, o.seller_id,
           l.title AS listing_title
    FROM disputes d
    LEFT JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
    LEFT JOIN users u_open ON d.opened_by = u_open.id
    LEFT JOIN users u_assign ON d.assigned_to = u_assign.id
    LEFT JOIN users u_res ON d.resolved_by = u_res.id
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN account_listings l ON o.listing_id = l.id
    WHERE d.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  return {
    ...rows[0],
    order_amount: rows[0].order_amount ? Number(rows[0].order_amount) : null,
  };
};

/**
 * Find dispute by order ID
 * @param {number} orderId
 */
const findByOrderId = async (orderId) => {
  if (!orderId || isNaN(Number(orderId))) return null;
  const sql = `
    SELECT d.*, dr.code AS reason_code, dr.description_th AS reason_title
    FROM disputes d
    LEFT JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
    WHERE d.order_id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [orderId]);
  return rows[0] || null;
};

/**
 * Find disputes with filters and pagination
 * @param {object} param0
 */
const findAll = async ({
  userId = null,
  status = null,
  assignedTo = null,
  limit = 20,
  offset = 0,
}) => {
  const conditions = [];
  const params = [];

  if (userId) {
    conditions.push('(o.buyer_id = ? OR o.seller_id = ?)');
    params.push(userId, userId);
  }

  if (status && status !== 'ALL') {
    conditions.push('d.status = ?');
    params.push(status);
  }

  if (assignedTo) {
    conditions.push('d.assigned_to = ?');
    params.push(assignedTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS total 
    FROM disputes d
    LEFT JOIN orders o ON d.order_id = o.id
    ${whereClause}
  `;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0] ? countRows[0].total : 0;

  const queryParams = [...params, Number(limit), Number(offset)];
  const dataSql = `
    SELECT d.*,
           dr.code AS reason_code, dr.description_th AS reason_title,
           o.order_number, o.amount AS order_amount, o.buyer_id, o.seller_id,
           u_open.display_name AS opened_by_name,
           u_assign.display_name AS assigned_to_name
    FROM disputes d
    LEFT JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN users u_open ON d.opened_by = u_open.id
    LEFT JOIN users u_assign ON d.assigned_to = u_assign.id
    ${whereClause}
    ORDER BY d.opened_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, queryParams);

  return {
    disputes: rows.map((r) => ({
      ...r,
      order_amount: r.order_amount ? Number(r.order_amount) : null,
    })),
    total,
  };
};

/**
 * Get active dispute reasons
 */
const getReasons = async () => {
  const sql = `SELECT id, code, description_th FROM dispute_reasons WHERE is_active = 1 ORDER BY id ASC`;
  const [rows] = await db.query(sql);
  return rows;
};

/**
 * Add evidence file to dispute
 * @param {object} param0
 */
const addEvidence = async ({ disputeId, uploadedBy, fileUrl, fileType = 'IMAGE', description = null }) => {
  const sql = `
    INSERT INTO dispute_evidence (dispute_id, uploaded_by, file_url, file_type, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [disputeId, uploadedBy, fileUrl, fileType, description]);
  return result.insertId;
};

/**
 * Get all evidence for dispute
 * @param {number} disputeId
 */
const getEvidence = async (disputeId) => {
  const sql = `
    SELECT de.*, u.display_name AS uploaded_by_name
    FROM dispute_evidence de
    LEFT JOIN users u ON de.uploaded_by = u.id
    WHERE de.dispute_id = ?
    ORDER BY de.created_at ASC
  `;
  const [rows] = await db.query(sql, [disputeId]);
  return rows;
};

/**
 * Add comment to dispute
 * @param {object} param0
 */
const addComment = async ({ disputeId, authorId, message, isInternal = false }) => {
  const sql = `
    INSERT INTO dispute_comments (dispute_id, author_id, message, is_internal)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [disputeId, authorId, message, isInternal ? 1 : 0]);
  return result.insertId;
};

/**
 * Get comments for dispute (respects is_internal visibility)
 * @param {number} disputeId
 * @param {boolean} includeInternal
 */
const getComments = async (disputeId, includeInternal = false) => {
  const where = includeInternal ? 'WHERE dc.dispute_id = ?' : 'WHERE dc.dispute_id = ? AND dc.is_internal = 0';
  const sql = `
    SELECT dc.*, u.display_name AS author_name, u.role AS author_role
    FROM dispute_comments dc
    LEFT JOIN users u ON dc.author_id = u.id
    ${where}
    ORDER BY dc.created_at ASC
  `;
  const [rows] = await db.query(sql, [disputeId]);
  return rows;
};

/**
 * Assign dispute to moderator
 * @param {number} disputeId
 * @param {number} moderatorId
 */
const assignDispute = async (disputeId, moderatorId) => {
  const sql = `
    UPDATE disputes 
    SET assigned_to = ?, status = 'UNDER_REVIEW' 
    WHERE id = ?
  `;
  const [result] = await db.query(sql, [moderatorId, disputeId]);
  return result.affectedRows > 0;
};

/**
 * Resolve dispute
 * @param {number} disputeId
 * @param {object} param1
 */
const resolveDispute = async (disputeId, { status, resolvedBy, resolutionNote }) => {
  const sql = `
    UPDATE disputes 
    SET status = ?, resolved_by = ?, resolved_at = NOW(), resolution_note = ? 
    WHERE id = ?
  `;
  const [result] = await db.query(sql, [status, resolvedBy, resolutionNote, disputeId]);
  return result.affectedRows > 0;
};

module.exports = {
  createDispute,
  findById,
  findByOrderId,
  findAll,
  getReasons,
  addEvidence,
  getEvidence,
  addComment,
  getComments,
  assignDispute,
  resolveDispute,
};
