const db = require('../config/db');

/**
 * Handover Room & Credential Vault Model
 */

/**
 * Get existing handover room or create one
 * @param {number} orderId
 * @param {Date|string} expiresAt
 */
const getOrCreateRoom = async (orderId, expiresAt = null) => {
  const [existing] = await db.query(
    'SELECT * FROM handover_rooms WHERE order_id = ? LIMIT 1',
    [orderId]
  );

  if (existing && existing.length > 0) {
    return existing[0];
  }

  // Create new room with 72-hour default deadline
  const sql = `
    INSERT INTO handover_rooms (order_id, status, opened_at, expires_at)
    VALUES (?, 'WAITING_SELLER', NOW(), COALESCE(?, DATE_ADD(NOW(), INTERVAL 72 HOUR)))
  `;
  const [result] = await db.query(sql, [orderId, expiresAt]);
  const roomId = result.insertId;

  // Query order to attribute initial room opening
  const [orderRows] = await db.query('SELECT buyer_id, seller_id FROM orders WHERE id = ?', [orderId]);
  const defaultUserId = (orderRows && orderRows[0]?.buyer_id) || 1;

  // Log room opened
  await logAccess({
    roomId,
    userId: defaultUserId,
    action: 'ROOM_OPENED',
    ipAddress: '127.0.0.1',
    userAgent: 'System Handover Initializer',
  });

  const [created] = await db.query('SELECT * FROM handover_rooms WHERE id = ?', [roomId]);
  return created[0];
};

/**
 * Find room by order ID
 * @param {number} orderId
 */
const findByOrderId = async (orderId) => {
  const [rows] = await db.query(
    'SELECT * FROM handover_rooms WHERE order_id = ? LIMIT 1',
    [orderId]
  );
  return rows[0] || null;
};

/**
 * Update room fields (status, timestamps, etc.)
 * @param {number} roomId
 * @param {object} fields
 */
const updateRoom = async (roomId, fields = {}) => {
  const allowed = [
    'status',
    'seller_submitted_at',
    'buyer_confirmed_at',
    'expires_at',
    'auto_release_at',
    'data_deleted_at',
  ];

  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return false;

  const setClauses = entries.map(([k]) => `\`${k}\` = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  values.push(roomId);

  const sql = `UPDATE handover_rooms SET ${setClauses} WHERE id = ?`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Store encrypted credentials in handover_messages
 * @param {number} roomId
 * @param {string} senderRole - 'SELLER' | 'SYSTEM'
 * @param {string} contentEncrypted - Hex ciphertext + auth tag
 * @param {string} encryptionIv - Hex IV
 */
const saveEncryptedMessage = async (roomId, senderRole, contentEncrypted, encryptionIv) => {
  const sql = `
    INSERT INTO handover_messages (room_id, sender_role, content_encrypted, encryption_iv)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    roomId,
    senderRole,
    contentEncrypted,
    encryptionIv,
  ]);
  return result.insertId;
};

/**
 * Get active encrypted message for room
 * @param {number} roomId
 */
const getMessageByRoomId = async (roomId) => {
  const sql = `
    SELECT * FROM handover_messages 
    WHERE room_id = ? 
    ORDER BY id DESC 
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [roomId]);
  return rows[0] || null;
};

/**
 * Hard delete credentials upon confirmation (Purge confidential data)
 * @param {number} roomId
 */
const hardDeleteMessages = async (roomId) => {
  const sql = `DELETE FROM handover_messages WHERE room_id = ?`;
  const [result] = await db.query(sql, [roomId]);
  return result.affectedRows;
};

/**
 * Log handover room access with IP and action
 * @param {object} param0
 */
const logAccess = async ({
  roomId,
  userId = null,
  action,
  ipAddress = null,
  userAgent = null,
  connection = null,
}) => {
  const client = connection || db;
  const effectiveUserId = userId || 1;
  const effectiveIp = ipAddress || '127.0.0.1';
  const sql = `
    INSERT INTO handover_access_logs (room_id, user_id, action, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await client.query(sql, [
    roomId,
    effectiveUserId,
    action,
    effectiveIp,
    userAgent ? userAgent.substring(0, 500) : null,
  ]);
  return result.insertId;
};

/**
 * Get access logs for an order's handover room
 * @param {number} orderId
 */
const getAccessLogsByOrderId = async (orderId) => {
  const sql = `
    SELECT hal.*, u.display_name AS user_name, u.role AS user_role
    FROM handover_access_logs hal
    JOIN handover_rooms hr ON hal.room_id = hr.id
    LEFT JOIN users u ON hal.user_id = u.id
    WHERE hr.order_id = ?
    ORDER BY hal.created_at ASC, hal.id ASC
  `;
  const [rows] = await db.query(sql, [orderId]);
  return rows;
};

module.exports = {
  getOrCreateRoom,
  findByOrderId,
  updateRoom,
  saveEncryptedMessage,
  getMessageByRoomId,
  hardDeleteMessages,
  logAccess,
  getAccessLogsByOrderId,
};
