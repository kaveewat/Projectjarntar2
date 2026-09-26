const db = require('../config/db');

/**
 * Resolve player image URL from efhub CDN
 * If image_url is already set, use it directly.
 * If efhub_id is set, construct CDN URL automatically.
 * @param {string|null} image_url
 * @param {number|null} efhub_id
 * @returns {string|null}
 */
const resolveImageUrl = (image_url, efhub_id) => {
  if (image_url) return image_url;
  if (efhub_id) return `https://efimg.com/efootballhub22/images/player_cards/${efhub_id}_l.png`;
  return null;
};

const { LEGEND_NAMES } = require('../services/card-tier-fixer.service');

/**
 * Check if player card is a Double Booster (2 Boosters) card.
 * Epic and Big Time cards in eFootball 2025/2026 are Double Boosters.
 */
const isDoubleBooster = (player) => {
  if (!player) return false;
  const tier = String(player.tier_slug || '').toLowerCase();
  if (['epic', 'big_time', 'big-time', 'bigtime'].includes(tier)) return true;
  if ([2, 4].includes(Number(player.card_tier_id))) return true;
  const name = String(player.player_name || '').toLowerCase();
  if (LEGEND_NAMES && Array.isArray(LEGEND_NAMES)) {
    if (LEGEND_NAMES.some((leg) => name.includes(leg.toLowerCase()))) return true;
  }
  return false;
};

/**
 * Find player cards with filters and pagination
 * @param {object} param0
 */
const findAll = async ({
  name = null,
  tier = null,
  position = null,
  game_id = null,
  booster = null,
  double_booster = null,
  sort = 'newest',
  limit = 20,
  offset = 0,
}) => {
  const conditions = [
    'pc.is_active = 1',
    'pc.image_url IS NOT NULL',
    'pc.efhub_id IS NOT NULL',
    'pc.efhub_id NOT IN (8554053, 8554076)',
    'pc.efhub_id NOT LIKE "1232%"',
  ];
  const params = [];

  // 2-Booster (Double Booster) filter
  if (booster === '2' || booster === 'double' || double_booster === 'true' || double_booster === true) {
    conditions.push("(ct.slug IN ('epic', 'big_time', 'big-time', 'bigtime') OR pc.card_tier_id IN (2, 4))");
  }

  if (name) {
    const trimmed = name.trim();
    // If user searches for "2 boost", "booster", or "ดับเบิ้ลบูสต์", treat as booster filter
    if (/^(2\s*boost|double\s*boost|booster|บูสต์|2\s*บูสต์|2boost|doublebooster)$/i.test(trimmed)) {
      conditions.push("(ct.slug IN ('epic', 'big_time', 'big-time', 'bigtime') OR pc.card_tier_id IN (2, 4))");
    } else {
      conditions.push('pc.player_name LIKE ?');
      params.push(`%${trimmed}%`);
    }
  }

  if (tier) {
    const t = String(tier).trim().toLowerCase();
    if (['big_time', 'big-time', 'bigtime'].includes(t)) {
      conditions.push("ct.slug IN ('big_time', 'big-time', 'bigtime')");
    } else if (t === 'epic') {
      conditions.push("ct.slug = 'epic'");
    } else if (['show_time', 'show-time', 'showtime'].includes(t)) {
      conditions.push("ct.slug IN ('show_time', 'show-time', 'showtime')");
    } else if (['highlight', 'featured'].includes(t)) {
      conditions.push("ct.slug IN ('highlight', 'featured')");
    } else if (t === 'potw') {
      conditions.push("ct.slug = 'potw'");
    } else if (['normal', 'standard'].includes(t)) {
      conditions.push("ct.slug IN ('normal', 'standard')");
    } else {
      conditions.push('(ct.slug = ? OR ct.name = ?)');
      params.push(tier, tier);
    }
  }

  if (position) {
    conditions.push('(pos.code = ? OR pos.name = ?)');
    params.push(position, position);
  }

  if (game_id) {
    conditions.push('pc.game_id = ?');
    params.push(Number(game_id));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `
    SELECT COUNT(*) AS total
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    ${whereClause}
  `;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0] ? countRows[0].total : 0;

  // Determine sort order
  // Default: Pure newest to oldest matching eFHUB (efhub_id DESC, id DESC)
  let orderByClause = 'ORDER BY pc.efhub_id DESC, pc.id DESC';

  if (sort === 'ovr_desc') {
    orderByClause = 'ORDER BY pc.overall_rating DESC, pc.efhub_id DESC';
  } else if (sort === 'ovr_asc') {
    orderByClause = 'ORDER BY pc.overall_rating ASC, pc.efhub_id ASC';
  } else if (sort === 'name_asc') {
    orderByClause = 'ORDER BY pc.player_name ASC, pc.efhub_id DESC';
  } else if (sort === 'tier_priority') {
    const TIER_CASE = `
      CASE
        WHEN ct.slug IN ('big_time', 'big-time', 'bigtime') THEN 1
        WHEN ct.slug IN ('epic') THEN 2
        WHEN ct.slug IN ('show_time', 'show-time', 'showtime') THEN 3
        WHEN ct.slug IN ('highlight', 'featured') THEN 4
        WHEN ct.slug IN ('potw') THEN 5
        ELSE 6
      END
    `;
    orderByClause = `ORDER BY ${TIER_CASE} ASC, pc.efhub_id DESC, pc.id DESC`;
  }

  // Get paginated rows
  const queryParams = [...params, Number(limit), Number(offset)];
  const dataSql = `
    SELECT pc.id, pc.game_id, pc.efhub_id, pc.image_url, pc.player_name, pc.nationality, pc.club,
           pc.overall_rating, pc.base_value, pc.season, pc.is_active, pc.created_at,
           ct.name AS tier_name, ct.slug AS tier_slug, ct.display_color,
           pos.code AS position_code, pos.name AS position_name, pos.group_name AS position_group,
           g.name AS game_name
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    LEFT JOIN games g ON pc.game_id = g.id
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, queryParams);

  return {
    players: rows.map((r) => {
      const isDual = isDoubleBooster(r);
      return {
        ...r,
        base_value: Number(r.base_value),
        image_url: resolveImageUrl(r.image_url, r.efhub_id),
        is_double_booster: isDual,
        booster_count: isDual ? 2 : 0,
      };
    }),
    total,
  };
};

/**
 * Find player card by ID
 * @param {number} id
 * @param {boolean} includeInactive
 */
const findById = async (id, includeInactive = true) => {
  const activeCondition = includeInactive ? '' : 'AND pc.is_active = 1';
  const sql = `
    SELECT pc.id, pc.game_id, pc.efhub_id, pc.image_url, pc.card_tier_id, pc.position_id,
           pc.player_name, pc.nationality, pc.club,
           pc.overall_rating, pc.base_value, pc.season, pc.is_active, pc.created_at, pc.updated_at,
           ct.name AS tier_name, ct.slug AS tier_slug, ct.display_color,
           pos.code AS position_code, pos.name AS position_name, pos.group_name AS position_group,
           g.name AS game_name
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    LEFT JOIN games g ON pc.game_id = g.id
    WHERE pc.id = ? ${activeCondition}
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const player = rows[0];
  const isDual = isDoubleBooster(player);

  return {
    ...player,
    base_value: Number(player.base_value),
    image_url: resolveImageUrl(player.image_url, player.efhub_id),
    is_double_booster: isDual,
    booster_count: isDual ? 2 : 0,
  };
};

