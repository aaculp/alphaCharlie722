import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/api/notifications';
import type {
  SocialNotification,
  PaginationOptions,
} from '../types/social.types';

export interface UseSocialNotificationsOptions {
  autoLoad?: boolean;
  pagination?: PaginationOptions;
  pollInterval?: number; // Auto-refresh interval in milliseconds (0 = disabled)
}

export interface UseSocialNotificationsReturn {
  notifications: SocialNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing social notifications
 * 
 * @param options - Configuration options
 * @returns Notifications data, unread count, loading state, error state, and notification management functions
 * 
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   loading,
 *   markAsRead,
 *   markAllAsRead,
 * } = useSocialNotifications({
 *   pollInterval: 30000, // Poll every 30 seconds
 * });
 * 
 * // Mark a notification as read
 * await markAsRead('notification-123');
 * 
 * // Mark all notifications as read
 * await markAllAsRead();
 * ```
 */
export function useSocialNotifications(
  options: UseSocialNotificationsOptions = {}
): UseSocialNotificationsReturn {
  const { autoLoad = true, pagination, pollInterval = 0 } = options;
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load notifications and unread count
  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load notifications and unread count in parallel
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getSocialNotifications(user.id, pagination),
        NotificationService.getUnreadNotificationCount(user.id),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load notifications');
      setError(loadError);
      console.error('Error loading notifications:', loadError);
    } finally {
      setLoading(false);
    }
  }, [user, pagination]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadNotifications();
    }
  }, [autoLoad, loadNotifications]);

  // Set up polling if pollInterval is provided
  useEffect(() => {
    if (pollInterval > 0 && user?.id) {
      const intervalId = setInterval(() => {
        loadNotifications();
      }, pollInterval);

      return () => clearInterval(intervalId);
    }
  }, [pollInterval, user?.id, loadNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to mark notifications as read');
        return false;
      }

      try {
        await NotificationService.markNotificationAsRead(notificationId);

        // Update notification in list
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, read: true, read_at: new Date().toISOString() }
              : notif
          )
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(prev - 1, 0));

        return true;
      } catch (err) {
        const readError = err instanceof Error ? err : new Error('Failed to mark notification as read');
        setError(readError);
        console.error('Error marking notification as read:', readError);
        return false;
      }
    },
    [user]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn('User must be logged in to mark all notifications as read');
      return false;
    }

    try {
      await NotificationService.markAllNotificationsAsRead(user.id);

      // Update all notifications in list
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
          read_at: notif.read_at || new Date().toISOString(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);

      return true;
    } catch (err) {
      const readAllError = err instanceof Error ? err : new Error('Failed to mark all notifications as read');
      setError(readAllError);
      console.error('Error marking all notifications as read:', readAllError);
      return false;
    }
  }, [user]);

  // Refetch notifications
  const refetch = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
