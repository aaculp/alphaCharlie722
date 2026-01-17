/**
 * PushNotificationService
 * 
 * High-level service for sending push notifications for social events.
 * Handles user preference checking, device token retrieval, and notification delivery.
 * 
 * Requirements: 6.1, 6.2, 6.6, 6.7, 6.8, 6.9
 */

import { FCMService, NotificationPayload } from './FCMService';
import { DeviceTokenManager, DeviceToken } from './DeviceTokenManager';
import { NotificationService } from './api/notifications';
import { PushNotificationError, ErrorLogger } from './errors/PushNotificationError';
import { DebugLogger } from './DebugLogger';
import { trackDelivery } from './monitoring/PerformanceMonitor';
import { checkRateLimit, recordRequest } from './monitoring/RateLimiter';
import { ComplianceService } from './compliance/ComplianceService';
import { PayloadValidator } from '../utils/security/PayloadValidator';
import type { NotificationType } from '../types/social.types';

/**
 * Social notification payload for push notifications
 */
export interface SocialNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    actorId?: string;
    referenceId?: string;
    navigationTarget: string;
    navigationParams?: Record<string, any>;
  };
  imageUrl?: string;
}

/**
 * Result of sending a push notification
 */
export interface PushResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: PushError[];
}

/**
 * Push notification error details
 */
export interface PushError {
  token: string;
  error: string;
  errorCode?: string;
}

/**
 * Mapping of notification types to preference keys
 */
const NOTIFICATION_TYPE_TO_PREFERENCE: Record<NotificationType, keyof import('../types/social.types').NotificationPreferences> = {
  friend_request: 'friend_requests',
  friend_accepted: 'friend_accepted',
  follow_request: 'follow_requests',
  new_follower: 'new_followers',
  venue_share: 'venue_shares',
  group_outing_invite: 'group_outing_invites',
  group_outing_response: 'group_outing_invites', // Use same preference
  group_outing_reminder: 'group_outing_reminders',
  collection_follow: 'collection_follows',
  collection_update: 'collection_updates',
  activity_like: 'activity_likes',
  activity_comment: 'activity_comments',
  friend_checkin_nearby: 'friend_checkins_nearby',
  flash_offer: 'friend_requests', // Use friend_requests as default for now
};

