/**
 * card-tier-fixer.service.js
 * Automatically corrects card tiers to match eFHUB classification:
 * 1. Big Time — Iconic historic match-winning moments (Messi WC 2022, Del Piero 00, etc.)
 * 2. Epic — Global Legends / Icons (Gareth Bale, Gullit, Maldini, Cruyff, Best, Cantona, etc.)
 * 3. Show Time — Special skill cards (Momentum Dribbling, Phenomenal Finishing, Fortress, etc.)
 * 4. Highlight / Featured — Club & National Team Selections (Vinicius, Mbappe, Bellingham, Saka, Yamal, Haaland, etc.)
 * 5. POTW — Player of the Week cards
 * 6. Standard (Normal) — Base GP cards
 */

const db = require('../config/db');
const logger = require('../utils/logger');

// Known Legendary / Epic player names (case-insensitive substring match)
const LEGEND_NAMES = [
  'Bale', 'Gullit', 'Best', 'Cantona', 'Van der Sar', 'Puyol', 'Rosicky',
  'Cruyff', 'Maldini', 'Beckenbauer', 'Ronaldinho', 'Zico', 'Kaka', 'Platini',
  'Pele', 'Maradona', 'Pirlo', 'Nesta', 'Rijkaard', 'Drogba', 'Bergkamp',
  'Vieira', 'Scholes', 'Beckham', 'Roberto Carlos', 'Cafu', 'Romario',
  'Shevchenko', 'Xabi Alonso', 'Xavi', 'Iniesta', 'Casillas', 'Kahn',
  'Schmeichel', 'Cech', 'Gerrard', 'Lampard', 'Seedorf', 'Torres', 'Owen',
  'Rooney', 'Van Persie', 'Robben', 'Ribery', 'Cannavaro', 'Baresi',
  'Matthaus', 'Rummenigge', 'Van Basten', 'Van Nistelrooy', 'Batistuta',
  'Rivaldo', 'Baggio', 'Nedved', 'Deco', 'Guti', 'Morientes', 'Raul',
  'Makelele', 'Kluivert', 'Davids', 'Gascoigne', 'Lineker', 'Robson',
  'Irwin', 'Campbell', 'Pires', 'Petit', 'Ljungberg', 'Gilberto Silva',
  'Chiellini', 'Bonucci', 'De Rossi', 'Forlan', 'Figo', 'Eto\'o', 'Guardiola',
  'Albertini', 'Ambrosini', 'Serginho', 'Costacurta', 'Dida', 'Abbiati',
  'Inzaghi', 'Crespo', 'Veron', 'Zanetti', 'Cambiasso', 'Milito', 'Samuel',
  'Stankovic', 'Cordoba', 'Julio Cesar', 'Adriano', 'Recoba', 'Chivu',
  'Materazzi', 'Toldo', 'Zoff', 'Gentile', 'Scirea', 'Tardelli', 'Cabrini',
  'Rossi', 'Boniek', 'Platini', 'Sivori', 'Charles', 'Boniperti', 'Buffon'
];

// Explicit Big Time efhub IDs or player signatures
const BIG_TIME_EFHUB_IDS = [
  '105899666447703', // Lionel Messi 100 Big Time (World Cup 2022)
  '89139630444046',  // Alessandro Del Piero 87 Big Time (19 Jun 00)
];

