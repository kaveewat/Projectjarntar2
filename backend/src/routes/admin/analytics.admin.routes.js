const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/admin/analytics.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Analytics Routes
 * Base path: /api/v1/admin/analytics
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/sales', requireRole('ADMIN'), analyticsController.getSalesAnalytics);
router.get('/listings', analyticsController.getListingsAnalytics);
router.get('/disputes', requireRole('ADMIN'), analyticsController.getDisputesAnalytics);
router.get('/prices', analyticsController.getPricesAnalytics);
router.get('/ai-accuracy', requireRole('ADMIN'), analyticsController.getAiAccuracyAnalytics);

module.exports = router;