export class PushNotificationService {
  /**
   * Send push notification for a social event
   * Checks user preferences and sends to all active devices
   * Tracks delivery performance metrics and enforces rate limits
   * 
   * @param userId - ID of the user to send notification to
   * @param notificationType - Type of social notification
   * @param payload - Notification payload with title, body, and data
   * @returns Push result with success/failure counts
   */
  static async sendSocialNotification(
    userId: string,
    notificationType: NotificationType,
    payload: SocialNotificationPayload
  ): Promise<PushResult> {
    const startTime = Date.now();
    const auditLogId = `${userId}-${notificationType}-${Date.now()}`;
    
    try {
      console.log(`📤 Sending ${notificationType} notification to user:`, userId);
      DebugLogger.logNotificationSend(userId, notificationType, true, {
        title: payload.title,
        body: payload.body,
      });

      // Validate payload first (Requirement: 15.6)
      const validation = PayloadValidator.validateSocialPayload(payload);
      if (!validation.isValid) {
        console.error('❌ Payload validation failed:', validation.errors);
        DebugLogger.logNotificationSend(userId, notificationType, false, {
          reason: 'payload_validation_failed',
          errors: validation.errors,
        });

        return {
          success: false,
          sentCount: 0,
          failedCount: 0,
          errors: validation.errors.map(error => ({
            token: 'validation',
            error,
          })),
        };
      }

      // Check user preferences first
      const shouldSend = await this.checkUserPreferences(userId, notificationType);

      // Perform compliance check (Requirements: 15.1, 15.2, 15.3, 15.4, 15.7)
      const complianceCheck = ComplianceService.performComplianceCheck(
        userId,
        notificationType,
        payload.title,
        payload.body,
        payload.data,
        shouldSend
      );

      if (!complianceCheck.allowed) {
        console.warn(`⚠️ Compliance check failed: ${complianceCheck.reason}`);
        DebugLogger.logNotificationSend(userId, notificationType, false, {
          reason: 'compliance_check_failed',
          violations: complianceCheck.violations,
        });

        // Log audit entry for compliance (Requirement: 15.8)
        ComplianceService.logNotificationAudit({
          id: auditLogId,
          timestamp: new Date(),
          userId,
          notificationType,
          title: payload.title,
          body: payload.body,
          recipientCount: 0,
          success: false,
          deliveredCount: 0,
          failedCount: 0,
          metadata: {
            reason: complianceCheck.reason,
            violations: complianceCheck.violations,
          },
        });

        return {
          success: false,
          sentCount: 0,
          failedCount: 0,
          errors: [{
            token: 'compliance_check',
            error: complianceCheck.reason || 'Compliance check failed',
          }],
        };
      }

      // Check rate limit (Requirement: 15.7)
      const rateLimitResult = checkRateLimit(userId);
      if (!rateLimitResult.allowed) {
        console.warn(`⚠️ Rate limit exceeded for user: ${rateLimitResult.reason}`);
        DebugLogger.logNotificationSend(userId, notificationType, false, {
          reason: 'rate_limit_exceeded',
          retryAfterMs: rateLimitResult.retryAfterMs,
        });

        // Log audit entry (Requirement: 15.8)
        ComplianceService.logNotificationAudit({
          id: auditLogId,
          timestamp: new Date(),
          userId,
          notificationType,
          title: payload.title,
          body: payload.body,
          recipientCount: 0,
          success: false,
          deliveredCount: 0,
          failedCount: 0,
          metadata: {
            reason: 'rate_limit_exceeded',
            retryAfterMs: rateLimitResult.retryAfterMs,
          },
        });

        return {
          success: false,
          sentCount: 0,
          failedCount: 0,
          errors: [{
            token: 'rate_limited',
            error: rateLimitResult.reason || 'Rate limit exceeded',
          }],
        };
      }
      
      if (!shouldSend) {
        console.log(`⚠️ User has disabled ${notificationType} notifications`);
        DebugLogger.logNotificationSend(userId, notificationType, false, {
          reason: 'user_preference_disabled',
        });

        // Log audit entry (Requirement: 15.8)
        ComplianceService.logNotificationAudit({
          id: auditLogId,
          timestamp: new Date(),
          userId,
          notificationType,
          title: payload.title,
          body: payload.body,
          recipientCount: 0,
          success: true, // Success because we respected user preference
          deliveredCount: 0,
          failedCount: 0,
          metadata: {
            reason: 'user_preference_disabled',
          },
        });

        return {
          success: true,
          sentCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      // Get user's device tokens
      const tokens = await this.getUserDeviceTokens(userId);
      
      if (tokens.length === 0) {
        console.log('⚠️ No active device tokens found for user');
        DebugLogger.logNotificationSend(userId, notificationType, false, {
          reason: 'no_device_tokens',
        });

        // Log audit entry (Requirement: 15.8)
        ComplianceService.logNotificationAudit({
          id: auditLogId,
          timestamp: new Date(),
          userId,
          notificationType,
          title: payload.title,
          body: payload.body,
          recipientCount: 0,
          success: true, // Success because no tokens available
          deliveredCount: 0,
          failedCount: 0,
          metadata: {
            reason: 'no_device_tokens',
          },
        });

        return {
          success: true,
          sentCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      // Record request for rate limiting
      recordRequest(userId);

      // Build FCM payload
      const fcmPayload = this.buildFCMPayload(payload);

      // Send to all devices
      const result = await FCMService.sendToMultipleDevices(
        tokens.map(t => t.token),
        fcmPayload
      );

      // Calculate delivery latency
      const latencyMs = Date.now() - startTime;

      // Track performance metrics
      trackDelivery(
        result.successCount > 0,
        latencyMs,
        userId,
        notificationType
      );

      // Collect errors with comprehensive error handling
      const errors: PushError[] = result.results
        .filter(r => !r.success)
        .map(r => ({
          token: r.token,
          error: r.error || 'Unknown error',
          errorCode: r.errorCode,
        }));

      // Log errors with context
      if (errors.length > 0) {
        errors.forEach(err => {
          ErrorLogger.logErrorWithContext(err.error, {
            operation: 'sendSocialNotification',
            userId,
            notificationType,
            token: err.token.substring(0, 20) + '...',
            errorCode: err.errorCode,
          });
        });
      }

      console.log(`✅ Push notification sent: ${result.successCount} success, ${result.failureCount} failed (${latencyMs}ms)`);
      DebugLogger.logNotificationSend(userId, notificationType, result.successCount > 0, {
        sentCount: result.successCount,
        failedCount: result.failureCount,
        errors: errors.length,
        latencyMs,
      });

      // Log audit entry for compliance (Requirement: 15.8)
      ComplianceService.logNotificationAudit({
        id: auditLogId,
        timestamp: new Date(),
        userId,
        notificationType,
        title: payload.title,
        body: payload.body,
        recipientCount: tokens.length,
        success: result.successCount > 0 || result.failureCount === 0,
        deliveredCount: result.successCount,
        failedCount: result.failureCount,
        metadata: {
          latencyMs,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      return {
        success: result.successCount > 0 || result.failureCount === 0,
        sentCount: result.successCount,
        failedCount: result.failureCount,
        errors,
      };
    } catch (error) {
      // Calculate delivery latency even on error
      const latencyMs = Date.now() - startTime;

      // Track failed delivery
      trackDelivery(false, latencyMs, userId, notificationType);

      // Handle delivery failures gracefully with comprehensive error handling
      const pushError = PushNotificationError.fromError(error, {
        operation: 'sendSocialNotification',
        userId,
        notificationType,
      });
      
      ErrorLogger.logError(pushError);
      DebugLogger.logError('NOTIFICATION_SEND', pushError);

      // Log audit entry for compliance (Requirement: 15.8)
      ComplianceService.logNotificationAudit({
        id: auditLogId,
        timestamp: new Date(),
        userId,
        notificationType,
        title: payload.title,
        body: payload.body,
        recipientCount: 0,
        success: false,
        deliveredCount: 0,
        failedCount: 0,
        metadata: {
          error: pushError.message,
          latencyMs,
        },
      });
      
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        errors: [{
          token: 'unknown',
          error: pushError.message,
        }],
      };
    }
  }

  /**
   * Register a device token for push notifications
   * 
   * @param userId - User ID to associate with the token
   * @param token - FCM device token
   * @param platform - Device platform (ios or android)
   * @throws Error if registration fails
   */
  static async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    try {
      console.log(`📝 Registering device token for user: ${userId}`);
      
      await DeviceTokenManager.storeToken(userId, token, platform);
      
      console.log('✅ Device token registered successfully');
    } catch (error) {
      console.error('❌ Error registering device token:', error);
      throw new Error('Failed to register device token');
    }
  }

  /**
   * Remove a device token
   * 
   * @param token - FCM device token to remove
   * @throws Error if removal fails
   */
  static async removeDeviceToken(token: string): Promise<void> {
    try {
      console.log('🗑️ Removing device token');
      
      await DeviceTokenManager.removeToken(token);
      
      console.log('✅ Device token removed successfully');
    } catch (error) {
      console.error('❌ Error removing device token:', error);
      throw new Error('Failed to remove device token');
    }
  }

  /**
   * Get all active device tokens for a user
   * 
   * @param userId - User ID to get tokens for
   * @returns Array of active device tokens
   */
  static async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    try {
      const tokens = await DeviceTokenManager.getUserTokens(userId);
      
      console.log(`📱 Found ${tokens.length} active device(s) for user`);
      
      return tokens;
    } catch (error) {
      console.error('❌ Error getting user device tokens:', error);
      // Return empty array on error - don't throw
      return [];
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Check if user has enabled push notifications for this type
   * 
   * @param userId - User ID to check preferences for
   * @param notificationType - Type of notification
   * @returns True if user has enabled this notification type
   */
  private static async checkUserPreferences(
    userId: string,
    notificationType: NotificationType
  ): Promise<boolean> {
    try {
      // Get user's notification preferences
      const preferences = await NotificationService.getNotificationPreferences(userId);
      
      // Get the preference key for this notification type
      const preferenceKey = NOTIFICATION_TYPE_TO_PREFERENCE[notificationType];
      
      if (!preferenceKey) {
        console.warn(`⚠️ Unknown notification type: ${notificationType}`);
        return true; // Default to sending if unknown type
      }
      
      // Check if user has enabled this notification type
      const isEnabled = preferences[preferenceKey];
      
      console.log(`📋 User preference for ${notificationType}: ${isEnabled ? 'enabled' : 'disabled'}`);
      
      return Boolean(isEnabled);
    } catch (error) {
      console.error('❌ Error checking user preferences:', error);
      // Default to sending on error - better to send than miss notification
      return true;
    }
  }

  /**
   * Build FCM payload from social notification payload
   * Adds platform-specific configuration including avatar and grouping
   * 
   * Requirements: 7.9, 7.10
   * 
   * @param payload - Social notification payload
   * @returns FCM notification payload
   */
  private static buildFCMPayload(payload: SocialNotificationPayload): NotificationPayload {
    // Convert data object to string values (FCM requirement)
    const dataStrings: Record<string, string> = {
      type: payload.data.type,
      navigationTarget: payload.data.navigationTarget,
    };

    if (payload.data.actorId) {
      dataStrings.actorId = payload.data.actorId;
    }

    if (payload.data.referenceId) {
      dataStrings.referenceId = payload.data.referenceId;
    }

    if (payload.data.navigationParams) {
      dataStrings.navigationParams = JSON.stringify(payload.data.navigationParams);
    }

    // Determine notification group based on type
    const notificationGroup = this.getNotificationGroup(payload.data.type);

    // Build payload with platform-specific configuration
    return {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl, // User avatar when available
      },
      data: dataStrings,
      android: {
        channelId: 'social_notifications',
        priority: 'high',
        sound: 'default',
        // Add grouping for Android
        tag: notificationGroup, // Group notifications by type
        group: notificationGroup,
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            // Add thread identifier for iOS grouping
            threadId: notificationGroup,
          },
        },
      },
    };
  }

  /**
   * Get notification group identifier based on notification type
   * Used for grouping multiple notifications of the same type
   * 
   * Requirements: 7.10
   * 
   * @param type - Notification type
   * @returns Group identifier
   */
  private static getNotificationGroup(type: NotificationType): string {
    // Group notifications by category
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return 'friends';
      
      case 'venue_share':
        return 'venue_shares';
      
      case 'collection_follow':
      case 'collection_update':
        return 'collections';
      
      case 'activity_like':
      case 'activity_comment':
        return 'activity';
      
      case 'group_outing_invite':
      case 'group_outing_response':
      case 'group_outing_reminder':
        return 'group_outings';
      
      case 'friend_checkin_nearby':
        return 'checkins';
      
      default:
        return 'social';
    }
  }
}
