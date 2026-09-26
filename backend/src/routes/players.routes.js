const express = require('express');
const router = express.Router();
const playersController = require('../controllers/players.controller');

/**
 * Player Master Data Routes
 * Base path: /api/v1/players
 */
router.get('/', playersController.browsePlayers);
router.post('/sync-latest', playersController.syncLatestCards);
router.post('/fix-tiers', playersController.fixTiers);
router.get('/tiers', playersController.getTiers);
router.get('/positions', playersController.getPositions);
router.get('/games', playersController.getGames);
router.get('/:id', playersController.getPlayerDetail);

module.exports = router;

