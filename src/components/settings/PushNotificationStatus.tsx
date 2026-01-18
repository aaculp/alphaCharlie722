/**
 * PushNotificationStatus Component
 * 
 * Displays the current status of push notifications and provides
 * troubleshooting guidance if there are issues.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { FCMTokenService } from '../../services/FCMTokenService';
import { useAuth } from '../../contexts/AuthContext';

interface PushNotificationStatusProps {
  style?: any;
}

export const PushNotificationStatus: React.FC<PushNotificationStatusProps> = ({ style }) => {
  const { user } = useAuth();
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkTokenStatus();
  }, [user]);

  const checkTokenStatus = async () => {
    if (!user) {
      setTokenStatus('inactive');
      setErrorMessage('Not logged in');
      return;
    }

    try {
      const token = await FCMTokenService.getCurrentToken();
      
      if (token) {
        setTokenStatus('active');
        setErrorMessage(null);
      } else {
        setTokenStatus('inactive');
        setErrorMessage('No FCM token available');
      }
    } catch (error) {
      setTokenStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const retryTokenGeneration = async () => {
    if (!user) return;

    setTokenStatus('checking');
    setErrorMessage(null);

    try {
      const token = await FCMTokenService.generateAndStoreToken(user.id);
      
      if (token) {
        setTokenStatus('active');
        FCMTokenService.setupTokenRefreshListener(user.id);
      } else {
        setTokenStatus('error');
        setErrorMessage('Failed to generate token. Check troubleshooting steps below.');
      }
    } catch (error) {
      setTokenStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getStatusColor = () => {
    switch (tokenStatus) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (tokenStatus) {
      case 'checking':
        return 'Checking...';
      case 'active':
        return 'Active - You will receive push notifications';
      case 'inactive':
        return 'Inactive - Push notifications disabled';
      case 'error':
        return 'Error - Push notifications unavailable';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {tokenStatus === 'error' && (
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
          
          <Text style={styles.troubleshootingStep}>
            1. Check notification permissions in device settings
          </Text>
          <TouchableOpacity style={styles.button} onPress={openAppSettings}>
            <Text style={styles.buttonText}>Open Settings</Text>
          </TouchableOpacity>

          {Platform.OS === 'android' && (
            <>
              <Text style={styles.troubleshootingStep}>
                2. Ensure Google Play Services is installed and up to date
              </Text>
              <Text style={styles.troubleshootingStep}>
                3. Check your internet connection
              </Text>
            </>
          )}

          <Text style={styles.troubleshootingStep}>
            {Platform.OS === 'android' ? '4' : '2'}. Try generating a new token
          </Text>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={retryTokenGeneration}
            disabled={tokenStatus === 'checking'}
          >
            <Text style={styles.buttonText}>
              {tokenStatus === 'checking' ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {tokenStatus === 'active' && (
        <Text style={styles.successText}>
          ✓ You will receive notifications for flash offers, friend requests, and more!
        </Text>
      )}

      {tokenStatus === 'inactive' && (
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingStep}>
            Enable push notifications to receive:
          </Text>
          <Text style={styles.featureList}>• Flash offer alerts</Text>
          <Text style={styles.featureList}>• Friend requests</Text>
          <Text style={styles.featureList}>• Venue shares</Text>
          <Text style={styles.featureList}>• Activity updates</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.enableButton]} 
            onPress={retryTokenGeneration}
          >
            <Text style={styles.buttonText}>Enable Push Notifications</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
    fontStyle: 'italic',
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
  },
  troubleshooting: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  troubleshootingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  troubleshootingStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  featureList: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF9800',
  },
  enableButton: {
    backgroundColor: '#4CAF50',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
