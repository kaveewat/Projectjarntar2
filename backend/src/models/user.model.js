const db = require('../config/db');

const SAFE_COLUMNS = [
  'id',
  'email',
  'display_name',
  'phone',
  'line_id',
  'role',
  'is_verified',
  'is_suspended',
  'is_banned',
  'email_verified_at',
  'last_login_at',
  'created_at',
  'updated_at',
].join(', ');

/**
 * Find user by email (includes password_hash for authentication)
 * @param {string} email
 * @returns {Promise<object|null>}
 */
const findByEmail = async (email) => {
  const sql = `
    SELECT id, email, password_hash, display_name, phone, line_id, role, 
           is_verified, is_suspended, is_banned, email_verified_at, last_login_at, 
           created_at, updated_at
    FROM users 
    WHERE email = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [email.toLowerCase().trim()]);
  return rows[0] || null;
};

/**
 * Find user by ID (excludes password_hash)
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const sql = `
    SELECT ${SAFE_COLUMNS}
    FROM users 
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
};

/**
 * Find user by ID including password_hash (for password changes/checks)
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findByIdWithPassword = async (id) => {
  const sql = `
    SELECT id, email, password_hash, display_name, phone, line_id, role, 
           is_verified, is_suspended, is_banned, created_at, updated_at
    FROM users 
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
};

/**
 * Create a new user record
 * @param {object} userData
 * @returns {Promise<number>} new user ID
 */
const create = async ({
  email,
  password_hash,
  display_name,
  role = 'BUYER',
  phone = null,
  line_id = null,
}) => {
  const sql = `
    INSERT INTO users (email, password_hash, display_name, role, phone, line_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    email.toLowerCase().trim(),
    password_hash,
    display_name.trim(),
    role,
    phone || null,
    line_id || null,
  ]);
  return result.insertId;
};

/**
 * Update user profile by ID
 * @param {number} id
 * @param {object} fields
 * @returns {Promise<boolean>}
 */
const updateById = async (id, fields) => {
  const allowedUpdates = ['display_name', 'phone', 'line_id'];
  const entries = Object.entries(fields).filter(([key]) => allowedUpdates.includes(key));

  if (entries.length === 0) return false;

  const setClauses = entries.map(([key]) => `\`${key}\` = ?`).join(', ');
  const values = entries.map(([, val]) => val);
  values.push(id);

  const sql = `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Update user password
 * @param {number} id
 * @param {string} password_hash
 * @returns {Promise<boolean>}
 */
const updatePassword = async (id, password_hash) => {
  const sql = `
    UPDATE users 
    SET password_hash = ?, updated_at = NOW() 
    WHERE id = ? AND deleted_at IS NULL
  `;
  const [result] = await db.query(sql, [password_hash, id]);
  return result.affectedRows > 0;
};

/**
 * Update user last login timestamp
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const updateLastLogin = async (id) => {
  const sql = `UPDATE users SET last_login_at = NOW() WHERE id = ?`;
  const [result] = await db.query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Check if email is already registered
 * @param {string} email
 * @param {number|null} excludeId
 * @returns {Promise<boolean>}
 */
const isEmailTaken = async (email, excludeId = null) => {
  let sql = `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`;
  const params = [email.toLowerCase().trim()];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  const [rows] = await db.query(sql, params);
  return rows.length > 0;
};

/**
 * Find all users for Admin Directory
 * @param {object} param0
 */
const findAll = async ({ role = null, search = null, limit = 20, offset = 0 } = {}) => {
  let countSql = `SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL`;
  let dataSql = `
    SELECT id, email, display_name, phone, line_id, role, is_verified, is_suspended, is_banned, created_at, last_login_at
    FROM users
    WHERE deleted_at IS NULL
  `;
  const params = [];

  if (role) {
    countSql += ` AND role = ?`;
    dataSql += ` AND role = ?`;
    params.push(role);
  }

  if (search) {
    const s = `%${search.trim()}%`;
    countSql += ` AND (display_name LIKE ? OR email LIKE ?)`;
    dataSql += ` AND (display_name LIKE ? OR email LIKE ?)`;
    params.push(s, s);
  }

  dataSql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const [countRows] = await db.query(countSql, params);
  const [rows] = await db.query(dataSql, [...params, limit, offset]);

  return { users: rows, total: countRows[0].total };
};

/**
 * Admin update user status (suspend, ban, role, verified)
 * @param {number} id
 * @param {object} fields
 */
const updateStatus = async (id, fields) => {
  const allowed = ['is_suspended', 'is_banned', 'role', 'is_verified'];
  const updates = [];
  const params = [];

  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) {
      updates.push(`${k} = ?`);
      params.push(v);
    }
  }

  if (updates.length === 0) return false;

  const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
  params.push(id);
  const [res] = await db.query(sql, params);
  return res.affectedRows > 0;
};

module.exports = {
  findByEmail,
  findById,
  findByIdWithPassword,
  create,
  updateById,
  updatePassword,
  updateLastLogin,
  isEmailTaken,
  findAll,
  updateStatus,
};
