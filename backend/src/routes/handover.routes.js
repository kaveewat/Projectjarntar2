const express = require('express');
const router = express.Router();

const handoverController = require('../controllers/handover.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { validate, submitCredentialsSchema } = require('../utils/validators');

/**
 * Handover Room Routes
 * Base path: /api/v1/handover
 */

// Admin view access logs
router.get(
  '/admin/:order_id/logs',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  handoverController.getAdminHandoverLogs
);

// View room status
router.get(
  '/:order_id',
  requireAuth,
  handoverController.getRoomStatus
);

// Seller submits confidential credentials
router.post(
  '/:order_id/submit',
  requireAuth,
  validate(submitCredentialsSchema),
  handoverController.submitAccountInfo
);

// Buyer views and decrypts credentials
router.get(
  '/:order_id/info',
  requireAuth,
  handoverController.getAccountInfo
);

// Buyer confirms successful receipt
router.post(
  '/:order_id/confirm',
  requireAuth,
  handoverController.confirmReceipt
);

// Buyer reports problem (opens dispute)
router.post(
  '/:order_id/problem',
  requireAuth,
  handoverController.reportProblem
);

module.exports = router;
