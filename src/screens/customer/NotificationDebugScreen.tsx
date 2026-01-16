/**
 * NotificationDebugScreen
 * 
 * Debug screen for testing push notifications during development.
 * Allows sending test notifications to specific device tokens.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { DeviceTokenManager } from '../../services/DeviceTokenManager';
import { FCMService } from '../../services/FCMService';
import { PushNotificationService } from '../../services/PushNotificationService';
import type { NotificationType } from '../../types/social.types';

interface TestNotificationResult {
  timestamp: string;
  type: NotificationType;
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

export const NotificationDebugScreen: React.FC = () => {
  const { user } = useAuth();
  const [deviceTokens, setDeviceTokens] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [customToken, setCustomToken] = useState<string>('');
  const [notificationType, setNotificationType] = useState<NotificationType>('friend_request');
  const [title, setTitle] = useState<string>('Test Notification');
  const [body, setBody] = useState<string>('This is a test notification');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<TestNotificationResult[]>([]);

  // Load user's device tokens on mount
  useEffect(() => {
    loadDeviceTokens();
  }, [user]);

  const loadDeviceTokens = async () => {
    if (!user?.id) return;

    try {
      const tokens = await DeviceTokenManager.getUserTokens(user.id);
      const tokenStrings = tokens.map(t => t.token);
      setDeviceTokens(tokenStrings);
      
      if (tokenStrings.length > 0) {
        setSelectedToken(tokenStrings[0]);
      }
    } catch (error) {
      console.error('Error loading device tokens:', error);
      Alert.alert('Error', 'Failed to load device tokens');
    }
  };

  const sendTestNotification = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    const tokenToUse = customToken || selectedToken;
    
    if (!tokenToUse) {
      Alert.alert('Error', 'Please select or enter a device token');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Sending test notification...');
      console.log('Token:', tokenToUse.substring(0, 20) + '...');
      console.log('Type:', notificationType);
      console.log('Title:', title);
      console.log('Body:', body);

      // Build test payload
      const payload = {
        title,
        body,
        data: {
          type: notificationType,
          actorId: user.id,
          navigationTarget: getNavigationTarget(notificationType),
          navigationParams: getNavigationParams(notificationType),
        },
      };

      // Send via PushNotificationService
      const result = await PushNotificationService.sendSocialNotification(
        user.id,
        notificationType,
        payload
      );

      // Log result
      const testResult: TestNotificationResult = {
        timestamp: new Date().toISOString(),
        type: notificationType,
        success: result.success,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors.map(e => e.error),
      };

      setResults(prev => [testResult, ...prev]);

      // Show feedback
      if (result.success && result.sentCount > 0) {
        Alert.alert(
          'Success',
          `Test notification sent successfully!\n\nSent: ${result.sentCount}\nFailed: ${result.failedCount}`
        );
      } else if (result.failedCount > 0) {
        Alert.alert(
          'Partial Failure',
          `Some notifications failed to send.\n\nSent: ${result.sentCount}\nFailed: ${result.failedCount}\n\nErrors:\n${result.errors.map(e => e.error).join('\n')}`
        );
      } else {
        Alert.alert(
          'Info',
          'No notifications sent. Check if push notifications are enabled in preferences.'
        );
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      const testResult: TestNotificationResult = {
        timestamp: new Date().toISOString(),
        type: notificationType,
        success: false,
        sentCount: 0,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };

      setResults(prev => [testResult, ...prev]);

      Alert.alert(
        'Error',
        `Failed to send test notification:\n${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getNavigationTarget = (type: NotificationType): string => {
    switch (type) {
      case 'friend_request':
        return 'FriendRequests';
      case 'friend_accepted':
        return 'Profile';
      case 'venue_share':
        return 'VenueDetail';
      case 'collection_follow':
      case 'collection_update':
        return 'CollectionDetail';
      case 'activity_like':
      case 'activity_comment':
        return 'ActivityDetail';
      default:
        return 'Home';
    }
  };

  const getNavigationParams = (type: NotificationType): Record<string, any> => {
    switch (type) {
      case 'friend_accepted':
        return { userId: user?.id };
      case 'venue_share':
        return { venueId: 'test-venue-id', venueName: 'Test Venue' };
      case 'collection_follow':
      case 'collection_update':
        return { collectionId: 'test-collection-id' };
      case 'activity_like':
      case 'activity_comment':
        return { activityId: 'test-activity-id' };
      default:
        return {};
    }
  };

  const notificationTypes: NotificationType[] = [
    'friend_request',
    'friend_accepted',
    'venue_share',
    'collection_follow',
    'collection_update',
    'activity_like',
    'activity_comment',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notification Debugger</Text>
        <Text style={styles.subtitle}>Test push notifications in development</Text>
      </View>

      {/* Device Token Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Token</Text>
        
        {deviceTokens.length > 0 ? (
          <>
            <Text style={styles.label}>Your Devices:</Text>
            {deviceTokens.map((token, index) => (
              <TouchableOpacity
                key={token}
                style={[
                  styles.tokenOption,
                  selectedToken === token && styles.tokenOptionSelected,
                ]}
                onPress={() => {
                  setSelectedToken(token);
                  setCustomToken('');
                }}
              >
                <Text style={styles.tokenText}>
                  Device {index + 1}: {token.substring(0, 30)}...
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <Text style={styles.noTokensText}>No device tokens found</Text>
        )}

        <Text style={styles.label}>Or enter custom token:</Text>
        <TextInput
          style={styles.input}
          value={customToken}
          onChangeText={text => {
            setCustomToken(text);
            setSelectedToken('');
          }}
          placeholder="Enter FCM device token"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Notification Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Type</Text>
        <View style={styles.typeGrid}>
          {notificationTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                notificationType === type && styles.typeButtonSelected,
              ]}
              onPress={() => setNotificationType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  notificationType === type && styles.typeButtonTextSelected,
                ]}
              >
                {type.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notification Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Content</Text>
        
        <Text style={styles.label}>Title:</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title"
        />

        <Text style={styles.label}>Body:</Text>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Notification body"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
        onPress={sendTestNotification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendButtonText}>Send Test Notification</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {results.map((result, index) => (
            <View
              key={`${result.timestamp}-${index}`}
              style={[
                styles.resultCard,
                result.success ? styles.resultSuccess : styles.resultFailure,
              ]}
            >
              <Text style={styles.resultTime}>
                {new Date(result.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.resultType}>{result.type}</Text>
              <Text style={styles.resultStatus}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </Text>
              <Text style={styles.resultDetails}>
                Sent: {result.sentCount} | Failed: {result.failedCount}
              </Text>
              {result.errors.length > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Errors:</Text>
                  {result.errors.map((error, i) => (
                    <Text key={i} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Select a device token or enter a custom one{'\n'}
          2. Choose a notification type{'\n'}
          3. Customize the title and body{'\n'}
          4. Tap "Send Test Notification"{'\n'}
          5. Check the results below{'\n'}
          {'\n'}
          Note: Test notifications respect user preferences. If notifications are disabled for the selected type, no push will be sent.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  tokenOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  tokenOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  tokenText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  noTokensText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  typeButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  resultFailure: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
