/**
 * FCMTokenService
 * 
 * Handles FCM token generation, storage, and refresh events.
 * Integrates with DeviceTokenManager to persist tokens to the database.
 * 
 * Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 10.6
 */

import { getMessaging, requestPermission, getToken, onTokenRefresh, deleteToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { DeviceTokenManager } from './DeviceTokenManager';

export class FCMTokenService {
  private static tokenRefreshListener: (() => void) | null = null;

  /**
   * Initialize FCM and request permission
   * Should be called on app launch
   * 
   * @returns Promise that resolves when initialization is complete
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing FCM...');
      
      // Request permission (iOS requires this, Android 13+ also requires it)
      const authStatus = await requestPermission(getMessaging());
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('⚠️ Push notification permission not granted');
        return;
      }

      console.log('✅ Push notification permission granted');
    } catch (error) {
      console.error('❌ Error initializing FCM:', error);
      throw new Error('Failed to initialize FCM');
    }
  }

  /**
   * Generate and store FCM token for the current user
   * 
   * @param userId - User ID to associate with the token
   * @returns The generated FCM token or null if generation fails
   * @throws Error only for critical failures that should block the flow
   */
  static async generateAndStoreToken(userId: string): Promise<string | null> {
    try {
      console.log('🔑 Generating FCM token for user:', userId);
      
      // Validate userId
      if (!userId || userId.trim() === '') {
        console.error('❌ Invalid userId provided to generateAndStoreToken');
        return null;
      }

      // Get FCM token with timeout (10 seconds)
      const tokenPromise = getToken(getMessaging());
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('⚠️ FCM token generation timed out after 10 seconds');
          resolve(null);
        }, 10000);
      });

      const token = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (!token) {
        console.warn('⚠️ Failed to get FCM token - user will not receive push notifications');
        console.warn('⚠️ Possible causes: No Google Play Services, network issue, or Firebase config missing');
        return null;
      }

      console.log('✅ FCM token generated:', token.substring(0, 20) + '...');

      // Store token in database with retry
      const platform = Platform.OS as 'ios' | 'android';
      
      try {
        await DeviceTokenManager.storeToken(userId, token, platform);
        console.log('✅ FCM token stored in database');
      } catch (dbError) {
        console.error('❌ Failed to store FCM token in database:', dbError);
        console.warn('⚠️ User will not receive push notifications until token is stored');
        
        // Retry once after 2 seconds
        try {
          console.log('🔄 Retrying token storage...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await DeviceTokenManager.storeToken(userId, token, platform);
          console.log('✅ FCM token stored in database (retry succeeded)');
        } catch (retryError) {
          console.error('❌ Failed to store FCM token after retry:', retryError);
          return null;
        }
      }

      return token;
    } catch (error) {
      console.error('❌ Error generating and storing FCM token:', error);
      
      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Don't throw - return null to allow app to continue without push notifications
      console.warn('⚠️ User can still use the app, but will not receive push notifications');
      return null;
    }
  }

  /**
   * Set up token refresh listener
   * Automatically updates the token in the database when it refreshes
   * 
   * @param userId - User ID to associate with refreshed tokens
   */
  static setupTokenRefreshListener(userId: string): void {
    // Remove existing listener if any
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
    }

    // Set up new listener
    this.tokenRefreshListener = onTokenRefresh(getMessaging(), async (token) => {
      try {
        console.log('🔄 FCM token refreshed:', token.substring(0, 20) + '...');
        
        // Store the new token
        const platform = Platform.OS as 'ios' | 'android';
        await DeviceTokenManager.storeToken(userId, token, platform);
        
        console.log('✅ Refreshed FCM token stored in database');
      } catch (error) {
        console.error('❌ Error storing refreshed FCM token:', error);
      }
    });

    console.log('✅ Token refresh listener set up');
  }

  /**
   * Remove token refresh listener
   * Should be called on logout
   */
  static removeTokenRefreshListener(): void {
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
      console.log('✅ Token refresh listener removed');
    }
  }

  /**
   * Get the current FCM token
   * 
   * @returns The current FCM token or null if not available
   */
  static async getCurrentToken(): Promise<string | null> {
    try {
      const token = await getToken(getMessaging());
      return token;
    } catch (error) {
      console.error('❌ Error getting current FCM token:', error);
      return null;
    }
  }

  /**
   * Delete the current FCM token
   * Should be called on logout
   */
  static async deleteToken(): Promise<void> {
    try {
      await deleteToken(getMessaging());
      console.log('✅ FCM token deleted');
    } catch (error) {
      console.error('❌ Error deleting FCM token:', error);
      throw new Error('Failed to delete FCM token');
    }
  }

  /**
   * Update last_used_at timestamp for a token
   * Called after successfully sending a notification
   * 
   * @param token - FCM device token
   */
  static async updateTokenLastUsed(token: string): Promise<void> {
    try {
      await DeviceTokenManager.updateLastUsed(token);
    } catch (error) {
      console.error('❌ Error updating token last used:', error);
      // Don't throw - this is a non-critical operation
    }
  }
}
