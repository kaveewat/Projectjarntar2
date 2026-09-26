/**
 * player-sync.service.js
 * Automatically scrapes and syncs latest eFootball player cards from eFHUB (New Players & Weekly Packs).
 */

const cheerio = require('cheerio');
const dns = require('dns');
const logger = require('../utils/logger');
const db = require('../config/db');

// Ensure IPv4 first to prevent timeout with Cloudflare/eFHUB
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const CDN_BASE = 'https://efimg.com/efootballhub22/images/player_cards';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Core packs to check for updates (National Teams Selection, POTW, Club Selections)
const KNOWN_PACK_SLUGS = [
  'national-teams-selection-10-sep-26',
  'national-teams-selection-14-sep-26',
  'national-teams-selection-17-sep-26',
  'national-teams-selection-24-sep-26',
  'national-teams-selection-6-aug-26',
  'potw-10-sep-26',
  'potw-17-sep-26',
  'potw-24-sep-26',
  'european-clubs-selection-14-sep-26',
  'european-clubs-selection-24-sep-26',
  'summer-transfer-10-sep-26',
];

/**
 * Scrapes player cards directly from an eFHUB pack page
 */
async function fetchPackCards(slug) {
  const url = `https://efhub.com/packs/${slug}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const players = [];

    $('img[src*="/images/player_cards/"]').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const m = src ? src.match(/player_cards\/(\d+)_l\.png/) : null;
      if (!m) return;
      const id = m[1];

      const parent = $(el).closest('div').parent();
      const spans = parent.find('span').map((_, s) => $(s).text().trim()).get();

      let ovr = null;
      let pos = 'CF';

      for (const s of spans) {
        if (/^\d{2,3}$/.test(s) && !ovr) {
          ovr = parseInt(s, 10);
        } else if (/^[A-Z]{2,3}$/.test(s)) {
          pos = s;
        }
      }

      if (id && alt && ovr) {
        // ── Tier Detection by Pack Slug and Card Context ─────────────────────
        let tierSlug = 'highlight'; // default for pack cards
        const slugLower = slug.toLowerCase();

        if (slugLower.startsWith('potw')) {
          tierSlug = 'potw';
        } else if (slugLower.includes('epic')) {
          tierSlug = 'epic';
        } else if (slugLower.includes('big-time') || slugLower.includes('big_time')) {
          tierSlug = 'big_time';
        } else if (slugLower.includes('show-time') || slugLower.includes('show_time')) {
          tierSlug = 'show_time';
        } else if (slugLower.includes('national-teams') || slugLower.includes('european-clubs') || slugLower.includes('selection')) {
          tierSlug = 'highlight';
        } else {
          tierSlug = 'highlight';
        }

        players.push({
          efhub_id: id,
          player_name: alt,
          overall_rating: Math.min(ovr, 120),
          position_code: pos,
          tier_slug: tierSlug,
          image_url: src,
        });
      }
    });

    return players;
  } catch (err) {
    logger.warn(`[PlayerSync] Error fetching pack ${slug}: ${err.message}`);
    return [];
  }
}

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

  // 2. Fetch from homepage (extract both links and player card images)
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
      $('img[src*="/images/player_cards/"]').each((_, el) => {
        const src = $(el).attr('src');
        const match = src ? src.match(/player_cards\/(\d+)_l\.png/) : null;
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
 * Fetch and parse detailed player information for an individual ID
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

    // ── Tier Detection: explicit signature, keywords, then safe fallback ─────
    const fullText = `${ogTitle} ${title} ${ogDesc}`.toLowerCase();
    const { LEGEND_NAMES, BIG_TIME_EFHUB_IDS } = require('./card-tier-fixer.service');

    let tierSlug = 'highlight'; // default for special cards on efhub

    if (BIG_TIME_EFHUB_IDS.includes(String(efhubId))) {
      tierSlug = 'big_time';
    } else if (LEGEND_NAMES.some((leg) => playerName.toLowerCase().includes(leg.toLowerCase()))) {
      tierSlug = 'epic';
    } else if (/\bbig[\s_-]?time\b/.test(fullText)) {
      tierSlug = 'big_time';
    } else if (/\bepic\b/.test(fullText)) {
      tierSlug = 'epic';
    } else if (/\bshow[\s_-]?time\b/.test(fullText)) {
      tierSlug = 'show_time';
    } else if (/\bpotw\b/.test(fullText)) {
      tierSlug = 'potw';
    } else if (ovr < 84) {
      tierSlug = 'normal';
    } else {
      tierSlug = 'highlight';
    }

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
 * Main Sync function: Scrapes new cards from packs and /new-players and inserts into DB
 * @param {Object} [options]
 * @param {Object} [options.dbClient] - Custom db instance
 * @param {number} [options.limit] - Limit number of new cards to sync per run
 */
async function syncLatestPlayers(options = {}) {
  const pool = options.dbClient || db;
  const limit = options.limit || 150;

  logger.info('🔄 [PlayerSync] Starting comprehensive eFootball card synchronization...');

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

  const addedPlayers = [];

  // Helper to insert a card
  async function insertCard(card) {
    const posId = posMap[card.position_code] || posMap['CF'] || 10;
    const tierId = tierMap[card.tier_slug] || tierMap['normal'] || 1;

    try {
      await pool.query(
        `INSERT INTO player_cards 
          (game_id, card_tier_id, position_id, player_name, overall_rating, efhub_id, image_url, is_active, base_value)
         VALUES 
          (1, ?, ?, ?, ?, ?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE
          card_tier_id = VALUES(card_tier_id),
          overall_rating = VALUES(overall_rating),
          image_url = VALUES(image_url),
          is_active = 1`,
        [tierId, posId, card.player_name, card.overall_rating, card.efhub_id, card.image_url]
      );
      existingSet.add(String(card.efhub_id));
      addedPlayers.push(card);
      logger.info(`[PlayerSync] Added: [${card.position_code}] ${card.player_name} (${card.overall_rating} OVR) - ID: ${card.efhub_id}`);
    } catch (err) {
      logger.warn(`[PlayerSync] Insert error for ${card.efhub_id}: ${err.message}`);
    }
  }

  // 3. Scan packs first (fast & reliable)
  for (const slug of KNOWN_PACK_SLUGS) {
    if (addedPlayers.length >= limit) break;
    const packCards = await fetchPackCards(slug);
    for (const card of packCards) {
      await insertCard(card);
    }
  }

  // 4. Fetch from /new-players for any standalone new cards
  const scrapedIds = await fetchLatestEfhubIds();
  const missingIds = scrapedIds.filter((id) => !existingSet.has(String(id))).slice(0, Math.max(0, limit - addedPlayers.length));

  if (missingIds.length > 0) {
    const CONCURRENCY = 3;
    let index = 0;

    async function worker() {
      while (index < missingIds.length && addedPlayers.length < limit) {
        const currentId = missingIds[index++];
        await sleep(350);

        const card = await fetchPlayerData(currentId);
        if (card && !existingSet.has(String(card.efhub_id))) {
          await insertCard(card);
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
  }

  // Run tier cleanup to ensure correct categorization
  try {
    const { fixCardTiers } = require('./card-tier-fixer.service');
    await fixCardTiers();
  } catch (err) {
    logger.warn(`[PlayerSync] Post-sync tier fixer error: ${err.message}`);
  }

  logger.info(`🎉 [PlayerSync] Finished sync. Added ${addedPlayers.length} new player cards.`);

  return {
    scanned: scrapedIds.length + KNOWN_PACK_SLUGS.length,
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
  fetchPackCards,
  KNOWN_PACK_SLUGS,
};
