const auditModel = require('../../models/audit.model');
const db = require('../../config/db');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin Audit & Security Logs Controller
 */

/**
 * List audit logs with filters and pagination
 * GET /api/v1/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { actor_id, action, target_type, from, to } = req.query;

    const { logs, total } = await auditModel.findAll({
      actorId: actor_id,
      action,
      targetType: target_type,
      from,
      to,
      limit,
      offset,
    });

    return sendPaginated(res, logs, page, limit, total, 'Audit logs retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get detail of a specific audit log entry
 * GET /api/v1/admin/audit-logs/:id
 */
const getAuditLogDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const log = await auditModel.findById(id);

    if (!log) {
      throw new AppError(`Audit log with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { log }, 'Audit log detail retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * List handover access logs (Zero-Trust: does not include confidential account content)
 * GET /api/v1/admin/handover-access-logs
 */
const getHandoverAccessLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { order_id, user_id, from, to } = req.query;
    const conditions = [];
    const params = [];

    if (order_id) {
      conditions.push('hr.order_id = ?');
      params.push(Number(order_id));
    }

    if (user_id) {
      conditions.push('hal.user_id = ?');
      params.push(Number(user_id));
    }

    if (from) {
      conditions.push('hal.created_at >= ?');
      params.push(from);
    }

    if (to) {
      conditions.push('hal.created_at <= ?');
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM handover_access_logs hal
      JOIN handover_rooms hr ON hal.room_id = hr.id
      ${whereClause}
    `;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT hal.id, hal.room_id, hr.order_id, hal.user_id, hal.action,
             hal.ip_address, hal.user_agent, hal.created_at,
             u.display_name AS user_name, u.email AS user_email, u.role AS user_role
      FROM handover_access_logs hal
      JOIN handover_rooms hr ON hal.room_id = hr.id
      LEFT JOIN users u ON hal.user_id = u.id
      ${whereClause}
      ORDER BY hal.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataSql, [...params, limit, offset]);

    return sendPaginated(res, rows, page, limit, total, 'Handover access logs retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * List order status transition logs
 * GET /api/v1/admin/order-status-logs
 */
const getOrderStatusLogs = async (req, res, next) => {
  try {
    const { order_id } = req.query;
    const conditions = [];
    const params = [];

    if (order_id) {
      conditions.push('osl.order_id = ?');
      params.push(Number(order_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT osl.*, u.display_name AS changed_by_name, u.role AS changed_by_role
      FROM order_status_logs osl
      LEFT JOIN users u ON osl.changed_by = u.id
      ${whereClause}
      ORDER BY osl.created_at DESC
      LIMIT 100
    `;
    const [rows] = await db.query(sql, params);

    return sendSuccess(res, { logs: rows }, 'Order status logs retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * List escrow status transition logs
 * GET /api/v1/admin/escrow-status-logs
 */
const getEscrowStatusLogs = async (req, res, next) => {
  try {
    const { order_id, escrow_id } = req.query;
    const conditions = [];
    const params = [];

    if (order_id) {
      conditions.push('esl.order_id = ?');
      params.push(Number(order_id));
    }

    if (escrow_id) {
      conditions.push('esl.escrow_id = ?');
      params.push(Number(escrow_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT esl.*, u.display_name AS action_by_name, u.role AS action_by_role
      FROM escrow_status_logs esl
      LEFT JOIN users u ON esl.action_by = u.id
      ${whereClause}
      ORDER BY esl.created_at DESC
      LIMIT 100
    `;
    const [rows] = await db.query(sql, params);

    return sendSuccess(res, { logs: rows }, 'Escrow status logs retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogDetail,
  getHandoverAccessLogs,
  getOrderStatusLogs,
  getEscrowStatusLogs,
};
