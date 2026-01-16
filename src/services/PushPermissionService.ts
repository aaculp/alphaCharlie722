/**
 * PushPermissionService
 * 
 * Manages push notification permissions for iOS and Android.
 * Handles permission requests, status checks, and permission state management.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.6, 2.7
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_STATUS_KEY = '@push_permission_status';
const PERMISSION_REQUESTED_KEY = '@push_permission_requested';

/**
 * Push notification permission status
 */
export type PermissionStatus = 
  | 'authorized'      // User granted permission
  | 'denied'          // User denied permission
  | 'provisional'     // iOS only - provisional permission granted
  | 'not_determined'  // Permission not yet requested
  | 'unavailable';    // Push notifications not available on device

/**
 * Permission request result
 */
export interface PermissionResult {
  status: PermissionStatus;
  canRequest: boolean;  // Whether we can request permission again
  isPermanentlyDenied: boolean;  // Whether user permanently denied permission
}

export class PushPermissionService {
  /**
   * Request push notification permission from the user
   * Handles both iOS and Android permission flows
   * 
   * @returns Permission result with status and metadata
   */
  static async requestPermission(): Promise<PermissionResult> {
    try {
      console.log('🔔 Requesting push notification permission...');

      // Check if already requested
      const hasRequested = await this.hasRequestedPermission();
      
      // Request permission from Firebase Messaging
      const authStatus = await messaging().requestPermission({
        sound: true,
        announcement: true,
        badge: true,
        alert: true,
      });

      // Map Firebase auth status to our permission status
      const status = this.mapAuthStatusToPermissionStatus(authStatus);
      
      console.log('📱 Permission status:', status);

      // Store permission status
      await this.storePermissionStatus(status);
      
      // Mark that we've requested permission
      if (!hasRequested) {
        await this.markPermissionRequested();
      }

      // Determine if we can request again
      const canRequest = status === 'not_determined';
      const isPermanentlyDenied = status === 'denied' && hasRequested;

      return {
        status,
        canRequest,
        isPermanentlyDenied,
      };
    } catch (error) {
      console.error('❌ Error requesting push permission:', error);
      
      return {
        status: 'unavailable',
        canRequest: false,
        isPermanentlyDenied: false,
      };
    }
  }

  /**
   * Check current push notification permission status
   * Does not trigger a permission request
   * 
   * @returns Current permission status
   */
  static async checkPermissionStatus(): Promise<PermissionStatus> {
    try {
      // First check stored status
      const storedStatus = await this.getStoredPermissionStatus();
      if (storedStatus) {
        return storedStatus;
      }

      // If no stored status, check with Firebase
      const authStatus = await messaging().hasPermission();
      const status = this.mapAuthStatusToPermissionStatus(authStatus);
      
      // Store for future checks
      await this.storePermissionStatus(status);
      
      return status;
    } catch (error) {
      console.error('❌ Error checking permission status:', error);
      return 'unavailable';
    }
  }

  /**
   * Check if push notifications are enabled (authorized or provisional)
   * 
   * @returns True if push notifications are enabled
   */
  static async isEnabled(): Promise<boolean> {
    const status = await this.checkPermissionStatus();
    return status === 'authorized' || status === 'provisional';
  }

  /**
   * Check if permission has been permanently denied
   * 
   * @returns True if user permanently denied permission
   */
  static async isPermanentlyDenied(): Promise<boolean> {
    const status = await this.checkPermissionStatus();
    const hasRequested = await this.hasRequestedPermission();
    
    return status === 'denied' && hasRequested;
  }

