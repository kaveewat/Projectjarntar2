const express = require('express');
const router = express.Router();
const auditAdminController = require('../../controllers/admin/audit.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Audit & Security Logs Routes
 * Base path: /api/v1/admin
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/audit-logs', requireRole('ADMIN'), auditAdminController.getAuditLogs);
router.get('/audit-logs/:id', requireRole('ADMIN'), auditAdminController.getAuditLogDetail);
router.get('/handover-access-logs', requireRole('ADMIN'), auditAdminController.getHandoverAccessLogs);
router.get('/order-status-logs', auditAdminController.getOrderStatusLogs);
router.get('/escrow-status-logs', auditAdminController.getEscrowStatusLogs);

module.exports = router;
