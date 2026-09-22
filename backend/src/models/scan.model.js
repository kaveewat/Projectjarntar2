const db = require('../config/db');

/**
 * Create a new squad scan record
 * @param {object} param0
 * @returns {Promise<number>} insertId
 */
const createScan = async ({
  user_id,
  game_id = 1,
  image_urls = [],
  status = 'PROCESSING',
  ai_model = 'gemini-2.0-flash',
}) => {
  const sql = `
    INSERT INTO squad_scans (user_id, game_id, image_urls, status, ai_model)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    user_id,
    game_id,
    JSON.stringify(image_urls),
    status,
    ai_model,
  ]);
  return result.insertId;
};

/**
 * Update scan status and metadata
 * @param {number} id
 * @param {object} param1
 */
const updateScanStatus = async (
  id,
  {
    status,
    ai_raw_response = null,
    error_message = null,
    processing_time_ms = null,
    completed_at = null,
  }
) => {
  const fields = ['status = ?'];
  const values = [status];

  if (ai_raw_response !== undefined && ai_raw_response !== null) {
    fields.push('ai_raw_response = ?');
    values.push(JSON.stringify(ai_raw_response));
  }

  if (error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(error_message);
  }

  if (processing_time_ms !== undefined) {
    fields.push('processing_time_ms = ?');
    values.push(processing_time_ms);
  }

  if (completed_at !== undefined) {
    fields.push('completed_at = ?');
    values.push(completed_at);
  }

  values.push(id);
  const sql = `UPDATE squad_scans SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Get scan by ID
 * @param {number} id
 */
const getScanById = async (id) => {
  const sql = `
    SELECT s.*, g.name AS game_name, u.display_name AS user_name
    FROM squad_scans s
    LEFT JOIN games g ON s.game_id = g.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const scan = rows[0];
  if (typeof scan.image_urls === 'string') {
    try {
      scan.image_urls = JSON.parse(scan.image_urls);
    } catch (_e) {
      scan.image_urls = [];
    }
  }
  if (typeof scan.ai_raw_response === 'string') {
    try {
      scan.ai_raw_response = JSON.parse(scan.ai_raw_response);
    } catch (_e) {
      scan.ai_raw_response = null;
    }
  }

  return scan;
};

/**
 * Get scans by User ID
 * @param {number} userId
 * @param {number} limit
 * @param {number} offset
 */
const getScansByUserId = async (userId, limit = 20, offset = 0) => {
  const sql = `
    SELECT id, user_id, game_id, image_urls, status, ai_model, processing_time_ms, created_at, completed_at
    FROM squad_scans
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(sql, [userId, Number(limit), Number(offset)]);

  const [countRows] = await db.query(
    'SELECT COUNT(*) AS total FROM squad_scans WHERE user_id = ?',
    [userId]
  );

  const formattedRows = rows.map((scan) => {
    if (typeof scan.image_urls === 'string') {
      try {
        scan.image_urls = JSON.parse(scan.image_urls);
      } catch (_e) {
        scan.image_urls = [];
      }
    }
    return scan;
  });

  return {
    scans: formattedRows,
    total: countRows[0] ? countRows[0].total : 0,
  };
};

/**
 * Batch insert detected players for a scan
 * @param {number} scanId
 * @param {Array<object>} players
 */
const saveDetectedPlayers = async (scanId, players = []) => {
  if (!players || players.length === 0) return [];

  const values = [];
  const placeholders = [];

  for (const p of players) {
    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
    values.push(
      scanId,
      p.player_card_id || null,
      p.detected_name || 'Unknown Player',
      p.detected_tier || 'Normal',
      p.detected_position || 'CMF',
      p.confidence_score || 0.95,
      p.is_confirmed !== undefined ? (p.is_confirmed ? 1 : 0) : 1,
      p.is_corrected !== undefined ? (p.is_corrected ? 1 : 0) : 0
    );
  }

  const sql = `
    INSERT INTO scan_player_results 
    (scan_id, player_card_id, detected_name, detected_tier, detected_position, confidence_score, is_confirmed, is_corrected)
    VALUES ${placeholders.join(', ')}
  `;

  await db.query(sql, values);
  return getScanPlayers(scanId);
};

/**
 * Get all detected players for a scan
 * @param {number} scanId
 */
const getScanPlayers = async (scanId) => {
  const sql = `
    SELECT r.id, r.scan_id, r.player_card_id, r.detected_name, r.detected_tier, 
           r.detected_position, r.confidence_score, r.is_confirmed, r.is_corrected,
           pc.player_name, pc.overall_rating, pc.base_value, ct.name AS tier_name, ct.display_color
    FROM scan_player_results r
    LEFT JOIN player_cards pc ON r.player_card_id = pc.id
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    WHERE r.scan_id = ?
    ORDER BY pc.overall_rating DESC, r.confidence_score DESC
  `;
  const [rows] = await db.query(sql, [scanId]);
  return rows;
};

/**
 * Confirm/correct players in scan
 * @param {number} scanId
 * @param {Array<object>} confirmedPlayers
 */
const confirmScanPlayers = async (scanId, confirmedPlayers = []) => {
  for (const player of confirmedPlayers) {
    if (player.id) {
      await db.query(
        `UPDATE scan_player_results 
         SET is_confirmed = ?, is_corrected = ?, player_card_id = ?
         WHERE id = ? AND scan_id = ?`,
        [
          player.is_confirmed !== false ? 1 : 0,
          player.is_corrected ? 1 : 0,
          player.player_card_id || null,
          player.id,
          scanId,
        ]
      );
    }
  }
  return getScanPlayers(scanId);
};

module.exports = {
  createScan,
  updateScanStatus,
  getScanById,
  getScansByUserId,
  saveDetectedPlayers,
  getScanPlayers,
  confirmScanPlayers,
};
