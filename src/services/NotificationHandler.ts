/**
 * NotificationHandler
 * 
 * Handles incoming push notifications and manages navigation.
 * Processes notifications in different app states (foreground, background, closed).
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
 */

import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { NotificationService } from './api/notifications';
import { DebugLogger } from './DebugLogger';
import type { NotificationType } from '../types/social.types';

/**
 * Navigation handler function type
 * Called to navigate to appropriate screen based on notification
 */
export type NavigationHandler = (
  screen: string,
  params?: Record<string, any>
) => void;

/**
 * Parsed notification data from FCM payload
 */
export interface ParsedNotificationData {
  type: NotificationType;
  actorId?: string;
  referenceId?: string;
  navigationTarget: string;
  navigationParams?: Record<string, any>;
}

export class NotificationHandler {
  private static navigationHandler: NavigationHandler | null = null;

  /**
   * Set the navigation handler
   * Should be called once during app initialization with navigation reference
   * 
   * @param handler - Function to handle navigation
   */
  static setNavigationHandler(handler: NavigationHandler): void {
    this.navigationHandler = handler;
    console.log('✅ Navigation handler registered');
  }

  /**
   * Handle notification tap
   * Called when user taps on a notification in the system tray
   * 
   * Requirements: 7.2, 7.3, 7.7, 7.8
   * 
   * @param notification - FCM remote message
   */
  static async handleNotificationTap(
    notification: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    try {
      console.log('🔔 Handling notification tap:', notification.data?.type);
      DebugLogger.logFCMEvent('notification_tap', {
        type: notification.data?.type,
        messageId: notification.messageId,
      });

      // Parse notification data
      const data = this.parseNotificationData(notification);
      
      if (!data) {
        console.warn('⚠️ Invalid notification data, cannot navigate');
        DebugLogger.logError('NOTIFICATION_HANDLER', 'Invalid notification data');
        return;
      }

      // Mark in-app notification as read
      if (data.referenceId) {
        await this.markNotificationAsRead(data.referenceId);
      }

      // Track notification open event
      this.trackNotificationOpen(data.type);

      // Navigate to appropriate screen
      this.navigateFromNotification(data.type, data.navigationParams || {});
    } catch (error) {
      console.error('❌ Error handling notification tap:', error);
      DebugLogger.logError('NOTIFICATION_HANDLER', error as Error);
    }
  }

  /**
   * Handle foreground notification
   * Called when notification is received while app is in foreground
   * 
   * Requirements: 7.4
   * 
   * @param notification - FCM remote message
   */
  static handleForegroundNotification(
    notification: FirebaseMessagingTypes.RemoteMessage
  ): void {
    try {
      console.log('📬 Foreground notification received:', notification.data?.type);

      // Parse notification data
      const data = this.parseNotificationData(notification);
      
      if (!data) {
        console.warn('⚠️ Invalid notification data');
        return;
      }

      // Display in-app notification banner
      // This will be handled by the NotificationContext which listens for new notifications
      console.log('📢 Displaying in-app notification banner');

      // Update notification center badge
      // This is handled automatically by the NotificationContext

      // Play notification sound
      // This is handled automatically by FCM when notification is received
      
      console.log('✅ Foreground notification handled');
    } catch (error) {
      console.error('❌ Error handling foreground notification:', error);
    }
  }

  /**
   * Handle background notification
   * Called when notification is received while app is in background or closed
   * 
   * Requirements: 7.5, 7.6
   * 
   * @param notification - FCM remote message
   */
  static async handleBackgroundNotification(
    notification: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    try {
      console.log('📭 Background notification received:', notification.data?.type);

      // Parse notification data
      const data = this.parseNotificationData(notification);
      
      if (!data) {
        console.warn('⚠️ Invalid notification data');
        return;
      }

      // Update notification center badge
      // This is handled automatically by the NotificationContext when app opens

      // Track notification receipt
      this.trackNotificationReceipt(data.type);

      console.log('✅ Background notification handled');
    } catch (error) {
      console.error('❌ Error handling background notification:', error);
    }
  }

