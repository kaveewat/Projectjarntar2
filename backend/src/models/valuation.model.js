const db = require('../config/db');

/**
 * Create or replace valuation record for a scan
 * @param {object} param0
 */
const createValuation = async ({
  scan_id,
  fair_price_min,
  fair_price_max,
  algorithm_version = 'v1.0.0',
  factors_used = {},
}) => {
  const sql = `
    INSERT INTO valuations (scan_id, fair_price_min, fair_price_max, algorithm_version, factors_used)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      fair_price_min = VALUES(fair_price_min),
      fair_price_max = VALUES(fair_price_max),
      algorithm_version = VALUES(algorithm_version),
      factors_used = VALUES(factors_used)
  `;
  const [result] = await db.query(sql, [
    scan_id,
    fair_price_min,
    fair_price_max,
    algorithm_version,
    JSON.stringify(factors_used),
  ]);
  return result.insertId || scan_id;
};

/**
 * Get valuation by scan ID
 * @param {number} scanId
 */
const getByScanId = async (scanId) => {
  const sql = `SELECT * FROM valuations WHERE scan_id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [scanId]);
  if (!rows || rows.length === 0) return null;

  const val = rows[0];
  val.fair_price_min = Number(val.fair_price_min);
  val.fair_price_max = Number(val.fair_price_max);
  if (typeof val.factors_used === 'string') {
    try {
      val.factors_used = JSON.parse(val.factors_used);
    } catch (_e) {
      val.factors_used = {};
    }
  }
  return val;
};

module.exports = {
  createValuation,
  getByScanId,
};
