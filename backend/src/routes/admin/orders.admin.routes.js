const express = require('express');
const router = express.Router();

const ordersAdminController = require('../../controllers/admin/orders.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validate, rejectPaymentSchema } = require('../../utils/validators');

/**
 * Admin & Moderator Order Management Routes
 * Base path: /api/v1/admin/orders
 */

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  ordersAdminController.getAllOrders
);

router.get(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  ordersAdminController.getAdminOrderDetail
);

router.post(
  '/:id/payment/approve',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  ordersAdminController.approvePayment
);

router.post(
  '/:id/payment/reject',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validate(rejectPaymentSchema),
  ordersAdminController.rejectPayment
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole('ADMIN'),
  ordersAdminController.cancelOrderAdmin
);

module.exports = router;
