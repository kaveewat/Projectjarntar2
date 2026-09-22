const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { requireAuth } = require('../middleware/auth');

/**
 * Notifications API Routes
 * Base path: /api/v1/notifications
 */

router.use(requireAuth);

// List notifications
router.get('/', notificationsController.getNotifications);

// Unread count
router.get('/unread-count', notificationsController.getUnreadCount);

// Mark all as read
router.patch('/read-all', notificationsController.markAllAsRead);

// Mark single notification as read
router.patch('/:id/read', notificationsController.markAsRead);

// Delete notification
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
