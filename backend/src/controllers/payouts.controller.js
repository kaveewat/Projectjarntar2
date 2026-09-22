const payoutModel = require('../models/payout.model');
const { sendPaginated } = require('../utils/response');

/**
 * User Payouts Controller
 */

/**
 * Get current seller's payouts
 * GET /api/v1/payouts/me
 */
const getMyPayouts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { payouts, total } = await payoutModel.findBySeller(req.user.id, {
      limit,
      offset,
    });

    return sendPaginated(res, payouts, page, limit, total, 'Seller payouts retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMyPayouts,
};
