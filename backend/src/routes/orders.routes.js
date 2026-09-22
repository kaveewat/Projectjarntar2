const express = require('express');
const router = express.Router();

const ordersController = require('../controllers/orders.controller');
const { requireAuth } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');
const {
  validate,
  createOrderSchema,
  cancelOrderSchema,
} = require('../utils/validators');

/**
 * Buyer & User Order Routes
 * Base path: /api/v1/orders
 */

// 1. Create order (Buy listing)
router.post(
  '/',
  requireAuth,
  validate(createOrderSchema),
  ordersController.createOrder
);

// 2. My orders (buyer or seller)
router.get(
  '/me',
  requireAuth,
  ordersController.getMyOrders
);

// 3. Order detail
router.get(
  '/:id',
  requireAuth,
  ordersController.getOrderDetail
);

// 4. Cancel order
router.post(
  '/:id/cancel',
  requireAuth,
  validate(cancelOrderSchema),
  ordersController.cancelOrder
);

// 5. Submit payment proof
router.post(
  '/:id/payment',
  requireAuth,
  uploadSingleImage('payment_proof'),
  ordersController.submitPayment
);

// 6. View payment details
router.get(
  '/:id/payment',
  requireAuth,
  ordersController.getPayment
);

module.exports = router;
