const payoutModel = require('../../models/payout.model');
const auditModel = require('../../models/audit.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin Payouts Controller
 */

/**
 * List all seller payouts (Admin)
 * GET /api/v1/admin/payouts
 */
const getAllPayouts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { status } = req.query;

    const { payouts, total } = await payoutModel.findAll({
      status,
      limit,
      offset,
    });

    return sendPaginated(res, payouts, page, limit, total, 'All payouts retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Update payout status (Admin)
 * PATCH /api/v1/admin/payouts/:id
 */
const updatePayoutStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, bank_reference, transfer_slip_url, note } = req.body;

    const allowed = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (!status || !allowed.includes(status)) {
      throw new AppError(`Invalid payout status '${status}'`, 400, 'VALIDATION_ERROR');
    }

    const payout = await payoutModel.findById(id);
    if (!payout) {
      throw new AppError(`Payout with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const beforeStatus = payout.status;
    await payoutModel.updateStatus(id, {
      status,
      processedBy: req.user.id,
      bankReference: bank_reference,
      transferSlipUrl: transfer_slip_url,
      note,
    });

    const updated = await payoutModel.findById(id);

    // Record audit log
    await auditModel.createLog({
      actorId: req.user.id,
      action: 'UPDATE_PAYOUT_STATUS',
      targetType: 'SELLER_PAYOUT',
      targetId: id,
      beforeData: { status: beforeStatus },
      afterData: { status, bank_reference, note },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { payout: updated }, 'Payout status updated successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllPayouts,
  updatePayoutStatus,
};
