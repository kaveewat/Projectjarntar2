const express = require('express');
const router = express.Router();

const listingsAdminController = require('../../controllers/admin/listings.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin / Moderator Listing Management Routes
 * Base path: /api/v1/admin/listings
 */
router.get('/', requireAuth, requireRole('ADMIN', 'MODERATOR'), listingsAdminController.getAllListings);
router.patch('/:id/suspend', requireAuth, requireRole('ADMIN', 'MODERATOR'), listingsAdminController.suspendListing);
router.patch('/:id/restore', requireAuth, requireRole('ADMIN'), listingsAdminController.restoreListing);
router.delete('/:id', requireAuth, requireRole('ADMIN'), listingsAdminController.deleteListing);

module.exports = router;
