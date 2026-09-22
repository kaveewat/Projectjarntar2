const notificationModel = require('../models/notification.model');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Notifications Controller
 */

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let isRead = null;
    if (req.query.is_read === 'true' || req.query.is_read === '1') isRead = true;
    if (req.query.is_read === 'false' || req.query.is_read === '0') isRead = false;

    const { notifications, total } = await notificationModel.findByUser({
      userId: req.user.id,
      isRead,
      limit,
      offset,
    });

    return sendPaginated(
      res,
      notifications,
      page,
      limit,
      total,
      'Notifications retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationModel.countUnread(req.user.id);
    return sendSuccess(res, { count, unread_count: count }, 'Unread count retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await notificationModel.findById(id, req.user.id);

    if (!existing) {
      throw new AppError(`Notification with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    await notificationModel.markRead(id, req.user.id);
    const updated = await notificationModel.findById(id, req.user.id);

    return sendSuccess(res, { notification: updated }, 'Notification marked as read');
  } catch (err) {
    return next(err);
  }
};

/**
 * Mark all notifications as read for current user
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const updatedCount = await notificationModel.markAllRead(req.user.id);
    return sendSuccess(
      res,
      { updated_count: updatedCount },
      'All notifications marked as read'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a notification
 * DELETE /api/v1/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await notificationModel.findById(id, req.user.id);

    if (!existing) {
      throw new AppError(`Notification with ID ${id} not found`, 404, 'NOT_FOUND');
    }

    await notificationModel.deleteById(id, req.user.id);
    return sendSuccess(res, null, 'Notification deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