  /**
   * Navigate to appropriate screen based on notification type
   * 
   * Requirements: 7.2, 7.3
   * 
   * @param type - Notification type
   * @param params - Navigation parameters
   */
  static navigateFromNotification(
    type: NotificationType,
    params: Record<string, any>
  ): void {
    if (!this.navigationHandler) {
      console.warn('⚠️ Navigation handler not set, cannot navigate');
      DebugLogger.logError('NAVIGATION', 'Navigation handler not set');
      return;
    }

    console.log('🧭 Navigating from notification:', type, params);
    DebugLogger.logNavigationEvent(type, 'determining_target', params);

    switch (type) {
      case 'friend_request':
        // Navigate to friend requests screen
        DebugLogger.logNavigationEvent(type, 'FriendRequests');
        this.navigationHandler('FriendRequests');
        break;

      case 'friend_accepted':
        // Navigate to user profile
        if (params.actorId) {
          DebugLogger.logNavigationEvent(type, 'Profile', { userId: params.actorId });
          this.navigationHandler('Profile', { userId: params.actorId });
        } else {
          // Fallback to settings/friends list
          DebugLogger.logNavigationEvent(type, 'Settings', { fallback: true });
          this.navigationHandler('Settings');
        }
        break;

      case 'venue_share':
        // Navigate to venue detail screen
        if (params.venueId) {
          DebugLogger.logNavigationEvent(type, 'VenueDetail', {
            venueId: params.venueId,
            venueName: params.venueName,
          });
          this.navigationHandler('VenueDetail', {
            venueId: params.venueId,
            venueName: params.venueName || 'Venue',
          });
        }
        break;

      case 'collection_follow':
      case 'collection_update':
        // Navigate to collection detail screen
        if (params.collectionId) {
          DebugLogger.logNavigationEvent(type, 'CollectionDetail', {
            collectionId: params.collectionId,
          });
          this.navigationHandler('CollectionDetail', {
            collectionId: params.collectionId,
          });
        }
        break;

      case 'activity_like':
      case 'activity_comment':
        // Navigate to activity detail screen
        if (params.activityId) {
          DebugLogger.logNavigationEvent(type, 'ActivityDetail', {
            activityId: params.activityId,
          });
          this.navigationHandler('ActivityDetail', {
            activityId: params.activityId,
          });
        }
        break;

      case 'group_outing_invite':
      case 'group_outing_response':
      case 'group_outing_reminder':
        // Navigate to group outing detail screen
        if (params.outingId) {
          DebugLogger.logNavigationEvent(type, 'GroupOutingDetail', {
            outingId: params.outingId,
          });
          this.navigationHandler('GroupOutingDetail', {
            outingId: params.outingId,
          });
        }
        break;

      case 'friend_checkin_nearby':
        // Navigate to map view or friend's profile
        if (params.actorId) {
          DebugLogger.logNavigationEvent(type, 'Profile', { userId: params.actorId });
          this.navigationHandler('Profile', { userId: params.actorId });
        }
        break;

      case 'flash_offer':
        // Navigate to flash offer detail screen
        if (params.offerId) {
          DebugLogger.logNavigationEvent(type, 'FlashOfferDetail', {
            offerId: params.offerId,
            venueName: params.venueName,
          });
          this.navigationHandler('FlashOfferDetail', {
            offerId: params.offerId,
            venueName: params.venueName || 'Venue',
          });
        }
        break;

      case 'venue_response':
        // Navigate to venue detail screen and scroll to reviews
        if (params.venueId) {
          DebugLogger.logNavigationEvent(type, 'VenueDetail', {
            venueId: params.venueId,
            scrollToReviews: params.scrollToReviews,
          });
          this.navigationHandler('VenueDetail', {
            venueId: params.venueId,
            scrollToReviews: params.scrollToReviews || true,
          });
        }
        break;

      default:
        console.warn('⚠️ Unknown notification type:', type);
        DebugLogger.logError('NAVIGATION', `Unknown notification type: ${type}`);
        // Fallback to home screen
        this.navigationHandler('Home');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Parse notification data from FCM remote message
   * 
   * @param notification - FCM remote message
   * @returns Parsed notification data or null if invalid
   */
  private static parseNotificationData(
    notification: FirebaseMessagingTypes.RemoteMessage
  ): ParsedNotificationData | null {
    try {
      const data = notification.data;
      
      if (!data || !data.type || !data.navigationTarget) {
        console.warn('⚠️ Missing required notification data fields');
        return null;
      }

      // Parse navigation params if present
      let navigationParams: Record<string, any> | undefined;
      if (data.navigationParams) {
        try {
          const paramsValue = typeof data.navigationParams === 'string' 
            ? data.navigationParams 
            : JSON.stringify(data.navigationParams);
          navigationParams = JSON.parse(paramsValue);
        } catch (error) {
          console.warn('⚠️ Failed to parse navigation params:', error);
        }
      }

      // Ensure string values for required fields
      const actorId = data.actorId ? String(data.actorId) : undefined;
      const referenceId = data.referenceId ? String(data.referenceId) : undefined;
      const navigationTarget = String(data.navigationTarget);

      return {
        type: data.type as NotificationType,
        actorId,
        referenceId,
        navigationTarget,
        navigationParams,
      };
    } catch (error) {
      console.error('❌ Error parsing notification data:', error);
      return null;
    }
  }

  /**
   * Mark in-app notification as read
   * 
   * @param notificationId - ID of the notification to mark as read
   */
  private static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      
      await NotificationService.markAsRead(notificationId);
      
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Track notification open event
   * 
   * @param type - Notification type
   */
  private static trackNotificationOpen(type: NotificationType): void {
    try {
      console.log('📊 Tracking notification open:', type);
      
      // TODO: Implement analytics tracking
      // Example: Analytics.track('notification_opened', { type });
      
    } catch (error) {
      console.error('❌ Error tracking notification open:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Track notification receipt
   * 
   * @param type - Notification type
   */
  private static trackNotificationReceipt(type: NotificationType): void {
    try {
      console.log('📊 Tracking notification receipt:', type);
      
      // TODO: Implement analytics tracking
      // Example: Analytics.track('notification_received', { type });
      
    } catch (error) {
      console.error('❌ Error tracking notification receipt:', error);
      // Don't throw - this is not critical
    }
  }
}
