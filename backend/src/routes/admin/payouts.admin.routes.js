const express = require('express');
const router = express.Router();
const payoutsAdminController = require('../../controllers/admin/payouts.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Payouts Routes
 * Base path: /api/v1/admin/payouts
 */

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', payoutsAdminController.getAllPayouts);
router.patch('/:id', payoutsAdminController.updatePayoutStatus);

module.exports = router;
