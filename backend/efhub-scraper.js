/**
 * efhub-scraper.js
 * Fast concurrent scraper for efhub.com player cards:
 * - Scrapes 1000 player IDs from sitemap + curated iconic card IDs
 * - Uses 4 concurrent workers (delay ~1.2s per request)
 * - Extracts: name, OVR, position, tier, image URL
 * - Inserts into MySQL player_cards table
 */

const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// ── Config ──────────────────────────────────────────────
const CONCURRENCY    = 4;        // 4 concurrent workers
const WORKER_DELAY   = 1200;     // 1.2s delay per worker
const MAX_PLAYERS    = 800;      // max players to insert
const MIN_OVR        = 80;       // minimum OVR
const LOG_FILE       = './efhub-scraper.log';
const CDN_BASE       = 'https://efimg.com/efootballhub22/images/player_cards';

// Curated priority IDs (e.g. all 9 versions of Ruud Gullit and top icons)
const PRIORITY_IDS = [
  // Ruud Gullit (all 9 versions from screenshot)
  '17592186179050', // 89 AMF Epic
  '88041460993514', // 89 CF Show Time
  '17592454614506', // 88 AMF Legend
  '88039045074410', // 87 AMF
  '88033139494378', // 86 SS
  '88035555413482', // 86 SS
  '88029918268906', // 85 AMF
  '87963346275818', // 84 AMF
  '87964420017642', // 84 SS
  // Top Icons & Fan Favorites
  '88045755828950', // George Best
  '88045755861672', // Gareth Bale
  '106786308889284', // Florian Wirtz
  '89139630444046', // Del Piero
  '88040387119495', // Pele
  '88044145348075', // Johan Cruyff
  '88045755960770', // Paolo Maldini
  '89138556575063', // Lionel Messi 90
  '89136409091415', // Lionel Messi 89
  '89133456301399', // Lionel Messi 88
  '89138288136169', // Andres Iniesta
  '88039581945324', // Beckenbauer
  '88044145253792', // Neymar Jr
  '88044145248321', // Luis Suarez
  '89136140651034', // Zlatan Ibrahimovic
  '106778255821223', // Erling Haaland
  '88036092152543', // Michel Platini
  '88036360719824', // Ronaldinho
  '88036360719854', // Zico
  '88036360589289', // Kaka
  '88036360588974', // Eric Cantona
];