async function fixCardTiers() {
  try {
    logger.info('🔄 [CardTierFixer] Starting card tier classification sync with eFHUB...');

    // 1. Ensure all tiers exist in card_tiers table
    const tiersToEnsure = [
      { id: 1, name: 'Standard', slug: 'normal', weight: 1, color: '#9E9E9E' },
      { id: 2, name: 'Epic', slug: 'epic', weight: 8, color: '#FFD700' },
      { id: 3, name: 'Show Time', slug: 'show_time', weight: 7, color: '#00E5FF' },
      { id: 4, name: 'Big Time', slug: 'big_time', weight: 10, color: '#FF1744' },
      { id: 5, name: 'Highlight / Featured', slug: 'highlight', weight: 5, color: '#00E676' },
      { id: 6, name: 'POTW', slug: 'potw', weight: 4, color: '#D500F9' },
    ];

    for (const t of tiersToEnsure) {
      await db.query(
        `INSERT INTO card_tiers (id, name, slug, weight, display_color)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           slug = VALUES(slug),
           weight = VALUES(weight),
           display_color = VALUES(display_color)`,
        [t.id, t.name, t.slug, t.weight, t.color]
      );
    }

    // 2. Fix Gareth Bale specifically to EPIC
    await db.query(
      `UPDATE player_cards SET card_tier_id = 2 WHERE efhub_id = 88045755861672 OR player_name LIKE '%Gareth Bale%'`
    );

    // 3. Keep Messi (100) & Del Piero (87) as BIG TIME
    await db.query(
      `UPDATE player_cards SET card_tier_id = 4 WHERE efhub_id IN (?, ?)`,
      [BIG_TIME_EFHUB_IDS[0], BIG_TIME_EFHUB_IDS[1]]
    );

    // 4. Move all modern National Teams / Club Selection high-rated cards that were misclassified as Big Time into Highlight (Tier 5)
    // Cards with efhub_id starting with 5616, 5507, 5290, 5288, 5287, 5284, 5278, 5277, etc.
    const modernStars = [
      'Vinicius Junior', 'Bukayo Saka', 'Kylian Mbappe', 'Jude Bellingham',
      'Ousmane Dembele', 'Lamine Yamal', 'Erling Haaland', 'Declan Rice',
      'Dominik Szoboszlai', 'Joao Pedro', 'William Saliba', 'Bruno Guimaraes',
      'Thibaut Courtois', 'Lautaro Martinez', 'Adrien Rabiot', 'Christian Pulisic',
      'Alex Baena', 'Julian Alvarez', 'Kubo Takefusa', 'Takefusa Kubo',
      'K. Kvaratskhelia', 'Khvicha Kvaratskhelia', 'Rodri', 'Giuliano Simeone',
      'Elliot Anderson', 'David Raya', 'Fermin Lopez', 'Alexander Isak',
      'Kai Havertz', 'Kevin De Bruyne', 'Nico Williams', 'Dani Olmo',
      'Harry Kane', 'Mohamed Salah', 'Robert Lewandowski', 'Ayyoub Bouaddi',
      'Michael Olise', 'Johan Manzambi', 'Enzo Fernandez', 'James Rodriguez',
      'Ferran Torres', 'Riccardo Calafiori', 'Karim Adeyemi', 'Youri Tielemans',
      'Francisco Conceicao', 'Leozinho', 'Joao Marcelo', 'Mauricio',
      'Lucas Arcanjo', 'Ayrton Lucas', 'Carlos Eduardo', 'Jankat Yilmaz', 'Oguz Aydin'
    ];

    // For any card matching modern star names that is currently in Big Time (4), move to Highlight (5)
    for (const name of modernStars) {
      await db.query(
        `UPDATE player_cards 
         SET card_tier_id = 5 
         WHERE (player_name LIKE ? OR player_name = ?)
           AND card_tier_id = 4
           AND efhub_id NOT IN (?, ?)`,
        [`%${name}%`, name, BIG_TIME_EFHUB_IDS[0], BIG_TIME_EFHUB_IDS[1]]
      );
    }

    // 5. Also move modern active players currently wrongly in Epic (2) into Highlight (5)
    for (const name of modernStars) {
      await db.query(
        `UPDATE player_cards 
         SET card_tier_id = 5 
         WHERE (player_name LIKE ? OR player_name = ?)
           AND card_tier_id = 2
           AND player_name NOT LIKE '%Bale%'`,
        [`%${name}%`, name]
      );
    }

    // 6. Ensure true legends are in Epic (Tier 2) if not Big Time
    for (const leg of LEGEND_NAMES) {
      await db.query(
        `UPDATE player_cards 
         SET card_tier_id = 2 
         WHERE player_name LIKE ?
           AND card_tier_id NOT IN (2, 4)
           AND efhub_id NOT IN (?, ?)`,
        [`%${leg}%`, BIG_TIME_EFHUB_IDS[0], BIG_TIME_EFHUB_IDS[1]]
      );
    }

    // 7. Any remaining cards in Big Time (4) that are NOT explicit Big Time IDs and have high OVR (>= 90) -> Highlight (5)
    await db.query(
      `UPDATE player_cards 
       SET card_tier_id = 5 
       WHERE card_tier_id = 4 
         AND efhub_id NOT IN (?, ?)`,
      [BIG_TIME_EFHUB_IDS[0], BIG_TIME_EFHUB_IDS[1]]
    );

    // 8. Re-classify 640 cards currently in show_time (3):
    // Cards from weekly packs with OVR >= 85 are Highlight (5)
    await db.query(
      `UPDATE player_cards 
       SET card_tier_id = 5 
       WHERE card_tier_id = 3 
         AND overall_rating >= 85`
    );

    // Cards in show_time with OVR < 85 become Standard (1)
    await db.query(
      `UPDATE player_cards 
       SET card_tier_id = 1 
       WHERE card_tier_id = 3 
         AND overall_rating < 85`
    );

    logger.info('✅ [CardTierFixer] Successfully corrected card tiers according to eFHUB standard!');
    return { success: true, message: 'Card tiers corrected' };
  } catch (err) {
    logger.error(`❌ [CardTierFixer] Error fixing card tiers: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = {
  fixCardTiers,
  LEGEND_NAMES,
  BIG_TIME_EFHUB_IDS,
};
