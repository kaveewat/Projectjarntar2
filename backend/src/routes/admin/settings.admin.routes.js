const express = require('express');
const router = express.Router();
const settingsAdminController = require('../../controllers/admin/settings.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Platform Settings Routes
 * Base path: /api/v1/admin/platform-settings
 */

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', settingsAdminController.getPlatformSettings);
router.patch('/:key', settingsAdminController.updatePlatformSetting);

module.exports = router;
