import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocialNotifications } from '../hooks/useSocialNotifications';
import type { SocialNotification } from '../types/social.types';

interface NotificationContextType {
  notifications: SocialNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refetch: () => Promise<void>;
  handleNotificationPress: (notification: SocialNotification) => void;
  setNotificationPressHandler: (handler: (notification: SocialNotification) => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider
 * 
 * Provides notification state and handlers throughout the app.
 * Manages notification listeners, unread count, and notification tap handling.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.9
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notificationPressHandler, setNotificationPressHandler] = useState<
    ((notification: SocialNotification) => void) | null
  >(null);

  // Use the social notifications hook with polling enabled (30 seconds)
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useSocialNotifications({
    autoLoad: !!user,
    pollInterval: 30000, // Poll every 30 seconds for new notifications
  });

  // Log notification updates for debugging
  useEffect(() => {
    if (user) {
      console.log('📬 Notifications updated:', {
        count: notifications.length,
        unread: unreadCount,
        userId: user.id,
      });
    }
  }, [notifications, unreadCount, user]);

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification: SocialNotification) => {
      console.log('🔔 Notification pressed:', notification.type, notification.id);
      
      // Mark as read when pressed
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Call the registered handler if available
      if (notificationPressHandler) {
        notificationPressHandler(notification);
      }
    },
    [notificationPressHandler, markAsRead]
  );

  // Set the notification press handler (called by navigation)
  const setHandler = useCallback((handler: (notification: SocialNotification) => void) => {
    setNotificationPressHandler(() => handler);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
    handleNotificationPress,
    setNotificationPressHandler: setHandler,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification context
 * @throws Error if used outside NotificationProvider
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