/**
 * Find player cards for Admin console with filters, stats & pagination
 */
const findAllAdmin = async ({
  name = null,
  tier = null,
  position = null,
  is_active = null,
  game_id = null,
  limit = 20,
  offset = 0,
}) => {
  const conditions = [];
  const params = [];

  if (name) {
    conditions.push('pc.player_name LIKE ?');
    params.push(`%${name.trim()}%`);
  }

  if (tier && tier !== 'all') {
    conditions.push('(ct.slug = ? OR ct.name = ? OR pc.card_tier_id = ?)');
    params.push(tier, tier, Number(tier) || 0);
  }

  if (position && position !== 'all') {
    conditions.push('(pos.code = ? OR pos.name = ? OR pc.position_id = ?)');
    params.push(position, position, Number(position) || 0);
  }

  if (is_active !== null && is_active !== undefined && is_active !== 'all' && is_active !== '') {
    conditions.push('pc.is_active = ?');
    params.push(Number(is_active));
  }

  if (game_id && game_id !== 'all') {
    conditions.push('pc.game_id = ?');
    params.push(Number(game_id));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `
    SELECT COUNT(*) AS total
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    ${whereClause}
  `;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0] ? countRows[0].total : 0;

  // Calculate summary KPI stats
  const statsSql = `
    SELECT 
      COUNT(*) as total_cards,
      COALESCE(SUM(CASE WHEN pc.is_active = 1 THEN 1 ELSE 0 END), 0) as active_cards,
      COALESCE(MAX(pc.overall_rating), 0) as max_ovr,
      COALESCE(SUM(CASE WHEN ct.slug IN ('epic', 'big-time', 'show-time', 'legendary') THEN 1 ELSE 0 END), 0) as high_tier_cards
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
  `;
  const [statsRows] = await db.query(statsSql);
  const stats = statsRows[0] || { total_cards: 0, active_cards: 0, max_ovr: 0, high_tier_cards: 0 };

  // Paginated rows
  const queryParams = [...params, Number(limit), Number(offset)];
  const dataSql = `
    SELECT pc.id, pc.game_id, pc.efhub_id, pc.image_url, pc.card_tier_id, pc.position_id,
           pc.player_name, pc.nationality, pc.club,
           pc.overall_rating, pc.base_value, pc.season, pc.is_active, pc.created_at, pc.updated_at,
           ct.name AS tier_name, ct.slug AS tier_slug, ct.display_color,
           pos.code AS position_code, pos.name AS position_name, pos.group_name AS position_group,
           g.name AS game_name
    FROM player_cards pc
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    LEFT JOIN games g ON pc.game_id = g.id
    ${whereClause}
    ORDER BY pc.overall_rating DESC, pc.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, queryParams);

  return {
    players: rows.map((r) => ({
      ...r,
      base_value: Number(r.base_value),
      image_url: resolveImageUrl(r.image_url, r.efhub_id),
    })),
    total,
    stats,
  };
};

/**
 * Create a new player card
 */
const createPlayer = async (data) => {
  const {
    game_id = 1,
    card_tier_id,
    position_id,
    player_name,
    nationality = null,
    club = null,
    overall_rating,
    base_value = 0,
    season = null,
    is_active = 1,
    efhub_id = null,
    image_url = null,
  } = data;

  const sql = `
    INSERT INTO player_cards 
      (game_id, efhub_id, image_url, card_tier_id, position_id, player_name, nationality, club, overall_rating, base_value, season, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    Number(game_id) || 1,
    efhub_id ? Number(efhub_id) : null,
    image_url ? String(image_url).trim() : null,
    Number(card_tier_id),
    Number(position_id),
    String(player_name).trim(),
    nationality ? String(nationality).trim() : null,
    club ? String(club).trim() : null,
    Number(overall_rating),
    Number(base_value) || 0,
    season ? String(season).trim() : null,
    is_active ? 1 : 0,
  ]);

  return findById(result.insertId, true);
};

