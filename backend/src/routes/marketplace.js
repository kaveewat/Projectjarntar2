const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// GET /api/marketplace — active listings
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT al.id, al.title AS player_name, p.name AS position, al.team_strength AS overall_rating,
              al.asking_price, al.created_at AS listed_at, u.display_name AS seller_name, p.name AS platform_name
       FROM account_listings al
       LEFT JOIN users u ON al.seller_id = u.id
       LEFT JOIN platforms p ON al.platform_id = p.id
       WHERE al.status = 'ACTIVE'
       ORDER BY al.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/marketplace — create listing
router.post('/', async (req, res, next) => {
  try {
    const { player_id, asking_price, seller_id } = req.body;
    const [result] = await db.query(
      `INSERT INTO marketplace (player_id, asking_price, seller_id, status, listed_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [player_id, asking_price, seller_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Listing created' });
  } catch (err) { next(err); }
});

module.exports = router;
