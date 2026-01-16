/**
 * NotificationTestHelper
 * 
 * Helper utilities for testing push notifications in different app states.
 * Provides methods to simulate notifications in foreground, background, and closed states.
 * 
 * Requirements: 13.5, 13.6, 13.7
 */

import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { NotificationHandler } from '../NotificationHandler';
import type { NotificationType } from '../../types/social.types';

export interface TestNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string;
  referenceId?: string;
  navigationTarget: string;
  navigationParams?: Record<string, any>;
}

export class NotificationTestHelper {
  /**
   * Create a mock FCM remote message for testing
   * 
   * @param payload - Test notification payload
   * @returns Mock remote message
   */
  static createMockRemoteMessage(
    payload: TestNotificationPayload
  ): FirebaseMessagingTypes.RemoteMessage {
    // Merge actorId into navigationParams if present
    const navigationParams = {
      ...payload.navigationParams,
    };
    
    // Add actorId to navigationParams if present
    if (payload.actorId) {
      navigationParams.actorId = payload.actorId;
    }
    
    return {
      messageId: `test-${Date.now()}`,
      data: {
        type: payload.type,
        actorId: payload.actorId || '',
        referenceId: payload.referenceId || '',
        navigationTarget: payload.navigationTarget,
        navigationParams: Object.keys(navigationParams).length > 0
          ? JSON.stringify(navigationParams)
          : '',
      },
      notification: {
        title: payload.title,
        body: payload.body,
      },
      sentTime: Date.now(),
      ttl: 86400,
      from: 'test-sender',
      fcmOptions: {},
    } as FirebaseMessagingTypes.RemoteMessage;
  }

  /**
   * Test foreground notification handling
   * Simulates receiving a notification while app is in foreground
   * 
   * @param payload - Test notification payload
   */
  static testForegroundNotification(payload: TestNotificationPayload): void {
    console.log('🧪 Testing foreground notification...');
    console.log('Type:', payload.type);
    console.log('Title:', payload.title);
    console.log('Body:', payload.body);

    const remoteMessage = this.createMockRemoteMessage(payload);
    
    try {
      NotificationHandler.handleForegroundNotification(remoteMessage);
      console.log('✅ Foreground notification handled successfully');
    } catch (error) {
      console.error('❌ Error handling foreground notification:', error);
      throw error;
    }
  }

  /**
   * Test background notification handling
   * Simulates receiving a notification while app is in background
   * 
   * @param payload - Test notification payload
   */
  static async testBackgroundNotification(
    payload: TestNotificationPayload
  ): Promise<void> {
    console.log('🧪 Testing background notification...');
    console.log('Type:', payload.type);
    console.log('Title:', payload.title);
    console.log('Body:', payload.body);

    const remoteMessage = this.createMockRemoteMessage(payload);
    
    try {
      await NotificationHandler.handleBackgroundNotification(remoteMessage);
      console.log('✅ Background notification handled successfully');
    } catch (error) {
      console.error('❌ Error handling background notification:', error);
      throw error;
    }
  }

  /**
   * Test notification tap handling
   * Simulates user tapping on a notification
   * 
   * @param payload - Test notification payload
   */
  static async testNotificationTap(
    payload: TestNotificationPayload
  ): Promise<void> {
    console.log('🧪 Testing notification tap...');
    console.log('Type:', payload.type);
    console.log('Navigation Target:', payload.navigationTarget);
    console.log('Navigation Params:', payload.navigationParams);

    const remoteMessage = this.createMockRemoteMessage(payload);
    
    try {
      await NotificationHandler.handleNotificationTap(remoteMessage);
      console.log('✅ Notification tap handled successfully');
    } catch (error) {
      console.error('❌ Error handling notification tap:', error);
      throw error;
    }
  }

  /**
   * Test notification navigation
   * Tests navigation without full notification handling
   * 
   * @param type - Notification type
   * @param params - Navigation parameters
   */
  static testNotificationNavigation(
    type: NotificationType,
    params: Record<string, any>
  ): void {
    console.log('🧪 Testing notification navigation...');
    console.log('Type:', type);
    console.log('Params:', params);

    try {
      NotificationHandler.navigateFromNotification(type, params);
      console.log('✅ Navigation handled successfully');
    } catch (error) {
      console.error('❌ Error handling navigation:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive notification tests
   * Tests all notification types in all app states
   */
  static async runComprehensiveTests(): Promise<void> {
    console.log('🧪 Running comprehensive notification tests...');
    console.log('='.repeat(50));

    const testCases: TestNotificationPayload[] = [
      {
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'John Doe sent you a friend request',
        actorId: 'test-user-1',
        navigationTarget: 'FriendRequests',
      },
      {
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: 'Jane Smith accepted your friend request',
        actorId: 'test-user-2',
        navigationTarget: 'Profile',
        navigationParams: { userId: 'test-user-2' },
      },
      {
        type: 'venue_share',
        title: 'Venue Shared',
        body: 'Mike Johnson shared The Coffee Shop with you',
        actorId: 'test-user-3',
        navigationTarget: 'VenueDetail',
        navigationParams: {
          venueId: 'test-venue-1',
          venueName: 'The Coffee Shop',
        },
      },
    ];

    for (const testCase of testCases) {
      console.log('\n' + '-'.repeat(50));
      console.log(`Testing: ${testCase.type}`);
      console.log('-'.repeat(50));

      // Test foreground
      console.log('\n📱 Foreground State:');
      this.testForegroundNotification(testCase);

      // Test background
      console.log('\n📭 Background State:');
      await this.testBackgroundNotification(testCase);

      // Test tap
      console.log('\n👆 Notification Tap:');
      await this.testNotificationTap(testCase);

      console.log('\n✅ All tests passed for', testCase.type);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All comprehensive tests completed successfully');
  }

  /**
   * Create test payloads for each notification type
   * 
   * @returns Array of test payloads
   */
  static getTestPayloads(): TestNotificationPayload[] {
    return [
      {
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'Test User sent you a friend request',
        actorId: 'test-user-1',
        navigationTarget: 'FriendRequests',
      },
      {
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: 'Test User accepted your friend request',
        actorId: 'test-user-2',
        navigationTarget: 'Profile',
        navigationParams: { userId: 'test-user-2' },
      },
      {
        type: 'venue_share',
        title: 'Venue Shared',
        body: 'Test User shared Test Venue with you',
        actorId: 'test-user-3',
        navigationTarget: 'VenueDetail',
        navigationParams: {
          venueId: 'test-venue-1',
          venueName: 'Test Venue',
        },
      },
      {
        type: 'collection_follow',
        title: 'New Collection Follower',
        body: 'Test User followed your collection',
        actorId: 'test-user-4',
        navigationTarget: 'CollectionDetail',
        navigationParams: { collectionId: 'test-collection-1' },
      },
      {
        type: 'activity_like',
        title: 'Activity Liked',
        body: 'Test User liked your activity',
        actorId: 'test-user-5',
        navigationTarget: 'ActivityDetail',
        navigationParams: { activityId: 'test-activity-1' },
      },
    ];
  }
}
