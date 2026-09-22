const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/admin/analytics.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Dashboard Routes
 * Base path: /api/v1/admin/dashboard
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/', analyticsController.getAdminOverview);
router.get('/pending-actions', analyticsController.getAdminPendingActions);

module.exports = router;
