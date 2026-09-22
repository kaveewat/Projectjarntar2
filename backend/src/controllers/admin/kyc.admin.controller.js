const kycModel = require('../../models/kyc.model');
const notificationService = require('../../services/notification.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin KYC Management Controller
 */

// GET /api/v1/admin/kyc
const getAllKyc = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    const { kycList, total } = await kycModel.findAll({ status, limit, offset });
    return sendPaginated(res, kycList, page, limit, total, 'KYC records retrieved');
  } catch (err) {
    return next(err);
  }
};

// GET /api/v1/admin/kyc/:id
const getKycDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const kyc = await kycModel.findById(id);
    if (!kyc) {
      throw new AppError(`KYC record with ID ${id} not found`, 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { kyc }, 'KYC record retrieved');
  } catch (err) {
    return next(err);
  }
};

// POST /api/v1/admin/kyc/:id/approve
const approveKyc = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await kycModel.approveKyc(id, req.user.id);
    if (!updated) {
      throw new AppError(`KYC record with ID ${id} not found`, 404, 'NOT_FOUND');
    }
    // N21 Notification
    notificationService.notifyKycApproved({ userId: updated.user_id }).catch(() => {});
    return sendSuccess(res, { kyc: updated }, 'KYC verification approved successfully');
  } catch (err) {
    return next(err);
  }
};

// POST /api/v1/admin/kyc/:id/reject
const rejectKyc = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reason = req.body.reason || 'Document does not meet verification requirements';
    const updated = await kycModel.rejectKyc(id, req.user.id, reason);
    if (!updated) {
      throw new AppError(`KYC record with ID ${id} not found`, 404, 'NOT_FOUND');
    }
    // N22 Notification
    notificationService.notifyKycRejected({ userId: updated.user_id, reason }).catch(() => {});
    return sendSuccess(res, { kyc: updated }, 'KYC verification rejected');
  } catch (err) {
    return next(err);
  }
};


module.exports = {
  getAllKyc,
  getKycDetail,
  approveKyc,
  rejectKyc,
};