/**
 * Update an existing player card
 */
const updatePlayer = async (id, data) => {
  const allowed = [
    'game_id',
    'efhub_id',
    'image_url',
    'card_tier_id',
    'position_id',
    'player_name',
    'nationality',
    'club',
    'overall_rating',
    'base_value',
    'season',
    'is_active',
  ];
  const fields = [];
  const params = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === 'is_active') {
        params.push(data[key] ? 1 : 0);
      } else if (['game_id', 'card_tier_id', 'position_id', 'overall_rating'].includes(key)) {
        params.push(Number(data[key]));
      } else if (key === 'efhub_id') {
        params.push(data[key] ? Number(data[key]) : null);
      } else if (key === 'base_value') {
        params.push(Number(data[key]) || 0);
      } else {
        params.push(data[key] === null ? null : String(data[key]).trim());
      }
    }
  }

  if (fields.length === 0) return findById(id, true);

  params.push(Number(id));
  const sql = `UPDATE player_cards SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(sql, params);

  return findById(id, true);
};

/**
 * Toggle active status of a player card
 */
const togglePlayerStatus = async (id, isActive) => {
  const sql = `UPDATE player_cards SET is_active = ? WHERE id = ?`;
  await db.query(sql, [isActive ? 1 : 0, Number(id)]);
  return findById(id, true);
};

/**
 * Batch insert multiple player cards
 */
const bulkCreatePlayers = async (playersList = []) => {
  if (!playersList || playersList.length === 0) return { insertedCount: 0, errors: [] };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < playersList.length; i++) {
      const p = playersList[i];
      if (!p.player_name || !p.card_tier_id || !p.position_id || !p.overall_rating) {
        errors.push({ index: i, player_name: p.player_name || 'N/A', error: 'Missing required fields' });
        continue;
      }

      await connection.query(
        `INSERT INTO player_cards 
          (game_id, efhub_id, image_url, card_tier_id, position_id, player_name, nationality, club, overall_rating, base_value, season, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(p.game_id) || 1,
          p.efhub_id ? Number(p.efhub_id) : null,
          p.image_url ? String(p.image_url).trim() : null,
          Number(p.card_tier_id),
          Number(p.position_id),
          String(p.player_name).trim(),
          p.nationality ? String(p.nationality).trim() : null,
          p.club ? String(p.club).trim() : null,
          Number(p.overall_rating),
          Number(p.base_value) || 0,
          p.season ? String(p.season).trim() : null,
          p.is_active !== undefined ? (p.is_active ? 1 : 0) : 1,
        ]
      );
      insertedCount++;
    }

    await connection.commit();
    return { insertedCount, errors };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Get all active card tiers
 */
const getTiers = async () => {
  const sql = `SELECT id, name, slug, weight, display_color FROM card_tiers ORDER BY weight DESC`;
  const [rows] = await db.query(sql);
  return rows;
};

/**
 * Get all positions
 */
const getPositions = async () => {
  const sql = `SELECT id, code, name, group_name FROM positions ORDER BY id ASC`;
  const [rows] = await db.query(sql);
  return rows;
};

/**
 * Get all active games
 */
const getGames = async () => {
  const sql = `SELECT id, name, slug FROM games WHERE is_active = 1 ORDER BY id ASC`;
  const [rows] = await db.query(sql);
  return rows;
};

module.exports = {
  findAll,
  findAllAdmin,
  findById,
  createPlayer,
  updatePlayer,
  togglePlayerStatus,
  bulkCreatePlayers,
  getTiers,
  getPositions,
  getGames,
  resolveImageUrl,
};
