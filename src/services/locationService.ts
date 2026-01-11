import { PermissionsAndroid, Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export class LocationService {
  /**
   * Check if location permission is granted
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  static async checkLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the system
      return true;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      console.log('📍 Permission check result:', granted);
      return granted;
    } catch (err) {
      console.warn('❌ Error checking location permission:', err);
      return false;
    }
  }

  /**
   * Request location permissions from the user
   * @returns Promise<'granted' | 'denied' | 'never_ask_again'> - permission status
   */
  static async requestLocationPermission(): Promise<'granted' | 'denied' | 'never_ask_again'> {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the system
      return 'granted';
    }

    try {
      // First check if we already have permission
      const hasPermission = await this.checkLocationPermission();
      if (hasPermission) {
        console.log('✅ Location permission already granted');
        return 'granted';
      }

      console.log('🔔 Requesting location permission...');
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'alphaCharlie722 needs access to your location to show nearby venues.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      console.log('📍 Permission request result:', result);

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Location permission granted');
        return 'granted';
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('❌ Location permission denied: never_ask_again');
        return 'never_ask_again';
      } else {
        console.log('❌ Location permission denied:', result);
        return 'denied';
      }
    } catch (err) {
      console.warn('❌ Error requesting location permission:', err);
      return 'denied';
    }
  }

  /**
   * Open app settings so user can manually enable location permission
   */
  static async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('❌ Error opening app settings:', err);
    }
  }

  /**
   * Get the user's current location
   * @returns Promise<LocationCoordinates> - user's current coordinates
   */
  static async getCurrentLocation(): Promise<LocationCoordinates> {
    const permissionStatus = await this.requestLocationPermission();
    
    if (permissionStatus === 'never_ask_again') {
      throw new Error('Location permission permanently denied. Please enable it in Settings.');
    }
    
    if (permissionStatus === 'denied') {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Got location:', position.coords);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
          });
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Calculate distance between two coordinates in kilometers
   * Uses the Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Format distance for display
   * @param distanceKm - distance in kilometers
   * @returns formatted string (e.g., "1.2 km" or "500 m")
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }
}
