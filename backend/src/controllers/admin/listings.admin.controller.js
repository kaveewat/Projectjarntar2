const listingModel = require('../../models/listing.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin: View all listings
 * GET /api/v1/admin/listings
 */
const getAllListings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { status, seller_id, sort } = req.query;

    const { listings, total } = await listingModel.findAll({
      status: status || 'ALL',
      seller_id,
      sort,
      limit,
      offset,
    });

    return sendPaginated(res, listings, page, limit, total, 'Admin listings retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin: Suspend listing
 * PATCH /api/v1/admin/listings/:id/suspend
 */
const suspendListing = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    const reason = req.body.reason || 'Suspended by system administrator';
    await listingModel.updateStatus(id, 'SUSPENDED', reason);
    const updated = await listingModel.findById(id);

    return sendSuccess(res, { listing: updated }, 'Listing suspended successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin: Restore suspended listing
 * PATCH /api/v1/admin/listings/:id/restore
 */
const restoreListing = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    await listingModel.updateStatus(id, 'ACTIVE', null);
    const updated = await listingModel.findById(id);

    return sendSuccess(res, { listing: updated }, 'Listing restored to ACTIVE state');
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin: Soft delete listing
 * DELETE /api/v1/admin/listings/:id
 */
const deleteListing = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const listing = await listingModel.findById(id);

    if (!listing) {
      throw new AppError(`Listing with ID ${id} not found.`, 404, 'LISTING_NOT_FOUND');
    }

    await listingModel.softDelete(id);
    return sendSuccess(res, null, 'Listing soft-deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllListings,
  suspendListing,
  restoreListing,
  deleteListing,
};
