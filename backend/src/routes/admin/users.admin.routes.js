const express = require('express');
const router = express.Router();
const usersAdminController = require('../../controllers/admin/users.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Users Management Routes
 * Base path: /api/v1/admin/users
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/', usersAdminController.getAllUsers);
router.get('/:id', usersAdminController.getUserDetail);
router.patch('/:id/status', requireRole('ADMIN'), usersAdminController.updateUserStatus);

module.exports = router;
