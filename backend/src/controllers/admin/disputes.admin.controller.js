const disputeModel = require('../../models/dispute.model');
const disputeService = require('../../services/dispute.service');
const orderModel = require('../../models/order.model');
const escrowModel = require('../../models/escrow.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin & Moderator Dispute Resolution Controller
 */

/**
 * List all disputes (Admin)
 * GET /api/v1/admin/disputes
 */
const getAllDisputes = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { status, assigned_to } = req.query;

    let assignedId = null;
    if (assigned_to === 'me') {
      assignedId = req.user.id;
    } else if (assigned_to) {
      assignedId = Number(assigned_to);
    }

    const { disputes, total } = await disputeModel.findAll({
      status: status || 'ALL',
      assignedTo: assignedId,
      limit,
      offset,
    });

    return sendPaginated(res, disputes, page, limit, total, 'Admin disputes retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get dispute detail with full context (Admin)
 * GET /api/v1/admin/disputes/:id
 */
const getAdminDisputeDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const dispute = await disputeModel.findById(id);

    if (!dispute) {
      throw new AppError(`Dispute with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const order = await orderModel.findById(dispute.order_id);
    const escrow = await escrowModel.findByOrderId(dispute.order_id);
    const evidence = await disputeModel.getEvidence(id);
    const comments = await disputeModel.getComments(id, true); // true = include internal notes

    return sendSuccess(
      res,
      {
        dispute,
        order,
        escrow,
        evidence,
        comments,
      },
      'Admin dispute detail retrieved'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Assign dispute case to moderator/admin
 * POST /api/v1/admin/disputes/:id/assign
 */
const assignDispute = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const moderatorId = req.body.moderator_id ? Number(req.body.moderator_id) : req.user.id;

    const dispute = await disputeModel.findById(id);
    if (!dispute) {
      throw new AppError(`Dispute with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    await disputeModel.assignDispute(id, moderatorId);
    const updated = await disputeModel.findById(id);

    return sendSuccess(res, { dispute: updated }, 'Dispute case assigned successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Add comment / internal note to dispute
 * POST /api/v1/admin/disputes/:id/comments
 */
const addComment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { message, is_internal } = req.body;

    const dispute = await disputeModel.findById(id);
    if (!dispute) {
      throw new AppError(`Dispute with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const commentId = await disputeModel.addComment({
      disputeId: id,
      authorId: req.user.id,
      message,
      isInternal: !!is_internal,
    });

    const comments = await disputeModel.getComments(id, true);
    return sendSuccess(res, { comment_id: commentId, comments }, 'Comment added successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Resolve dispute in favor of Seller
 * POST /api/v1/admin/disputes/:id/resolve/seller
 */
const resolveForSeller = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { resolution_note } = req.body;

    const resolved = await disputeService.resolveForSeller({
      disputeId: id,
      adminId: req.user.id,
      resolutionNote: resolution_note,
    });

    const order = await orderModel.findById(resolved.order_id);
    const escrow = await escrowModel.findByOrderId(resolved.order_id);

    return sendSuccess(
      res,
      { dispute: resolved, order, escrow },
      'Dispute resolved in favor of seller. Escrow released and order marked as completed.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Resolve dispute in favor of Buyer
 * POST /api/v1/admin/disputes/:id/resolve/buyer
 */
const resolveForBuyer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { resolution_note } = req.body;

    const resolved = await disputeService.resolveForBuyer({
      disputeId: id,
      adminId: req.user.id,
      resolutionNote: resolution_note,
    });

    const order = await orderModel.findById(resolved.order_id);
    const escrow = await escrowModel.findByOrderId(resolved.order_id);

    return sendSuccess(
      res,
      { dispute: resolved, order, escrow },
      'Dispute resolved in favor of buyer. Escrow refunded to buyer and listing restored to active.'
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllDisputes,
  getAdminDisputeDetail,
  assignDispute,
  addComment,
  resolveForSeller,
  resolveForBuyer,
};
