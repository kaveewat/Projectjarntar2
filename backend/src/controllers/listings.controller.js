const listingModel = require('../models/listing.model');
const scanModel = require('../models/scan.model');
const valuationModel = require('../models/valuation.model');
const valuationService = require('../services/valuation.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Public Marketplace Browse
 * GET /api/v1/listings
 */
const browseListings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const {
      player_name,
      min_price,
      max_price,
      min_strength,
      max_strength,
      badge,
      platform_id,
      game_id,
      sort,
    } = req.query;

    const { listings, total } = await listingModel.findAll({
      status: 'ACTIVE',
      player_name,
      min_price,
      max_price,
      min_strength,
      max_strength,
      badge,
      platform_id,
      game_id,
      sort,
      limit,
      offset,
    });

    return sendPaginated(res, listings, page, limit, total, 'Marketplace listings retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get listing detail
 * GET /api/v1/listings/:id
 */
const getListingDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    // Increment view count asynchronously
    listingModel.incrementViewCount(id).catch(() => {});

    return sendSuccess(res, { listing }, 'Listing details retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Create listing from completed squad scan
 * POST /api/v1/listings
 */
const createListing = async (req, res, next) => {
  try {
    const {
      squad_scan_id,
      platform_id,
      title,
      description = null,
      asking_price,
      game_id = 1,
      team_strength = null,
    } = req.body;

    // Rule 6.9: Check active listing limits
    const activeCount = await listingModel.countActiveBySellerId(req.user.id);
    const maxActive = req.user.role === 'VERIFIED_SELLER' ? 10 : req.user.role === 'ADMIN' ? 999 : 3;

    if (activeCount >= maxActive) {
      throw new AppError(
        `Active listing limit reached (${maxActive} maximum for ${req.user.role}). Please sell or cancel existing listings before creating a new one.`,
        422,
        'ACTIVE_LISTING_LIMIT_REACHED'
      );
    }

    // Process directly uploaded screenshots
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((f) => `/uploads/${f.filename}`);
    }

    // Parse player_ids if provided (from ทำเนียบนักเตะ picker)
    let selectedPlayerIds = [];
    if (req.body.player_ids) {
      if (Array.isArray(req.body.player_ids)) {
        selectedPlayerIds = req.body.player_ids.map(Number).filter(Boolean);
      } else if (typeof req.body.player_ids === 'string') {
        try {
          const parsed = JSON.parse(req.body.player_ids);
          if (Array.isArray(parsed)) {
            selectedPlayerIds = parsed.map(Number).filter(Boolean);
          }
        } catch {
          selectedPlayerIds = req.body.player_ids.split(',').map((s) => Number(s.trim())).filter(Boolean);
        }
      }
    }

    let scan = null;
    let valuation = null;
    let finalTeamStrength = team_strength ? Number(team_strength) : null;

    // Optional backward compatibility if squad_scan_id is provided
    if (squad_scan_id) {
      scan = await scanModel.getScanById(Number(squad_scan_id));
      if (scan) {
        valuation = await valuationModel.getByScanId(scan.id);
        if (!finalTeamStrength) {
          finalTeamStrength = valuation?.factors_used?.team_strength || scan.ai_raw_response?.team_strength || null;
        }
        if (imageUrls.length === 0 && scan.image_urls) {
          try {
            imageUrls = typeof scan.image_urls === 'string' ? JSON.parse(scan.image_urls) : scan.image_urls;
          } catch {}
        }
      }
    }

    // Create listing directly (No AI latency, direct user-specified price)
    const listingId = await listingModel.createListing({
      seller_id: req.user.id,
      game_id: Number(game_id) || 1,
      platform_id: Number(platform_id),
      squad_scan_id: scan ? scan.id : null,
      valuation_id: valuation ? valuation.id : null,
      title: title.trim(),
      description: description ? description.trim() : null,
      asking_price: Number(asking_price),
      fair_price_min: null,
      fair_price_max: null,
      value_badge: 'FAIR',
      team_strength: finalTeamStrength,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      status: 'ACTIVE',
    });

    // Link player cards (either from selectedPlayerIds or from scan)
    if (selectedPlayerIds.length > 0) {
      await listingModel.addListingPlayerCards(
        listingId,
        selectedPlayerIds.map((id) => ({ player_card_id: id }))
      );
    } else if (scan) {
      const scanPlayers = await scanModel.getScanPlayers(scan.id);
      const confirmedPlayers = scanPlayers.filter((p) => p.is_confirmed);
      await listingModel.addListingPlayerCards(listingId, confirmedPlayers);
    }

    const createdListing = await listingModel.findById(listingId);
    return sendCreated(res, { listing: createdListing }, 'Listing created successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Update listing
 * PATCH /api/v1/listings/:id
 */
const updateListing = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    // Check ownership
    if (listing.seller_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('You do not have permission to edit this listing.', 403, 'FORBIDDEN');
    }

    // Only ACTIVE listings can be edited
    if (listing.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot edit listing: Current status is '${listing.status}'. Only ACTIVE listings can be updated.`,
        422,
        'LISTING_NOT_ACTIVE'
      );
    }

    const { title, description, asking_price } = req.body;
    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;

    if (asking_price !== undefined) {
      const priceNum = Number(asking_price);
      updateFields.asking_price = priceNum;
      // Recalculate badge if price changed
      if (listing.fair_price_min && listing.fair_price_max) {
        updateFields.value_badge = valuationService.calculateValueBadge(
          priceNum,
          listing.fair_price_min,
          listing.fair_price_max
        );
      }
    }

    await listingModel.updateListing(id, updateFields);
    const updated = await listingModel.findById(id);

    return sendSuccess(res, { listing: updated }, 'Listing updated successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Cancel active listing
 * DELETE /api/v1/listings/:id
 */
const cancelListing = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    // Check ownership
    if (listing.seller_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('You do not have permission to cancel this listing.', 403, 'FORBIDDEN');
    }

    // Acceptance Criteria: Only ACTIVE listings can be cancelled
    if (listing.status !== 'ACTIVE') {
      throw new AppError(
        `Cannot cancel listing: Current status is '${listing.status}'. Only ACTIVE listings can be cancelled.`,
        422,
        'CANNOT_CANCEL_LISTING'
      );
    }

    await listingModel.updateStatus(id, 'CANCELLED');
    const cancelled = await listingModel.findById(id);

    return sendSuccess(res, { listing: cancelled }, 'Listing cancelled successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get current seller's listings
 * GET /api/v1/listings/me
 */
const getMyListings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { status } = req.query;

    const { listings, total } = await listingModel.findAll({
      seller_id: req.user.id,
      status: status || 'ALL',
      limit,
      offset,
    });

    return sendPaginated(res, listings, page, limit, total, 'Seller listings retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  browseListings,
  getListingDetail,
  createListing,
  updateListing,
  cancelListing,
  getMyListings,
};
