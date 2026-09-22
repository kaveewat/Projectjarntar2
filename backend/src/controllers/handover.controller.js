const handoverModel = require('../models/handover.model');
const handoverService = require('../services/handover.service');
const disputeService = require('../services/dispute.service');
const orderModel = require('../models/order.model');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Secure Handover Room Controller
 */

/**
 * Get handover room status
 * GET /api/v1/handover/:order_id
 */
const getRoomStatus = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const order = await orderModel.findById(orderId);

    if (!order) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }

    const isParticipant = order.buyer_id === req.user.id || order.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to access this handover room', 403, 'FORBIDDEN');
    }

    const room = await handoverModel.getOrCreateRoom(orderId, order.handover_deadline);
    const enrichedRoom = {
      ...room,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      order_number: order.order_number,
      order_status: order.status,
      order_amount: order.amount,
    };
    return sendSuccess(res, { room: enrichedRoom }, 'Handover room status retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Seller submits confidential Konami account credentials
 * POST /api/v1/handover/:order_id/submit
 */
const submitAccountInfo = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const { konami_email, konami_password, notes } = req.body;

    const result = await handoverService.submitCredentials({
      orderId,
      sellerId: req.user.id,
      konamiEmail: konami_email,
      konamiPassword: konami_password,
      notes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(
      res,
      { room: result },
      'Account credentials securely encrypted and stored. 48-hour buyer review window opened.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Buyer accesses and decrypts account credentials
 * GET /api/v1/handover/:order_id/info
 */
const getAccountInfo = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);

    const result = await handoverService.getDecryptedCredentials({
      orderId,
      buyerId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, result, 'Account credentials decrypted and retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Buyer confirms receipt -> releases escrow & purges credentials
 * POST /api/v1/handover/:order_id/confirm
 */
const confirmReceipt = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);

    const result = await handoverService.confirmReceipt({
      orderId,
      buyerId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, result, result.message);
  } catch (err) {
    return next(err);
  }
};

/**
 * Buyer reports problem -> opens formal dispute
 * POST /api/v1/handover/:order_id/problem
 */
const reportProblem = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const { dispute_reason_id, description } = req.body;

    const dispute = await disputeService.openDispute({
      orderId,
      buyerId: req.user.id,
      disputeReasonId: Number(dispute_reason_id),
      description,
    });

    return sendSuccess(
      res,
      { dispute },
      'Problem reported. Formal dispute opened and escrow funds have been frozen.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin views handover audit access logs (without seeing plaintext credentials)
 * GET /api/v1/admin/handover/:order_id/logs
 */
const getAdminHandoverLogs = async (req, res, next) => {
  try {
    const orderId = Number(req.params.order_id);
    const logs = await handoverModel.getAccessLogsByOrderId(orderId);

    return sendSuccess(res, { access_logs: logs }, 'Handover access audit logs retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRoomStatus,
  submitAccountInfo,
  getAccountInfo,
  confirmReceipt,
  reportProblem,
  getAdminHandoverLogs,
};
