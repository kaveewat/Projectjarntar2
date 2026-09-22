const express = require('express');
const router = express.Router();

const listingsController = require('../controllers/listings.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { validate, createListingSchema, updateListingSchema } = require('../utils/validators');

const { uploadSquadImages } = require('../middleware/upload');

/**
 * Public Marketplace Routes
 * Base path: /api/v1/listings
 */
router.get('/', listingsController.browseListings);
router.get('/me', requireAuth, listingsController.getMyListings);
router.get('/:id', listingsController.getListingDetail);

/**
 * Seller Management Routes
 */
router.post(
  '/',
  requireAuth,
  requireRole('SELLER', 'VERIFIED_SELLER', 'ADMIN'),
  uploadSquadImages('images', 10),
  validate(createListingSchema),
  listingsController.createListing
);

router.patch(
  '/:id',
  requireAuth,
  validate(updateListingSchema),
  listingsController.updateListing
);

router.delete(
  '/:id',
  requireAuth,
  listingsController.cancelListing
);

module.exports = router;
