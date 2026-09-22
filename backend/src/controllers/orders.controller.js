const orderModel = require('../models/order.model');
const paymentModel = require('../models/payment.model');
const orderLogModel = require('../models/order-status-log.model');
const notificationService = require('../services/notification.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Buyer & User Order Management Controller
 */

/**
 * Create Order (Buy Listing)
 * POST /api/v1/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const { listing_id } = req.body;
    const buyerId = req.user.id;

    const orderId = await orderModel.createOrder({
      listingId: Number(listing_id),
      buyerId,
    });

    const order = await orderModel.findById(orderId);
    await notificationService.notifyOrderCreated(order);

    return sendCreated(
      res,
      { order },
      'Order created successfully. Please submit payment within 2 hours to secure this listing.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get My Orders (as Buyer or Seller)
 * GET /api/v1/orders/me
 */
const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const roleQuery = (req.query.as || '').toLowerCase();
    const status = req.query.status || 'ALL';

    let buyerId = null;
    let sellerId = null;

    if (roleQuery === 'buyer') {
      buyerId = req.user.id;
    } else if (roleQuery === 'seller') {
      sellerId = req.user.id;
    } else {
      buyerId = req.user.id;
      sellerId = req.user.id;
    }

    const { orders, total } = await orderModel.findAll({
      buyerId,
      sellerId,
      status,
      limit,
      offset,
    });

    return sendPaginated(res, orders, page, limit, total, 'User orders retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Order Detail
 * GET /api/v1/orders/:id
 */
const getOrderDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await orderModel.findById(id);

    if (!order) {
      throw new AppError(`Order with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    // Check permission: Buyer, Seller, or Admin/Moderator
    const isParticipant = order.buyer_id === req.user.id || order.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to view this order', 403, 'FORBIDDEN');
    }

    const statusLogs = await orderLogModel.getLogsByOrderId(id);

    return sendSuccess(res, { order, status_logs: statusLogs }, 'Order details retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Cancel Order
 * POST /api/v1/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await orderModel.findById(id);

    if (!order) {
      throw new AppError(`Order with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    // Only buyer or Admin can cancel
    if (order.buyer_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('You do not have permission to cancel this order', 403, 'FORBIDDEN');
    }

    const reason = req.body.reason || 'Cancelled by buyer';
    await orderModel.cancelOrder({
      orderId: id,
      cancelledBy: req.user.id,
      reason,
    });

    const updated = await orderModel.findById(id);
    return sendSuccess(res, { order: updated }, 'Order cancelled successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Submit Payment Proof
 * POST /api/v1/orders/:id/payment
 */
const submitPayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await orderModel.findById(id);

    if (!order) {
      throw new AppError(`Order with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    // Only buyer or Admin can submit payment
    if (order.buyer_id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('You do not have permission to submit payment for this order', 403, 'FORBIDDEN');
    }

    // Order must be in CREATED or PENDING_PAYMENT
    const allowed = ['CREATED', 'PENDING_PAYMENT'];
    if (!allowed.includes(order.status)) {
      throw new AppError(
        `Cannot submit payment: Current status is '${order.status}'. Payment can only be submitted for CREATED or PENDING_PAYMENT orders.`,
        422,
        'ORDER_WRONG_STATUS'
      );
    }

    let proofUrl = req.body.payment_proof_url;
    if (req.file) {
      proofUrl = `/uploads/${req.file.filename}`;
    }

    if (!proofUrl) {
      throw new AppError('Payment proof (file upload or payment_proof_url) is required', 400, 'VALIDATION_ERROR');
    }

    const paymentMethod = req.body.payment_method || 'PROMPTPAY';
    const bankRef = req.body.bank_reference || null;

    // Create payment record
    const paymentId = await paymentModel.createPayment({
      orderId: id,
      amount: order.amount,
      paymentMethod,
      paymentProofUrl: proofUrl,
      bankReference: bankRef,
    });

    // Update order status to PAYMENT_SUBMITTED
    await orderModel.updateStatus({
      orderId: id,
      newStatus: 'PAYMENT_SUBMITTED',
      changedBy: req.user.id,
      note: `Payment slip submitted via ${paymentMethod}`,
    });

    const payment = await paymentModel.findById(paymentId);
    const updatedOrder = await orderModel.findById(id);
    await notificationService.notifyPaymentSubmitted(updatedOrder);

    return sendSuccess(
      res,
      { payment, order: updatedOrder },
      'Payment proof submitted successfully. Waiting for moderator verification.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Payment Status
 * GET /api/v1/orders/:id/payment
 */
const getPayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await orderModel.findById(id);

    if (!order) {
      throw new AppError(`Order with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    const isParticipant = order.buyer_id === req.user.id || order.seller_id === req.user.id;
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';

    if (!isParticipant && !isStaff) {
      throw new AppError('You do not have permission to view payment for this order', 403, 'FORBIDDEN');
    }

    const payment = await paymentModel.findByOrderId(id);
    return sendSuccess(res, { payment }, 'Payment status retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  submitPayment,
  getPayment,
};
