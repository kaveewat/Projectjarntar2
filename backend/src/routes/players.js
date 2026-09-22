const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// GET /api/players — list all players
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT pc.id, pc.player_name AS name, pos.code AS position, pc.club, pc.overall_rating, pc.base_value
       FROM player_cards pc
       LEFT JOIN positions pos ON pc.position_id = pos.id
       WHERE pc.is_active = 1
       ORDER BY pc.overall_rating DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/players/:id — single player
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT pc.id, pc.player_name AS name, pos.code AS position, pc.club, pc.overall_rating, pc.base_value
       FROM player_cards pc
       LEFT JOIN positions pos ON pc.position_id = pos.id
       WHERE pc.id = ? AND pc.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Player not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
