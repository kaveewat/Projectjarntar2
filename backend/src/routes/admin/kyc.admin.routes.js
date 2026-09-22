const express = require('express');
const router = express.Router();
const kycAdminController = require('../../controllers/admin/kyc.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin KYC Verification Routes
 * Base path: /api/v1/admin/kyc
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/', kycAdminController.getAllKyc);
router.get('/:id', kycAdminController.getKycDetail);
router.post('/:id/approve', requireRole('ADMIN'), kycAdminController.approveKyc);
router.post('/:id/reject', requireRole('ADMIN'), kycAdminController.rejectKyc);

module.exports = router;
