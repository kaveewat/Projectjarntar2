const express = require('express');
const router = express.Router();

const disputesController = require('../controllers/disputes.controller');
const { requireAuth } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');
const { validate, openDisputeSchema } = require('../utils/validators');

/**
 * Dispute Resolution Routes
 * Base path: /api/v1/disputes
 */

// Public: dispute reasons catalog
router.get('/reasons', disputesController.getReasons);

// My disputes
router.get('/me', requireAuth, disputesController.getMyDisputes);

// Open new dispute
router.post(
  '/',
  requireAuth,
  validate(openDisputeSchema),
  disputesController.openDispute
);

// View dispute by order ID
router.get('/order/:orderId', requireAuth, disputesController.getDisputeByOrderId);

// View dispute detail
router.get('/:id', requireAuth, disputesController.getDisputeDetail);

// Upload evidence
router.post(
  '/:id/evidence',
  requireAuth,
  uploadSingleImage('evidence'),
  disputesController.uploadEvidence
);

module.exports = router;
