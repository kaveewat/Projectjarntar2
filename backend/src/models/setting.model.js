const db = require('../config/db');

/**
 * Platform Settings Model
 */

/**
 * Get all platform settings
 */
const getAll = async () => {
  const sql = `
    SELECT ps.*, u.display_name AS updated_by_name
    FROM platform_settings ps
    LEFT JOIN users u ON ps.updated_by = u.id
    ORDER BY ps.id ASC
  `;
  const [rows] = await db.query(sql);
  return rows;
};

/**
 * Get a specific platform setting by key
 * @param {string} key
 */
const getByKey = async (key) => {
  const sql = `
    SELECT ps.*, u.display_name AS updated_by_name
    FROM platform_settings ps
    LEFT JOIN users u ON ps.updated_by = u.id
    WHERE ps.setting_key = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [key]);
  return rows[0] || null;
};

/**
 * Update setting value by key
 * @param {string} key
 * @param {string} value
 * @param {number} updatedBy
 */
const updateByKey = async (key, value, updatedBy) => {
  const sql = `
    UPDATE platform_settings
    SET setting_value = ?, updated_by = ?, updated_at = NOW()
    WHERE setting_key = ?
  `;
  const [result] = await db.query(sql, [String(value), updatedBy, key]);
  return result.affectedRows > 0;
};

module.exports = {
  getAll,
  getByKey,
  updateByKey,
};
