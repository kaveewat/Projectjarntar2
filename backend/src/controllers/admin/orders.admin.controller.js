const orderModel = require('../../models/order.model');
const escrowModel = require('../../models/escrow.model');
const escrowService = require('../../services/escrow.service');
const orderLogModel = require('../../models/order-status-log.model');
const escrowLogModel = require('../../models/escrow-status-log.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin & Moderator Order / Escrow Controller
 */

/**
 * List All Orders (Admin)
 * GET /api/v1/admin/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { status, buyer_id, seller_id } = req.query;

    const { orders, total } = await orderModel.findAll({
      buyerId: buyer_id ? Number(buyer_id) : null,
      sellerId: seller_id ? Number(seller_id) : null,
      status: status || 'ALL',
      limit,
      offset,
    });

    return sendPaginated(res, orders, page, limit, total, 'Admin orders retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Order Detail (Admin)
 * GET /api/v1/admin/orders/:id
 */
const getAdminOrderDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await orderModel.findById(id);

    if (!order) {
      throw new AppError(`Order with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const orderLogs = await orderLogModel.getLogsByOrderId(id);
    const escrowLogs = await escrowLogModel.getLogsByOrderId(id);

    return sendSuccess(
      res,
      {
        order,
        order_logs: orderLogs,
        escrow_logs: escrowLogs,
      },
      'Admin order detail retrieved'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Moderator / Admin Approves Payment Slip
 * POST /api/v1/admin/orders/:id/payment/approve
 */
const approvePayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const note = req.body.note || 'Payment approved by moderator';

    await escrowService.holdEscrow({
      orderId: id,
      adminId: req.user.id,
      note,
    });

    const updatedOrder = await orderModel.findById(id);
    const escrow = await escrowModel.findByOrderId(id);

    return sendSuccess(
      res,
      { order: updatedOrder, escrow },
      'Payment verified and approved. Escrow is now HELD, and 72-hour handover window is opened.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Moderator / Admin Rejects Payment Slip
 * POST /api/v1/admin/orders/:id/payment/reject
 */
const rejectPayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;

    await escrowService.rejectPayment({
      orderId: id,
      adminId: req.user.id,
      reason,
    });

    const updatedOrder = await orderModel.findById(id);
    return sendSuccess(
      res,
      { order: updatedOrder },
      'Payment rejected. Order has been CANCELLED and listing returned to ACTIVE state.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin Cancel Order (Override)
 * POST /api/v1/admin/orders/:id/cancel
 */
const cancelOrderAdmin = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reason = req.body.reason || 'Cancelled by administrator override';

    await orderModel.cancelOrder({
      orderId: id,
      cancelledBy: req.user.id,
      reason,
    });

    const updated = await orderModel.findById(id);
    return sendSuccess(res, { order: updated }, 'Order cancelled by administrator');
  } catch (err) {
    return next(err);
  }
};

/**
 * Admin Escrow Overview
 * GET /api/v1/admin/escrow
 */
const getEscrowOverview = async (_req, res, next) => {
  try {
    const overview = await escrowModel.getOverview();
    return sendSuccess(res, overview, 'Escrow overview retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllOrders,
  getAdminOrderDetail,
  approvePayment,
  rejectPayment,
  cancelOrderAdmin,
  getEscrowOverview,
};
