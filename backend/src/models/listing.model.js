const db = require('../config/db');

/**
 * Create a new account listing
 * @param {object} listingData
 */
const createListing = async ({
  seller_id,
  game_id = 1,
  platform_id,
  squad_scan_id = null,
  valuation_id = null,
  title,
  description = null,
  asking_price,
  fair_price_min = null,
  fair_price_max = null,
  value_badge = 'FAIR',
  team_strength = null,
  image_urls = null,
  status = 'ACTIVE',
}) => {
  const sql = `
    INSERT INTO account_listings (
      seller_id, game_id, platform_id, squad_scan_id, valuation_id,
      title, description, asking_price, fair_price_min, fair_price_max,
      value_badge, team_strength, image_urls, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    seller_id,
    game_id,
    platform_id,
    squad_scan_id,
    valuation_id,
    title.trim(),
    description || null,
    asking_price,
    fair_price_min,
    fair_price_max,
    value_badge,
    team_strength,
    image_urls ? (typeof image_urls === 'string' ? image_urls : JSON.stringify(image_urls)) : null,
    status,
  ]);

  return result.insertId;
};

/**
 * Link player cards to an account listing
 * @param {number} listingId
 * @param {Array<{player_card_id: number}>} playerCards
 */
const addListingPlayerCards = async (listingId, playerCards = []) => {
  if (!playerCards || playerCards.length === 0) return;

  const validCards = playerCards.filter((p) => p.player_card_id);
  if (validCards.length === 0) return;

  const values = [];
  const placeholders = [];

  for (const card of validCards) {
    placeholders.push('(?, ?, ?)');
    values.push(listingId, card.player_card_id, 1);
  }

  const sql = `
    INSERT IGNORE INTO listing_player_cards (listing_id, player_card_id, is_ai_detected)
    VALUES ${placeholders.join(', ')}
  `;

  await db.query(sql, values);
};

/**
 * Find listing by ID with full details (seller, platform, game, valuation, cards)
 * @param {number} id
 */
const findById = async (id) => {
  const sql = `
    SELECT l.*, 
           u.display_name AS seller_name, u.role AS seller_role, u.is_verified AS seller_verified,
           p.name AS platform_name, p.slug AS platform_slug,
           g.name AS game_name,
           v.fair_price_min AS val_fair_min, v.fair_price_max AS val_fair_max, v.algorithm_version,
           COALESCE(l.image_urls, sc.image_urls) AS squad_images
    FROM account_listings l
    LEFT JOIN users u ON l.seller_id = u.id
    LEFT JOIN platforms p ON l.platform_id = p.id
    LEFT JOIN games g ON l.game_id = g.id
    LEFT JOIN valuations v ON l.valuation_id = v.id
    LEFT JOIN squad_scans sc ON l.squad_scan_id = sc.id
    WHERE l.id = ? AND l.deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const listing = rows[0];

  // Parse squad images if present
  if (listing.squad_images) {
    try {
      listing.squad_images = typeof listing.squad_images === 'string' ? JSON.parse(listing.squad_images) : listing.squad_images;
    } catch {
      listing.squad_images = [];
    }
  } else {
    listing.squad_images = [];
  }

  // Cast numeric fields
  listing.asking_price = Number(listing.asking_price);
  listing.fair_price_min = listing.fair_price_min !== null ? Number(listing.fair_price_min) : null;
  listing.fair_price_max = listing.fair_price_max !== null ? Number(listing.fair_price_max) : null;

  // Fetch listing player cards
  const cardsSql = `
    SELECT pc.id, pc.player_name, pc.overall_rating, pc.base_value,
           pc.efhub_id, pc.image_url,
           ct.name AS tier_name, ct.display_color,
           pos.code AS position_code
    FROM listing_player_cards lpc
    JOIN player_cards pc ON lpc.player_card_id = pc.id
    LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
    LEFT JOIN positions pos ON pc.position_id = pos.id
    WHERE lpc.listing_id = ?
    ORDER BY pc.overall_rating DESC
  `;
  const [cards] = await db.query(cardsSql, [id]);
  listing.players = cards.map((c) => ({
    ...c,
    image_url: c.image_url || (c.efhub_id ? `https://efimg.com/efootballhub22/images/player_cards/${c.efhub_id}_l.png` : null),
    base_value: Number(c.base_value),
  }));

  return listing;
};

