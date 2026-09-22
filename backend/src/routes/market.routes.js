const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');

/**
 * Public Market Routes
 * Base path: /api/v1/market
 */

// Public endpoint - no auth required
router.get('/price-history', marketController.getPriceHistory);

module.exports = router;
