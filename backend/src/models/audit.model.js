const db = require('../config/db');

/**
 * Audit Logs Data Model
 */

/**
 * Record a new audit log entry
 * @param {object} param0
 */
const createLog = async ({
  actorId,
  action,
  targetType,
  targetId,
  beforeData = null,
  afterData = null,
  ipAddress = null,
}) => {
  const sql = `
    INSERT INTO audit_logs (
      actor_id, action, target_type, target_id, before_data, after_data, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await db.query(sql, [
    actorId,
    action,
    targetType,
    targetId,
    beforeData ? JSON.stringify(beforeData) : null,
    afterData ? JSON.stringify(afterData) : null,
    ipAddress,
  ]);
  return result.insertId;
};

/**
 * Find audit logs with filters and pagination
 * @param {object} param0
 */
const findAll = async ({
  actorId = null,
  action = null,
  targetType = null,
  from = null,
  to = null,
  limit = 20,
  offset = 0,
}) => {
  const conditions = [];
  const params = [];

  if (actorId) {
    conditions.push('al.actor_id = ?');
    params.push(Number(actorId));
  }

  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }

  if (targetType) {
    conditions.push('al.target_type = ?');
    params.push(targetType);
  }

  if (from) {
    conditions.push('al.created_at >= ?');
    params.push(from);
  }

  if (to) {
    conditions.push('al.created_at <= ?');
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0].total;

  const dataSql = `
    SELECT al.*,
           u.display_name AS actor_name,
           u.email AS actor_email,
           u.role AS actor_role
    FROM audit_logs al
    LEFT JOIN users u ON al.actor_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, [...params, limit, offset]);

  const parsedLogs = rows.map((log) => ({
    ...log,
    before_data: typeof log.before_data === 'string' ? JSON.parse(log.before_data) : log.before_data,
    after_data: typeof log.after_data === 'string' ? JSON.parse(log.after_data) : log.after_data,
  }));

  return {
    logs: parsedLogs,
    total,
  };
};

/**
 * Find single audit log entry by ID
 * @param {number} id
 */
const findById = async (id) => {
  if (!id || isNaN(Number(id))) return null;

  const sql = `
    SELECT al.*,
           u.display_name AS actor_name,
           u.email AS actor_email,
           u.role AS actor_role
    FROM audit_logs al
    LEFT JOIN users u ON al.actor_id = u.id
    WHERE al.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const log = rows[0];
  return {
    ...log,
    before_data: typeof log.before_data === 'string' ? JSON.parse(log.before_data) : log.before_data,
    after_data: typeof log.after_data === 'string' ? JSON.parse(log.after_data) : log.after_data,
  };
};

module.exports = {
  createLog,
  findAll,
  findById,
};
