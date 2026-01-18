import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocialNotifications } from '../hooks/useSocialNotifications';
import { FCMService } from '../services/FCMService';
import { FCMTokenService } from '../services/FCMTokenService';
import { NotificationHandler } from '../services/NotificationHandler';
import { PushPermissionService } from '../services/PushPermissionService';
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
  pushEnabled: boolean;
  showPushDisabledMessage: () => void;
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
 * Uses push notifications for real-time updates instead of polling.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.9, 11.1, 11.2, 11.3, 11.9
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notificationPressHandler, setNotificationPressHandler] = useState<
    ((notification: SocialNotification) => void) | null
  >(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Use the social notifications hook WITHOUT polling
  // Push notifications provide real-time updates instead
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
    // pollInterval removed - push notifications replace polling
  });

  // Initialize push notifications on mount
  useEffect(() => {
    if (!user) {
      return;
    }

    const initializePush = async () => {
      try {
        console.log('🔔 Initializing push notifications...');

        // Initialize FCM
        await FCMService.initialize();

        // Check if push is enabled
        const isEnabled = await PushPermissionService.isEnabled();
        setPushEnabled(isEnabled);

        if (isEnabled) {
          console.log('✅ Push notifications enabled');
        } else {
          console.log('⚠️ Push notifications disabled - using manual refresh only');
        }
      } catch (error) {
        console.error('❌ Error initializing push notifications:', error);
        setPushEnabled(false);
      }
    };

    initializePush();
  }, [user]);

  // Register device token on login
  useEffect(() => {
    if (!user || !pushEnabled) {
      return;
    }

    const registerToken = async () => {
      try {
        console.log('📝 Registering device token for user:', user.id);

        // Generate and store FCM token (returns null on failure, doesn't throw)
        const token = await FCMTokenService.generateAndStoreToken(user.id);

        if (token) {
          // Set up token refresh listener only if token was successfully generated
          FCMTokenService.setupTokenRefreshListener(user.id);
          console.log('✅ Device token registered successfully');
        } else {
          console.warn('⚠️ Device token registration failed - push notifications disabled');
          console.warn('⚠️ User can still use the app normally');
        }
      } catch (error) {
        console.error('❌ Error registering device token:', error);
        console.warn('⚠️ Continuing without push notifications');
      }
    };

    registerToken();

    // Cleanup on unmount or logout
    return () => {
      FCMTokenService.removeTokenRefreshListener();
    };
  }, [user, pushEnabled]);

  // Log notification updates for debugging
  useEffect(() => {
    if (user) {
      console.log('📬 Notifications updated:', {
        count: notifications.length,
        unread: unreadCount,
        userId: user.id,
        pushEnabled,
      });
    }
  }, [notifications, unreadCount, user, pushEnabled]);

  // Register foreground notification handler
  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('🔔 Registering foreground notification handler');

    // Register handler for notifications received while app is in foreground
    FCMService.onForegroundMessage((message) => {
      console.log('📬 Foreground notification received:', message);
      
      // Handle the notification
      NotificationHandler.handleForegroundNotification(message);
      
      // Refetch notifications to update the list
      refetch();
    });

    // Cleanup on unmount
    return () => {
      console.log('🔕 Removing foreground notification handler');
      FCMService.removeForegroundMessageListener();
    };
  }, [user, refetch]);

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

  // Show message about enabling push for real-time updates
  const showPushDisabledMessage = useCallback(() => {
    PushPermissionService.showFallbackNotificationInfo();
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
    pushEnabled,
    showPushDisabledMessage,
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
