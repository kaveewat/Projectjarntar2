const express = require('express');
const router = express.Router();
const playersAdminController = require('../../controllers/admin/players.admin.controller');
const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

/**
 * Admin Player Card Management Routes
 * Base path: /api/v1/admin/players
 */

router.use(requireAuth);
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/', playersAdminController.getAllPlayers);
router.get('/metadata', playersAdminController.getMetadata);
router.get('/:id', playersAdminController.getPlayerDetail);

// Admin-only mutation actions
router.post('/', requireRole('ADMIN'), playersAdminController.createPlayer);
router.patch('/:id', requireRole('ADMIN'), playersAdminController.updatePlayer);
router.patch('/:id/status', requireRole('ADMIN'), playersAdminController.togglePlayerStatus);
router.post('/import', requireRole('ADMIN'), playersAdminController.bulkImportPlayers);

module.exports = router;
