const express = require('express');
const router = express.Router();
const payoutsController = require('../controllers/payouts.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

/**
 * Payouts Routes
 * Base path: /api/v1/payouts
 */

router.use(requireAuth);

router.get('/me', payoutsController.getMyPayouts);

module.exports = router;
