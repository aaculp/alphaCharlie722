/**
 * PermissionHandler
 * 
 * Handles permission requests and errors for location and notifications
 * Provides user-friendly messages and settings navigation
 */

import { Platform, Linking, Alert, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type PermissionType = 'location' | 'notification';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

export class PermissionHandler {
  /**
   * Check if a permission is granted
   */
  static async checkPermission(type: PermissionType): Promise<PermissionResult> {
    if (type === 'location') {
      return this.checkLocationPermission();
    } else if (type === 'notification') {
      // Notifications are handled by Firebase, assume granted for now
      return { granted: true, canAskAgain: false };
    }
    return { granted: false, canAskAgain: false };
  }

  /**
   * Check location permission
   */
  private static async checkLocationPermission(): Promise<PermissionResult> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return { granted, canAskAgain: !granted };
      } catch (error) {
        console.error('Error checking location permission:', error);
        return { granted: false, canAskAgain: false };
      }
    } else {
      // For iOS, we'll assume permission is granted if we can get location
      // The actual permission check happens when requesting location
      return { granted: true, canAskAgain: false };
    }
  }

  /**
   * Request a permission
   */
  static async requestPermission(type: PermissionType): Promise<PermissionResult> {
    if (type === 'location') {
      return this.requestLocationPermission();
    } else if (type === 'notification') {
      // Notifications are handled by Firebase
      return { granted: true, canAskAgain: false };
    }
    return { granted: false, canAskAgain: false };
  }

  /**
   * Request location permission
   */
  private static async requestLocationPermission(): Promise<PermissionResult> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show flash offers near you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return { granted: true, canAskAgain: false };
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return {
            granted: false,
            canAskAgain: false,
            message: this.getBlockedMessage('location'),
          };
        } else {
          return {
            granted: false,
            canAskAgain: true,
            message: this.getDeniedMessage('location'),
          };
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        return { granted: false, canAskAgain: false };
      }
    } else {
      // For iOS, request location through Geolocation
      // The permission prompt will be shown automatically
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          () => {
            resolve({ granted: true, canAskAgain: false });
          },
          (error) => {
            console.error('Location authorization error:', error);
            resolve({
              granted: false,
              canAskAgain: false,
              message: this.getBlockedMessage('location'),
            });
          }
        );
      });
    }
  }

  /**
   * Show permission denied alert with option to open settings
   */
  static showPermissionAlert(
    type: PermissionType,
    result: PermissionResult,
    onSettingsPress?: () => void
  ): void {
    const title = this.getAlertTitle(type);
    const message = result.message || this.getDeniedMessage(type);

    if (result.canAskAgain) {
      // User can be asked again
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permission', 
            onPress: async () => {
              const newResult = await this.requestPermission(type);
              if (!newResult.granted && !newResult.canAskAgain) {
                // Now blocked, show settings alert
                this.showPermissionAlert(type, newResult, onSettingsPress);
              }
            },
          },
        ]
      );
    } else {
      // Permission is blocked, need to go to settings
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              this.openSettings();
              if (onSettingsPress) {
                onSettingsPress();
              }
            },
          },
        ]
      );
    }
  }

  /**
   * Open device settings
   */
  static async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert('Error', 'Unable to open settings. Please open settings manually.');
    }
  }

  /**
   * Get alert title for permission type
   */
  private static getAlertTitle(type: PermissionType): string {
    switch (type) {
      case 'location':
        return 'Location Permission Required';
      case 'notification':
        return 'Notification Permission Required';
      default:
        return 'Permission Required';
    }
  }

  /**
   * Get denied message for permission type
   */
  private static getDeniedMessage(type: PermissionType): string {
    switch (type) {
      case 'location':
        return 'Location access is required to find flash offers near you. Please grant location permission to continue.';
      case 'notification':
        return 'Notification permission is required to receive flash offer alerts. Please enable notifications to stay updated.';
      default:
        return 'This permission is required to use this feature.';
    }
  }

  /**
   * Get blocked message for permission type
   */
  private static getBlockedMessage(type: PermissionType): string {
    switch (type) {
      case 'location':
        return 'Location permission is blocked. Please enable it in your device settings to find flash offers near you.';
      case 'notification':
        return 'Notification permission is blocked. Please enable it in your device settings to receive flash offer alerts.';
      default:
        return 'This permission is blocked. Please enable it in your device settings.';
    }
  }

  /**
   * Get user-friendly feature description
   */
  static getFeatureDescription(type: PermissionType): string {
    switch (type) {
      case 'location':
        return 'We use your location to show you flash offers from nearby venues. Your location is only used when you open the app.';
      case 'notification':
        return 'We send notifications when venues near you create new flash offers. You can customize notification preferences in settings.';
      default:
        return '';
    }
  }

  /**
   * Check if permission is permanently denied (blocked)
   */
  static async isPermissionBlocked(type: PermissionType): Promise<boolean> {
    const result = await this.checkPermission(type);
    return !result.granted && !result.canAskAgain;
  }
}
