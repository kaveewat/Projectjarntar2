const express = require('express');
const router = express.Router();

const ordersAdminController = require('../../controllers/admin/orders.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Escrow Overview Route
 * Base path: /api/v1/admin/escrow
 */

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  ordersAdminController.getEscrowOverview
);

module.exports = router;
