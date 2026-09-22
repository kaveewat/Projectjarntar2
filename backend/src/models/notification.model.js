const db = require('../config/db');

/**
 * Notification Data Model
 */

/**
 * Create a new notification
 * @param {object} param0
 */
const create = async ({
  userId,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null,
}) => {
  const sql = `
    INSERT INTO notifications (
      user_id, type, title, message, reference_type, reference_id, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
  `;
  const [result] = await db.query(sql, [
    userId,
    type,
    title,
    message,
    referenceType,
    referenceId,
  ]);
  return result.insertId;
};

/**
 * Find notifications for a specific user with filtering and pagination
 * @param {object} param0
 */
const findByUser = async ({
  userId,
  isRead = null,
  limit = 20,
  offset = 0,
}) => {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (isRead !== null && isRead !== undefined) {
    conditions.push('is_read = ?');
    params.push(isRead ? 1 : 0);
  }

  const whereClause = conditions.join(' AND ');

  const countSql = `SELECT COUNT(*) AS total FROM notifications WHERE ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0].total;

  const dataSql = `
    SELECT id, user_id, type, title, message, reference_type, reference_id,
           is_read, read_at, created_at
    FROM notifications
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, [...params, limit, offset]);

  return {
    notifications: rows,
    total,
  };
};

/**
 * Count unread notifications for a user
 * @param {number} userId
 */
const countUnread = async (userId) => {
  const sql = `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`;
  const [rows] = await db.query(sql, [userId]);
  return rows[0].unread_count;
};

/**
 * Mark a single notification as read
 * @param {number} id
 * @param {number} userId
 */
const markRead = async (id, userId) => {
  const sql = `
    UPDATE notifications
    SET is_read = 1, read_at = NOW()
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await db.query(sql, [id, userId]);
  return result.affectedRows > 0;
};

/**
 * Mark all unread notifications as read for a user
 * @param {number} userId
 */
const markAllRead = async (userId) => {
  const sql = `
    UPDATE notifications
    SET is_read = 1, read_at = NOW()
    WHERE user_id = ? AND is_read = 0
  `;
  const [result] = await db.query(sql, [userId]);
  return result.affectedRows;
};

/**
 * Find single notification by ID and user
 * @param {number} id
 * @param {number} userId
 */
const findById = async (id, userId) => {
  const sql = `SELECT * FROM notifications WHERE id = ? AND user_id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [id, userId]);
  return rows[0] || null;
};

/**
 * Delete a notification
 * @param {number} id
 * @param {number} userId
 */
const deleteById = async (id, userId) => {
  const sql = `DELETE FROM notifications WHERE id = ? AND user_id = ?`;
  const [result] = await db.query(sql, [id, userId]);
  return result.affectedRows > 0;
};

module.exports = {
  create,
  findByUser,
  countUnread,
  markRead,
  markAllRead,
  findById,
  deleteById,
};
