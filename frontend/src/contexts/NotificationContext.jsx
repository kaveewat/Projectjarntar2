import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationsApi from '../services/notifications.api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollTimerRef = useRef(null);

  // 1. Fetch unread count & recent preview items
  const fetchUnreadData = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    try {
      const [countRes, listRes] = await Promise.allSettled([
        notificationsApi.getUnreadCount(),
        notificationsApi.getNotifications({ limit: 5 }),
      ]);

      if (countRes.status === 'fulfilled') {
        const count = countRes.value.data?.data?.unread_count ?? countRes.value.data?.data?.count ?? 0;
        setUnreadCount(Number(count) || 0);
      }

      if (listRes.status === 'fulfilled') {
        const items =
          listRes.value.data?.data?.notifications ||
          listRes.value.data?.data ||
          listRes.value.data?.notifications ||
          [];
        setRecentNotifications(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      // Background polling errors shouldn't crash UI
      console.debug('Notification poll check error:', err.message);
    }
  }, [isAuthenticated]);

  // 2. Setup 30s Polling Loop
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // Initial fetch on mount or auth change
    fetchUnreadData();

    // Poll every 30 seconds (AC Requirement 16.1)
    pollTimerRef.current = setInterval(() => {
      fetchUnreadData();
    }, 30000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAuthenticated, token, fetchUnreadData]);

  // 3. Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // 4. Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    refetchUnreadCount: fetchUnreadData,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
