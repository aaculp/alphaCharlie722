/**
 * FCMService
 * 
 * Core Firebase Cloud Messaging service for sending push notifications.
 * Handles FCM initialization, token management, and notification delivery.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { getMessaging, getToken, onTokenRefresh, onMessage, setBackgroundMessageHandler, isDeviceRegisteredForRemoteMessages, registerDeviceForRemoteMessages, FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { DeviceTokenManager } from './DeviceTokenManager';
import { PushNotificationError, PushErrorCategory, ErrorSeverity, ErrorLogger } from './errors/PushNotificationError';
import { trackSuccess, trackError } from './monitoring/ErrorRateTracker';
import { DebugLogger } from './DebugLogger';
import { PayloadValidator } from '../utils/security/PayloadValidator';

/**
 * FCM notification payload structure
 */
export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: Record<string, string>;
  android?: {
    channelId: string;
    priority: 'high' | 'default';
    sound?: string;
    tag?: string; // For notification grouping
    group?: string; // For notification grouping
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
        threadId?: string; // For iOS notification grouping
      };
    };
  };
}

/**
 * Result of sending a notification to a single device
 */
export interface SendResult {
  success: boolean;
  token: string;
  error?: string;
  errorCode?: string;
}

/**
 * Result of sending notifications to multiple devices
 */
export interface BatchSendResult {
  successCount: number;
  failureCount: number;
  results: SendResult[];
}

// Removed FCMErrorType enum - now using PushErrorCategory from PushNotificationError

export class FCMService {
  private static isInitialized = false;
  private static tokenRefreshListener: (() => void) | null = null;
  private static foregroundMessageListener: (() => void) | null = null;

  /**
   * Initialize FCM service
   * Should be called once on app launch
   * 
   * @throws PushNotificationError if initialization fails
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ FCM already initialized');
      return;
    }

    try {
      console.log('🔔 Initializing FCM Service...');
      DebugLogger.logFCMEvent('initialize_start', { platform: Platform.OS });

      // Register for remote messages on iOS
      if (Platform.OS === 'ios') {
        const isRegistered = await isDeviceRegisteredForRemoteMessages(getMessaging());
        
        if (!isRegistered) {
          await registerDeviceForRemoteMessages(getMessaging());
          console.log('✅ iOS device registered for remote messages');
          DebugLogger.logFCMEvent('ios_registered_for_remote_messages');
        }
      }

      this.isInitialized = true;
      console.log('✅ FCM Service initialized');
      DebugLogger.logFCMEvent('initialize_complete', { platform: Platform.OS });
    } catch (error) {
      const pushError = new PushNotificationError(
        'Failed to initialize FCM Service',
        PushErrorCategory.INVALID_CONFIGURATION,
        ErrorSeverity.CRITICAL,
        false,
        { platform: Platform.OS }
      );
      ErrorLogger.logError(pushError);
      DebugLogger.logError('FCM', pushError);
      throw pushError;
    }
  }

  /**
   * Get the current FCM token for this device
   * 
   * @returns FCM token or null if unavailable
   */
  static async getToken(): Promise<string | null> {
    try {
      // Ensure FCM is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      DebugLogger.logFCMEvent('get_token_start');
      const token = await getToken(getMessaging());
      
      if (!token) {
        console.warn('⚠️ No FCM token available');
        DebugLogger.logFCMEvent('get_token_unavailable');
        return null;
      }

      console.log('✅ FCM token retrieved:', token.substring(0, 20) + '...');
      DebugLogger.logFCMEvent('get_token_success', { token: token.substring(0, 20) + '...' });
      return token;
    } catch (error) {
      const pushError = PushNotificationError.fromError(error, {
        operation: 'getToken',
        platform: Platform.OS,
      });
      ErrorLogger.logError(pushError);
      DebugLogger.logError('FCM', pushError);
      return null;
    }
  }

  /**
   * Set up token refresh listener
   * Automatically handles token refresh events
   * 
   * @param callback - Function to call when token refreshes
   */
  static onTokenRefresh(callback: (token: string) => void): void {
    // Remove existing listener if any
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
    }

