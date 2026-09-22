const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

/**
 * User Dashboard Routes
 * Base path: /api/v1/dashboard
 */

router.use(requireAuth);

// Buyer Dashboard
router.get('/buyer', dashboardController.getBuyerDashboard);

// Seller Dashboard
router.get('/seller', dashboardController.getSellerDashboard);

module.exports = router;
