const express = require('express');
const router = express.Router();

const disputesAdminController = require('../../controllers/admin/disputes.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validate, resolveDisputeSchema, addDisputeCommentSchema } = require('../../utils/validators');

/**
 * Admin Dispute Management Routes
 * Base path: /api/v1/admin/disputes
 */

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  disputesAdminController.getAllDisputes
);

router.get(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  disputesAdminController.getAdminDisputeDetail
);

router.post(
  '/:id/assign',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  disputesAdminController.assignDispute
);

router.post(
  '/:id/comments',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(addDisputeCommentSchema),
  disputesAdminController.addComment
);

router.post(
  '/:id/resolve/seller',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(resolveDisputeSchema),
  disputesAdminController.resolveForSeller
);

router.post(
  '/:id/resolve/buyer',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(resolveDisputeSchema),
  disputesAdminController.resolveForBuyer
);

module.exports = router;