    // Set up new listener
    this.tokenRefreshListener = onTokenRefresh(getMessaging(), (token) => {
      console.log('🔄 FCM token refreshed:', token.substring(0, 20) + '...');
      DebugLogger.logFCMEvent('token_refresh', { token: token.substring(0, 20) + '...' });
      callback(token);
    });

    console.log('✅ Token refresh listener registered');
    DebugLogger.logFCMEvent('token_refresh_listener_registered');
  }

  /**
   * Remove token refresh listener
   */
  static removeTokenRefreshListener(): void {
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
      console.log('✅ Token refresh listener removed');
    }
  }

  /**
   * Send push notification to a single device
   * Includes retry logic for transient errors
   * 
   * @param token - FCM device token
   * @param payload - Notification payload
   * @param retryCount - Current retry attempt (internal use)
   * @returns Send result with success status
   */
  static async sendToDevice(
    token: string,
    payload: NotificationPayload,
    retryCount: number = 0
  ): Promise<SendResult> {
    try {
      // Validate payload first (Requirement: 15.6)
      const validation = PayloadValidator.validateFCMPayload(payload);
      if (!validation.isValid) {
        console.error('❌ FCM payload validation failed:', validation.errors);
        DebugLogger.logError('FCM', new Error('Payload validation failed'), {
          errors: validation.errors,
        });

        return {
          success: false,
          token,
          error: `Payload validation failed: ${validation.errors.join(', ')}`,
          errorCode: PushErrorCategory.INVALID_CONFIGURATION,
        };
      }

      console.log(`📤 Sending notification to device: ${token.substring(0, 20)}...`);
      DebugLogger.logFCMEvent('send_to_device_start', {
        token: token.substring(0, 20) + '...',
        retryCount,
        payload: {
          title: payload.notification.title,
          body: payload.notification.body,
        },
      });

      // Note: React Native Firebase doesn't provide direct server-side sending
      // This would typically be done via a backend service using Firebase Admin SDK
      // For now, we'll simulate the structure and return success
      // In production, this should call your backend API that uses Firebase Admin SDK
      
      // Simulate sending (in production, call backend API)
      const response = await this.sendViaBackend(token, payload);
      
      if (response.success) {
        // Update last_used_at for successful delivery
        await DeviceTokenManager.updateLastUsed(token);
        
        // Track successful delivery
        trackSuccess();
        
        console.log('✅ Notification sent successfully');
        DebugLogger.logFCMEvent('send_to_device_success', {
          token: token.substring(0, 20) + '...',
        });
        
        return {
          success: true,
          token,
        };
      } else {
        // Handle error with comprehensive error handling
        const pushError = PushNotificationError.fromError(
          response.error || 'Unknown error',
          {
            operation: 'sendToDevice',
            token: token.substring(0, 20) + '...',
            retryCount,
          }
        );
        
        ErrorLogger.logError(pushError);
        DebugLogger.logError('FCM', pushError, {
          token: token.substring(0, 20) + '...',
          retryCount,
        });
        
        // Track error for monitoring
        trackError(pushError, 'sendToDevice');
        
        // Retry logic for transient errors
        if (pushError.isRetryable && retryCount < 2) {
          console.log(`🔄 Retrying notification send (attempt ${retryCount + 1}/2)...`);
          DebugLogger.logFCMEvent('send_to_device_retry', {
            token: token.substring(0, 20) + '...',
            retryCount: retryCount + 1,
          });
          
          // Exponential backoff: 1s, 2s
          const delay = Math.pow(2, retryCount) * 1000;
          await this.sleep(delay);
          
          return this.sendToDevice(token, payload, retryCount + 1);
        }
        
        // Handle invalid token
        if (pushError.category === PushErrorCategory.INVALID_TOKEN || 
            pushError.category === PushErrorCategory.EXPIRED_TOKEN) {
          console.log('⚠️ Invalid/expired token detected, deactivating...');
          DebugLogger.logTokenOperation('deactivate', token, true, {
            reason: 'invalid_or_expired',
          });
          await DeviceTokenManager.deactivateToken(token);
        }
        
        return {
          success: false,
          token,
          error: pushError.message,
          errorCode: pushError.category,
        };
      }
    } catch (error) {
      const pushError = PushNotificationError.fromError(error, {
        operation: 'sendToDevice',
        token: token.substring(0, 20) + '...',
        retryCount,
      });
      
      ErrorLogger.logError(pushError);
      DebugLogger.logError('FCM', pushError, {
        token: token.substring(0, 20) + '...',
        retryCount,
      });
      
      // Track error for monitoring
      trackError(pushError, 'sendToDevice');
      
      // Retry logic
      if (pushError.isRetryable && retryCount < 2) {
        console.log(`🔄 Retrying notification send (attempt ${retryCount + 1}/2)...`);
        DebugLogger.logFCMEvent('send_to_device_retry', {
          token: token.substring(0, 20) + '...',
          retryCount: retryCount + 1,
        });
        
        const delay = Math.pow(2, retryCount) * 1000;
        await this.sleep(delay);
        
        return this.sendToDevice(token, payload, retryCount + 1);
      }
      
      return {
        success: false,
        token,
        error: pushError.message,
        errorCode: pushError.category,
      };
    }
  }

  /**
   * Send push notification to multiple devices
   * Batches requests for efficiency (max 500 per batch as per FCM limits)
   * 
   * Requirements: 14.4, 14.8
   * 
   * @param tokens - Array of FCM device tokens
   * @param payload - Notification payload
   * @returns Batch send result with success/failure counts
   */
  static async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<BatchSendResult> {
    console.log(`📤 Sending notification to ${tokens.length} devices...`);

    // FCM recommends batching up to 500 tokens per request
    const BATCH_SIZE = 500;
    const batches: string[][] = [];

    // Split tokens into batches
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      batches.push(tokens.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Split into ${batches.length} batch(es) of up to ${BATCH_SIZE} tokens`);

    // Process batches in parallel
    const batchResults = await Promise.all(
      batches.map(async (batchTokens, index) => {
        console.log(`📤 Processing batch ${index + 1}/${batches.length} (${batchTokens.length} tokens)...`);
        
        // Send to all devices in this batch in parallel
        const results = await Promise.all(
          batchTokens.map(token => this.sendToDevice(token, payload))
        );
        
        return results;
      })
    );

    // Flatten results from all batches
    const results = batchResults.flat();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Batch send complete: ${successCount} success, ${failureCount} failed`);

    return {
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Register foreground message handler
   * Handles notifications received while app is in foreground
   * 
   * @param handler - Function to call when foreground message received
   */
  static onForegroundMessage(
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ): void {
    // Remove existing listener if any
    if (this.foregroundMessageListener) {
      this.foregroundMessageListener();
      this.foregroundMessageListener = null;
    }

    // Set up new listener
    this.foregroundMessageListener = onMessage(getMessaging(), handler);
    
    console.log('✅ Foreground message listener registered');
  }

  /**
   * Remove foreground message listener
   */
  static removeForegroundMessageListener(): void {
    if (this.foregroundMessageListener) {
      this.foregroundMessageListener();
      this.foregroundMessageListener = null;
      console.log('✅ Foreground message listener removed');
    }
  }

  /**
   * Set background message handler
   * Handles notifications received while app is in background or closed
   * 
   * @param handler - Async function to call when background message received
   */
  static setBackgroundMessageHandler(
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>
  ): void {
    setBackgroundMessageHandler(getMessaging(), handler);
    console.log('✅ Background message handler registered');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Send notification via backend API
   * In production, this calls your backend service that uses Firebase Admin SDK
   * 
   * @param _token - FCM device token (unused in simulation)
   * @param _payload - Notification payload (unused in simulation)
   * @returns Response with success status
   */
  private static async sendViaBackend(
    _token: string,
    _payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Replace with actual backend API call
    // Example:
    // const response = await fetch('https://your-api.com/send-notification', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, payload }),
    // });
    // return response.json();
    
    // For now, simulate success
    // In production, this MUST call your backend API
    console.warn('⚠️ Using simulated backend - implement actual API call in production');
    
    return {
      success: true,
    };
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
