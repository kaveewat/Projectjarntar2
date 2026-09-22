const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// GET /api/squads — list all squads
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT ss.id, ss.team_name, ss.team_strength, ss.created_at,
              COALESCE(v.total_market_value, 0) AS total_value
       FROM squad_scans ss
       LEFT JOIN valuations v ON ss.id = v.squad_scan_id
       ORDER BY ss.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/squads/:id — squad detail + players
router.get('/:id', async (req, res, next) => {
  try {
    const [[squad]] = await db.query('SELECT * FROM squads WHERE id = ?', [req.params.id]);
    if (!squad) return res.status(404).json({ message: 'Squad not found' });

    const [players] = await db.query(
      `SELECT p.* FROM players p
       JOIN squad_players sp ON p.id = sp.player_id
       WHERE sp.squad_id = ?`,
      [req.params.id]
    );
    res.json({ ...squad, players });
  } catch (err) { next(err); }
});

module.exports = router;