/**
 * Find all listings with search, filters, sorting, and pagination
 * @param {object} param0
 */
const findAll = async ({
  status = 'ACTIVE',
  player_name = null,
  has_double_booster = null,
  min_price = null,
  max_price = null,
  min_strength = null,
  max_strength = null,
  badge = null,
  platform_id = null,
  game_id = null,
  seller_id = null,
  sort = 'newest',
  limit = 20,
  offset = 0,
}) => {
  const conditions = ['l.deleted_at IS NULL'];
  const params = [];

  if (status && status !== 'ALL') {
    conditions.push('l.status = ?');
    params.push(status);
  }

  if (seller_id) {
    conditions.push('l.seller_id = ?');
    params.push(Number(seller_id));
  }

  if (platform_id) {
    conditions.push('l.platform_id = ?');
    params.push(Number(platform_id));
  }

  if (game_id) {
    conditions.push('l.game_id = ?');
    params.push(Number(game_id));
  }

  if (badge) {
    conditions.push('l.value_badge = ?');
    params.push(badge);
  }

  if (min_price !== null && min_price !== undefined) {
    conditions.push('l.asking_price >= ?');
    params.push(Number(min_price));
  }

  if (max_price !== null && max_price !== undefined) {
    conditions.push('l.asking_price <= ?');
    params.push(Number(max_price));
  }

  if (min_strength !== null && min_strength !== undefined) {
    conditions.push('l.team_strength >= ?');
    params.push(Number(min_strength));
  }

  if (max_strength !== null && max_strength !== undefined) {
    conditions.push('l.team_strength <= ?');
    params.push(Number(max_strength));
  }

  // Filter for Double Booster accounts
  if (has_double_booster === 'true' || has_double_booster === true || has_double_booster === '1') {
    conditions.push(`EXISTS (
      SELECT 1 FROM listing_player_cards lpc
      JOIN player_cards pc ON lpc.player_card_id = pc.id
      LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
      WHERE lpc.listing_id = l.id AND (ct.slug IN ('epic', 'big_time', 'big-time', 'bigtime') OR pc.card_tier_id IN (2, 4))
    )`);
  }

  // Filter by player name contained in listing
  if (player_name) {
    const trimmed = player_name.trim();
    if (/^(2\s*boost|double\s*boost|booster|บูสต์|2\s*บูสต์|2boost|doublebooster)$/i.test(trimmed)) {
      conditions.push(`EXISTS (
        SELECT 1 FROM listing_player_cards lpc
        JOIN player_cards pc ON lpc.player_card_id = pc.id
        LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
        WHERE lpc.listing_id = l.id AND (ct.slug IN ('epic', 'big_time', 'big-time', 'bigtime') OR pc.card_tier_id IN (2, 4))
      )`);
    } else {
      conditions.push(`EXISTS (
        SELECT 1 FROM listing_player_cards lpc
        JOIN player_cards pc ON lpc.player_card_id = pc.id
        WHERE lpc.listing_id = l.id AND pc.player_name LIKE ?
      )`);
      params.push(`%${trimmed}%`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order By
  let orderBy = 'l.created_at DESC';
  if (sort === 'price_asc') {
    orderBy = 'l.asking_price ASC';
  } else if (sort === 'price_desc') {
    orderBy = 'l.asking_price DESC';
  } else if (sort === 'strength_desc') {
    orderBy = 'l.team_strength DESC';
  }

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM account_listings l ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0] ? countRows[0].total : 0;

  // Get paginated listings
  const queryParams = [...params, Number(limit), Number(offset)];
  const dataSql = `
    SELECT l.id, l.seller_id, l.game_id, l.platform_id, l.squad_scan_id, l.valuation_id,
           l.title, l.description, l.asking_price, l.fair_price_min, l.fair_price_max,
           l.value_badge, l.team_strength, l.status, l.view_count, l.created_at,
           u.display_name AS seller_name, u.role AS seller_role, u.is_verified AS seller_verified,
           p.name AS platform_name, p.slug AS platform_slug,
           g.name AS game_name,
           COALESCE(l.image_urls, sc.image_urls) AS squad_images,
           (
             SELECT COUNT(*)
             FROM listing_player_cards lpc
             JOIN player_cards pc ON lpc.player_card_id = pc.id
             LEFT JOIN card_tiers ct ON pc.card_tier_id = ct.id
             WHERE lpc.listing_id = l.id AND (ct.slug IN ('epic', 'big_time', 'big-time', 'bigtime') OR pc.card_tier_id IN (2, 4))
           ) > 0 AS has_double_booster,
           (
             SELECT GROUP_CONCAT(pc.player_name ORDER BY pc.overall_rating DESC SEPARATOR ', ')
             FROM listing_player_cards lpc
             JOIN player_cards pc ON lpc.player_card_id = pc.id
             WHERE lpc.listing_id = l.id
           ) AS featured_players
    FROM account_listings l
    LEFT JOIN users u ON l.seller_id = u.id
    LEFT JOIN platforms p ON l.platform_id = p.id
    LEFT JOIN games g ON l.game_id = g.id
    LEFT JOIN squad_scans sc ON l.squad_scan_id = sc.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, queryParams);

  const formattedListings = rows.map((r) => {
    let squad_images = [];
    if (r.squad_images) {
      try {
        squad_images = typeof r.squad_images === 'string' ? JSON.parse(r.squad_images) : r.squad_images;
      } catch {
        squad_images = [];
      }
    }
    return {
      ...r,
      asking_price: Number(r.asking_price),
      fair_price_min: r.fair_price_min !== null ? Number(r.fair_price_min) : null,
      fair_price_max: r.fair_price_max !== null ? Number(r.fair_price_max) : null,
      has_double_booster: Boolean(r.has_double_booster),
      squad_images,
    };
  });

  return {
    listings: formattedListings,
    total,
  };
};

/**
 * Count active listings for a given seller
 * @param {number} sellerId
 */
const countActiveBySellerId = async (sellerId) => {
  const sql = `
    SELECT COUNT(*) AS count 
    FROM account_listings 
    WHERE seller_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
  `;
  const [rows] = await db.query(sql, [sellerId]);
  return rows[0] ? rows[0].count : 0;
};

/**
 * Update listing fields
 * @param {number} id
 * @param {object} fields
 */
const updateListing = async (id, fields = {}) => {
  const allowed = ['title', 'description', 'asking_price', 'value_badge'];
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
  if (entries.length === 0) return false;

  const setClauses = entries.map(([k]) => `\`${k}\` = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  values.push(id);

  const sql = `UPDATE account_listings SET ${setClauses}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Update listing status
 * @param {number} id
 * @param {string} status
 * @param {string|null} reason
 */
const updateStatus = async (id, status, reason = null) => {
  const fields = ['status = ?'];
  const values = [status];

  if (reason !== undefined) {
    fields.push('suspended_reason = ?');
    values.push(reason);
  }

  values.push(id);
  const sql = `UPDATE account_listings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Soft delete listing
 * @param {number} id
 */
const softDelete = async (id) => {
  const sql = `
    UPDATE account_listings 
    SET status = 'CANCELLED', deleted_at = NOW() 
    WHERE id = ? AND deleted_at IS NULL
  `;
  const [result] = await db.query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Increment view count
 * @param {number} id
 */
const incrementViewCount = async (id) => {
  await db.query(`UPDATE account_listings SET view_count = view_count + 1 WHERE id = ?`, [id]);
};

module.exports = {
  createListing,
  addListingPlayerCards,
  findById,
  findAll,
  countActiveBySellerId,
  updateListing,
  updateStatus,
  softDelete,
  incrementViewCount,
};
