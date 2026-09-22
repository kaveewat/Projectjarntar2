const disputeModel = require('../models/dispute.model');
const disputeService = require('../services/dispute.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Buyer & User Dispute Resolution Controller
 */

/**
 * Open formal dispute
 * POST /api/v1/disputes
 */
const openDispute = async (req, res, next) => {
  try {
    const { order_id, dispute_reason_id, description } = req.body;

    const dispute = await disputeService.openDispute({
      orderId: Number(order_id),
      buyerId: req.user.id,
      disputeReasonId: Number(dispute_reason_id),
      description,
    });

    return sendCreated(
      res,
      { dispute },
      'Dispute opened successfully. Escrow funds frozen pending moderator investigation.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get user's disputes (as Buyer or Seller)
 * GET /api/v1/disputes/me
 */
const getMyDisputes = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const status = req.query.status || 'ALL';

    const { disputes, total } = await disputeModel.findAll({
      userId: req.user.id,
      status,
      limit,
      offset,
    });

    return sendPaginated(res, disputes, page, limit, total, 'User disputes retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get dispute details with evidence and comments
 * GET /api/v1/disputes/:id
 */
const getDisputeDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      throw new AppError(`Dispute with ID ${req.params.id} not found`, 404, 'NOT_FOUND');
    }

    const dispute = await disputeModel.findById(id);

    if (!dispute) {
      throw new AppError(`Dispute with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const isParticipant = dispute.buyer_id === req.user.id || dispute.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to view this dispute', 403, 'FORBIDDEN');
    }

    const evidence = await disputeModel.getEvidence(id);
    const comments = await disputeModel.getComments(id, isStaff);

    return sendSuccess(res, { dispute, evidence, comments }, 'Dispute details retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get dispute details by order ID
 * GET /api/v1/disputes/order/:orderId
 */
const getDisputeByOrderId = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!orderId || isNaN(orderId)) {
      throw new AppError(`Invalid Order ID ${req.params.orderId}`, 400, 'BAD_REQUEST');
    }

    let disputeSummary = await disputeModel.findByOrderId(orderId);
    let targetDisputeId = disputeSummary ? disputeSummary.id : null;

    // If not found by order_id, check if the passed param was actually a dispute id
    if (!targetDisputeId) {
      const directDispute = await disputeModel.findById(orderId);
      if (directDispute) {
        targetDisputeId = directDispute.id;
      }
    }

    if (!targetDisputeId) {
      throw new AppError(`No dispute found for Order #${orderId}`, 404, 'NOT_FOUND');
    }

    const dispute = await disputeModel.findById(targetDisputeId);
    if (!dispute) {
      throw new AppError(`Dispute for Order #${orderId} not found`, 404, 'NOT_FOUND');
    }

    const isParticipant = dispute.buyer_id === req.user.id || dispute.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to view this dispute', 403, 'FORBIDDEN');
    }

    const evidence = await disputeModel.getEvidence(dispute.id);
    const comments = await disputeModel.getComments(dispute.id, isStaff);

    return sendSuccess(res, { dispute, evidence, comments }, 'Dispute details retrieved');
  } catch (err) {
    return next(err);
  }
};


/**
 * Upload evidence for dispute
 * POST /api/v1/disputes/:id/evidence
 */
const uploadEvidence = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const dispute = await disputeModel.findById(id);

    if (!dispute) {
      throw new AppError(`Dispute with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const isParticipant = dispute.buyer_id === req.user.id || dispute.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to add evidence to this dispute', 403, 'FORBIDDEN');
    }

    let fileUrl = req.body.file_url;
    let fileType = 'LINK';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileType = 'IMAGE';
    }

    if (!fileUrl) {
      throw new AppError('Evidence file or file_url is required', 400, 'VALIDATION_ERROR');
    }

    const description = req.body.description || null;
    const evidenceId = await disputeModel.addEvidence({
      disputeId: id,
      uploadedBy: req.user.id,
      fileUrl,
      fileType,
      description,
    });

    const evidenceList = await disputeModel.getEvidence(id);
    return sendSuccess(
      res,
      { evidence_id: evidenceId, evidence: evidenceList },
      'Evidence attached successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get active dispute reasons (Public)
 * GET /api/v1/disputes/reasons
 */
const getReasons = async (_req, res, next) => {
  try {
    const reasons = await disputeModel.getReasons();
    return sendSuccess(res, { reasons }, 'Dispute reasons retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  openDispute,
  getMyDisputes,
  getDisputeDetail,
  getDisputeByOrderId,
  uploadEvidence,
  getReasons,
};
