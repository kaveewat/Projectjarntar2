import api from './api';

const notificationsApi = {
  // 1. Get paginated notifications
  getNotifications: (params = {}) => api.get('/notifications', { params }),

  // 2. Get unread notification count
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // 3. Mark a notification as read
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),

  // 4. Mark all notifications as read
  markAllAsRead: () => api.patch('/notifications/read-all'),

  // 5. Delete notification
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationsApi;