  /**
   * Open device settings for the app
   * Allows user to manually enable push notifications
   */
  static async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('❌ Error opening settings:', error);
      Alert.alert(
        'Cannot Open Settings',
        'Please open your device settings manually to enable notifications.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Show alert with instructions for enabling push notifications
   * Used when permission is permanently denied
   * Provides platform-specific instructions and deep link to settings
   * 
   * Requirements: 2.8, 2.9
   */
  static showPermissionDeniedAlert(): void {
    const platformInstructions = Platform.OS === 'ios'
      ? 'Go to Settings > Notifications > OTW and enable notifications.'
      : 'Go to Settings > Apps > OTW > Notifications and enable notifications.';

    Alert.alert(
      'Push Notifications Disabled',
      `To receive real-time notifications, please enable push notifications in your device settings.\n\n${platformInstructions}\n\nYou can still view notifications in the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openSettings() 
        },
      ]
    );
  }

  /**
   * Show alert explaining fallback to in-app notifications
   * Used when push is disabled but user can still use the app
   * 
   * Requirements: 2.9
   */
  static showFallbackNotificationInfo(): void {
    Alert.alert(
      'In-App Notifications Only',
      'Push notifications are disabled. You\'ll still receive notifications when you open the app, but you won\'t get real-time alerts.\n\nTo enable push notifications, go to your device settings.',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openSettings() 
        },
      ]
    );
  }

  /**
   * Handle "never ask again" state on Android
   * Shows appropriate message when permission is permanently denied
   * 
   * Requirements: 2.8
   */
  static async handleNeverAskAgain(): Promise<void> {
    const isPermanentlyDenied = await this.isPermanentlyDenied();
    
    if (isPermanentlyDenied) {
      if (Platform.OS === 'android') {
        Alert.alert(
          'Permission Required',
          'You\'ve previously denied push notification permission. To enable notifications:\n\n' +
          '1. Open Settings\n' +
          '2. Go to Apps > OTW\n' +
          '3. Tap Notifications\n' +
          '4. Enable notifications\n\n' +
          'You can still use the app and view notifications when you open it.',
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => this.openSettings() 
            },
          ]
        );
      } else {
        this.showPermissionDeniedAlert();
      }
    }
  }

  /**
   * Clear stored permission status
   * Used for testing or when resetting app state
   */
  static async clearPermissionStatus(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        PERMISSION_STATUS_KEY,
        PERMISSION_REQUESTED_KEY,
      ]);
      console.log('✅ Permission status cleared');
    } catch (error) {
      console.error('❌ Error clearing permission status:', error);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Map Firebase auth status to our permission status enum
   */
  private static mapAuthStatusToPermissionStatus(
    authStatus: number
  ): PermissionStatus {
    switch (authStatus) {
      case messaging.AuthorizationStatus.AUTHORIZED:
        return 'authorized';
      case messaging.AuthorizationStatus.DENIED:
        return 'denied';
      case messaging.AuthorizationStatus.PROVISIONAL:
        return 'provisional';
      case messaging.AuthorizationStatus.NOT_DETERMINED:
        return 'not_determined';
      default:
        return 'unavailable';
    }
  }

  /**
   * Store permission status in AsyncStorage
   */
  private static async storePermissionStatus(status: PermissionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_STATUS_KEY, status);
    } catch (error) {
      console.error('❌ Error storing permission status:', error);
    }
  }

  /**
   * Get stored permission status from AsyncStorage
   */
  private static async getStoredPermissionStatus(): Promise<PermissionStatus | null> {
    try {
      const status = await AsyncStorage.getItem(PERMISSION_STATUS_KEY);
      return status as PermissionStatus | null;
    } catch (error) {
      console.error('❌ Error getting stored permission status:', error);
      return null;
    }
  }

  /**
   * Mark that permission has been requested
   */
  private static async markPermissionRequested(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
    } catch (error) {
      console.error('❌ Error marking permission requested:', error);
    }
  }

  /**
   * Check if permission has been requested before
   */
  private static async hasRequestedPermission(): Promise<boolean> {
    try {
      const requested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
      return requested === 'true';
    } catch (error) {
      console.error('❌ Error checking if permission requested:', error);
      return false;
    }
  }
}