// ── DB Pool ──────────────────────────────────────────────
let db;
async function getDb() {
  if (!db) {
    db = await mysql.createPool({
      host:     process.env.DB_HOST || 'localhost',
      port:     Number(process.env.DB_PORT) || 3307,
      user:     process.env.DB_USER || 'efootball_user',
      password: process.env.DB_PASSWORD || 'efootball_pass',
      database: process.env.DB_NAME || 'efootball_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return db;
}

// ── Logger ──────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) {}
}

// ── Lookup Tables (DB) ───────────────────────────────────
let tierMap = {};       // { name_lower: id }
let positionMap = {};   // { code_upper: id }

async function loadLookups() {
  const pool = await getDb();
  const [tiers] = await pool.query('SELECT id, name, slug FROM card_tiers');
  tiers.forEach(t => {
    tierMap[t.name.toLowerCase()] = t.id;
    tierMap[t.slug.toLowerCase()] = t.id;
  });

  const [positions] = await pool.query('SELECT id, code FROM positions');
  positions.forEach(p => {
    positionMap[p.code.toUpperCase()] = p.id;
  });

  log(`Loaded ${tiers.length} tiers, ${positions.length} positions`);
}

// ── Step 1: Get player IDs from sitemap ─────────────────
async function getPlayerIds() {
  log('Fetching sitemap.xml...');
  try {
    const r = await fetch('https://efhub.com/sitemap.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const text = await r.text();
    const matches = text.match(/\/players\/(\d+)/g) || [];
    const sitemapIds = matches.map(m => m.replace('/players/', ''));
    
    // Combine Priority IDs + Sitemap IDs (unique)
    const combined = [...new Set([...PRIORITY_IDS, ...sitemapIds])];
    log(`Total unique IDs to process: ${combined.length} (${PRIORITY_IDS.length} priority + sitemap)`);
    return combined;
  } catch (err) {
    log(`Failed to fetch sitemap: ${err.message}. Using priority list.`);
    return [...new Set(PRIORITY_IDS)];
  }
}

// ── Step 2: Fetch & parse a single player page ───────────
async function fetchPlayerData(efhubId) {
  const url = `https://efhub.com/en/players/${efhubId}`;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!r.ok) {
      log(`SKIP ${efhubId}: HTTP ${r.status}`);
      return null;
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    const title    = $('title').text() || '';
    const ogTitle  = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc   = $('meta[property="og:description"]').attr('content') || '';
    const ogImage  = $('meta[property="og:image"]').attr('content') || '';

    // Extract player name
    const titleStr = ogTitle || title;
    const nameMatch = titleStr.match(/^(.+?)\s*[\u2014|]\s/);
    const playerName = nameMatch ? nameMatch[1].trim() : null;

    if (!playerName) {
      return null;
    }

    // Extract OVR
    let ovr = null;
    const ovrFromTitle = title.match(/[\u2014\-]\s*(\d{2,3})\s*OVR/i);
    const ovrFromDesc  = ogDesc.match(/a\s+(\d{2,3})-rated/i);
    if (ovrFromTitle) ovr = parseInt(ovrFromTitle[1]);
    else if (ovrFromDesc) ovr = parseInt(ovrFromDesc[1]);

    if (!ovr || ovr < MIN_OVR) {
      return null;
    }

    // Cap OVR at 120 so it never exceeds DB constraints
    ovr = Math.min(ovr, 120);

    // Extract position
    let position = null;
    const posFromDesc = ogDesc.match(/\d+-rated\s+([A-Z]{2,3})\s+in/i);
    if (posFromDesc) position = posFromDesc[1].toUpperCase();

    // Image URL: standard CDN pattern
    const imageUrl = ogImage || `${CDN_BASE}/${efhubId}_l.png`;

    // ── Tier Detection: keyword first, then OVR fallback ─────────────────────
    // Check title + description for explicit tier keywords (most accurate)
    const fullText = `${ogTitle} ${title} ${ogDesc}`.toLowerCase();
    let tierSlug = 'normal';
    if (/\bbig[\s_-]?time\b/.test(fullText) || /\blegendary\b/.test(fullText)) {
      tierSlug = 'big_time';
    } else if (/\bepic\b/.test(fullText)) {
      tierSlug = 'epic';
    } else if (/\bshow[\s_-]?time\b/.test(fullText) || /\bfeatured\b/.test(fullText)) {
      tierSlug = 'show_time';
    } else {
      // OVR-based fallback (for pages that don't explicitly mention tier)
      if (ovr >= 95) tierSlug = 'big_time';
      else if (ovr >= 88) tierSlug = 'epic';
      else if (ovr >= 85) tierSlug = 'show_time';
    }

    return {
      efhub_id: BigInt(efhubId),
      player_name: playerName,
      overall_rating: ovr,
      position_code: position,
      tier_slug: tierSlug,
      image_url: imageUrl,
    };
  } catch (err) {
    log(`ERROR ${efhubId}: ${err.message}`);
    return null;
  }
}

// ── Step 3: Insert single player into DB ────────────────
async function insertOnePlayer(p) {
  const pool = await getDb();
  
  // Check if efhub_id already exists
  const [existing] = await pool.query(
    'SELECT id, overall_rating FROM player_cards WHERE efhub_id = ?',
    [p.efhub_id.toString()]
  );
  if (existing.length > 0) {
    return { status: 'exists' };
  }

  const posCode = p.position_code?.toUpperCase();
  const positionId = positionMap[posCode] || 6; // fallback: CMF
  const cardTierId = tierMap[p.tier_slug] || 1;

  try {
    await pool.query(
      `INSERT INTO player_cards 
        (game_id, efhub_id, image_url, card_tier_id, position_id, player_name, 
         overall_rating, base_value, season, is_active)
       VALUES (1, ?, ?, ?, ?, ?, ?, 0, '2025', 1)`,
      [
        p.efhub_id.toString(),
        p.image_url,
        cardTierId,
        positionId,
        p.player_name,
        p.overall_rating,
      ]
    );
    return { status: 'inserted' };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { status: 'exists' };
    log(`DB ERROR ${p.player_name} (${p.efhub_id}): ${err.message}`);
    return { status: 'error', error: err.message };
  }
}

// ── Main Concurrent Worker Pool ─────────────────────────
async function main() {
  log('=== efhub Fast Concurrent Scraper Starting ===');
  log(`Concurrency: ${CONCURRENCY} workers | Worker Delay: ${WORKER_DELAY}ms | Min OVR: ${MIN_OVR}`);

  await loadLookups();
  const allIds = await getPlayerIds();

  let index = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  async function worker(workerId) {
    while (index < allIds.length && totalInserted < MAX_PLAYERS) {
      const currentIdx = index++;
      const id = allIds[currentIdx];

      const data = await fetchPlayerData(id);
      if (data) {
        const res = await insertOnePlayer(data);
        if (res.status === 'inserted') {
          totalInserted++;
          log(`[W${workerId}] +INSERT (${totalInserted}/${MAX_PLAYERS}): ${data.player_name} (OVR:${data.overall_rating} ${data.position_code} ${data.tier_slug})`);
        } else {
          totalSkipped++;
        }
      } else {
        totalSkipped++;
      }

      await new Promise(r => setTimeout(r, WORKER_DELAY));
    }
  }

  log(`Spawning ${CONCURRENCY} concurrent workers...`);
  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  log('=== Scraper Complete! ===');
  log(`Total Inserted: ${totalInserted} | Skipped/Existing: ${totalSkipped}`);

  if (db) await db.end();
  process.exit(0);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
