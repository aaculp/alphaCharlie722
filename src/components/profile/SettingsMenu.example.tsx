/**
 * SettingsMenu Example Usage
 * 
 * This file demonstrates how to use the SettingsMenu component
 * with proper navigation handling.
 */

import React from 'react';
import { View, Alert } from 'react-native';
import { SettingsMenu } from './SettingsMenu';
import type { SettingType } from '../../types/profile.types';

/**
 * Example component showing SettingsMenu usage
 */
export const SettingsMenuExample: React.FC = () => {
  /**
   * Handle setting option press
   * In a real app, this would navigate to the appropriate screen
   * 
   * Requirements: 5.7
   */
  const handleSettingPress = (setting: SettingType) => {
    switch (setting) {
      case 'notifications':
        // Navigate to notifications settings screen
        console.log('Navigate to Notifications settings');
        Alert.alert('Navigation', 'Would navigate to Notifications settings');
        break;
      
      case 'privacy':
        // Navigate to privacy settings screen
        console.log('Navigate to Privacy settings');
        Alert.alert('Navigation', 'Would navigate to Privacy settings');
        break;
      
      case 'security':
        // Navigate to security settings screen
        console.log('Navigate to Security settings');
        Alert.alert('Navigation', 'Would navigate to Security settings');
        break;
      
      case 'help':
        // Navigate to help & support screen
        console.log('Navigate to Help & Support');
        Alert.alert('Navigation', 'Would navigate to Help & Support');
        break;
      
      case 'logout':
        // Handle logout action
        console.log('Handle logout');
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => {
              console.log('User logged out');
            }},
          ]
        );
        break;
      
      default:
        console.warn('Unknown setting type:', setting);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <SettingsMenu onSettingPress={handleSettingPress} />
    </View>
  );
};
