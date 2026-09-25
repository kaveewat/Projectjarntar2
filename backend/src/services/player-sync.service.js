/**
 * player-sync.service.js
 * Automatically scrapes and syncs latest eFootball player cards from eFHUB.
 */

const cheerio = require('cheerio');
const logger = require('../utils/logger');
const db = require('../config/db');

const CDN_BASE = 'https://efimg.com/efootballhub22/images/player_cards';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch latest new player IDs from efhub.com/new-players and homepage
 */
async function fetchLatestEfhubIds() {
  const ids = new Set();

  // 1. Fetch from /new-players
  try {
    const res = await fetch('https://efhub.com/new-players', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $('a[href*="/players/"]').each((_, el) => {
        const href = $(el).attr('href');
        const match = href ? href.match(/\/players\/(\d+)/) : null;
        if (match && match[1]) {
          ids.add(match[1]);
        }
      });
    }
  } catch (err) {
    logger.warn(`[PlayerSync] Error fetching /new-players: ${err.message}`);
  }

  // 2. Fetch from homepage (featured/packs)
  try {
    const res = await fetch('https://efhub.com', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $('a[href*="/players/"]').each((_, el) => {
        const href = $(el).attr('href');
        const match = href ? href.match(/\/players\/(\d+)/) : null;
        if (match && match[1]) {
          ids.add(match[1]);
        }
      });
    }
  } catch (err) {
    logger.warn(`[PlayerSync] Error fetching homepage players: ${err.message}`);
  }

  return Array.from(ids);
}

/**
 * Fetch and parse detailed player information for an ID
 */
async function fetchPlayerData(efhubId) {
  const url = `https://efhub.com/en/players/${efhubId}`;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!r.ok) {
      return null;
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';

    // Extract player name
    const titleStr = ogTitle || title;
    const nameMatch = titleStr.match(/^(.+?)\s*[\u2014|\-]\s/);
    const playerName = nameMatch ? nameMatch[1].trim() : titleStr.split('—')[0].trim();

    if (!playerName || playerName.length < 2) {
      return null;
    }

    // Extract OVR
    let ovr = null;
    const ovrFromTitle = title.match(/[\u2014\-]\s*(\d{2,3})\s*OVR/i);
    const ovrFromDesc = ogDesc.match(/a\s+(\d{2,3})-rated/i);
    if (ovrFromTitle) ovr = parseInt(ovrFromTitle[1], 10);
    else if (ovrFromDesc) ovr = parseInt(ovrFromDesc[1], 10);

    if (!ovr || ovr < 70) {
      return null;
    }

    ovr = Math.min(ovr, 120);

    // Extract position
    let position = 'CF';
    const posFromDesc = ogDesc.match(/\d+-rated\s+([A-Z]{2,3})\s+in/i);
    if (posFromDesc) position = posFromDesc[1].toUpperCase();

    // Image URL
    const imageUrl = ogImage || `${CDN_BASE}/${efhubId}_l.png`;

    // Map Tier slug
    let tierSlug = 'normal';
    if (ovr >= 95) tierSlug = 'big_time';
    else if (ovr >= 88) tierSlug = 'epic';
    else if (ovr >= 84) tierSlug = 'show_time';

    return {
      efhub_id: efhubId,
      player_name: playerName,
      overall_rating: ovr,
      position_code: position,
      tier_slug: tierSlug,
      image_url: imageUrl,
    };
  } catch (err) {
    logger.warn(`[PlayerSync] Failed to fetch player ${efhubId}: ${err.message}`);
    return null;
  }
}

/**
 * Main Sync function: Scrapes new cards and inserts into DB
 * @param {Object} [options]
 * @param {Object} [options.dbClient] - Custom db instance (for TiDB direct script)
 * @param {number} [options.limit] - Limit number of new cards to sync per run
 */
async function syncLatestPlayers(options = {}) {
  const pool = options.dbClient || db;
  const limit = options.limit || 150;

  logger.info('🔄 [PlayerSync] Starting automatic eFootball card synchronization...');

  // 1. Load lookup tables (positions & tiers)
  const [positions] = await pool.query('SELECT id, code FROM positions');
  const posMap = {};
  positions.forEach((p) => {
    posMap[p.code.toUpperCase()] = p.id;
  });

  const [tiers] = await pool.query('SELECT id, slug FROM card_tiers');
  const tierMap = {};
  tiers.forEach((t) => {
    tierMap[t.slug.toLowerCase()] = t.id;
  });

  // 2. Load existing efhub_ids from player_cards
  const [existingCards] = await pool.query('SELECT efhub_id FROM player_cards WHERE efhub_id IS NOT NULL');
  const existingSet = new Set(existingCards.map((c) => String(c.efhub_id)));

  // 3. Fetch latest IDs from efhub.com
  const scrapedIds = await fetchLatestEfhubIds();
  const missingIds = scrapedIds.filter((id) => !existingSet.has(String(id))).slice(0, limit);

  logger.info(`[PlayerSync] Found ${scrapedIds.length} cards from eFHUB. New cards to sync: ${missingIds.length}`);

  if (missingIds.length === 0) {
    logger.info('✅ [PlayerSync] All latest cards are already in the database.');
    return { scanned: scrapedIds.length, added: 0, message: 'All latest cards are already up to date.' };
  }

  // 4. Concurrently fetch and insert new cards (with rate limit delay)
  const addedPlayers = [];
  const CONCURRENCY = 4;
  let index = 0;

  async function worker() {
    while (index < missingIds.length) {
      const currentId = missingIds[index++];
      await sleep(350); // Respectful request rate limit

      const card = await fetchPlayerData(currentId);
      if (!card) continue;

      const posId = posMap[card.position_code] || posMap['CF'] || 10;
      const tierId = tierMap[card.tier_slug] || tierMap['normal'] || 1;

      try {
        await pool.query(
          `INSERT INTO player_cards 
            (game_id, card_tier_id, position_id, player_name, overall_rating, efhub_id, image_url, is_active, base_value)
           VALUES 
            (1, ?, ?, ?, ?, ?, ?, 1, 0)
           ON DUPLICATE KEY UPDATE
            overall_rating = VALUES(overall_rating),
            image_url = VALUES(image_url),
            is_active = 1`,
          [tierId, posId, card.player_name, card.overall_rating, card.efhub_id, card.image_url]
        );
        addedPlayers.push(card);
        logger.info(`[PlayerSync] Added: [${card.position_code}] ${card.player_name} (${card.overall_rating} OVR) - ID: ${card.efhub_id}`);
      } catch (err) {
        logger.warn(`[PlayerSync] Insert error for ${card.efhub_id}: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  logger.info(`🎉 [PlayerSync] Successfully synced ${addedPlayers.length} new player cards!`);

  return {
    scanned: scrapedIds.length,
    added: addedPlayers.length,
    players: addedPlayers.map((p) => ({
      name: p.player_name,
      ovr: p.overall_rating,
      position: p.position_code,
      efhub_id: p.efhub_id,
    })),
  };
}

module.exports = {
  syncLatestPlayers,
  fetchLatestEfhubIds,
  fetchPlayerData,
};
