/**
 * NotificationHandler App States Tests
 * 
 * Tests notification handling in different app states:
 * - Foreground (app is open and active)
 * - Background (app is open but not active)
 * - Closed (app is not running)
 * 
 * Requirements: 13.5, 13.6, 13.7
 */

import { NotificationHandler } from '../NotificationHandler';
import { NotificationTestHelper, TestNotificationPayload } from './NotificationTestHelper';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// Mock dependencies
jest.mock('../api/notifications');
jest.mock('../../lib/supabase');

describe('NotificationHandler - App States', () => {
  let mockNavigationHandler: jest.Mock;

  beforeEach(() => {
    // Set up mock navigation handler
    mockNavigationHandler = jest.fn();
    NotificationHandler.setNavigationHandler(mockNavigationHandler);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Foreground Notifications', () => {
    it('should handle friend request notification in foreground', () => {
      const payload: TestNotificationPayload = {
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'John Doe sent you a friend request',
        actorId: 'user-123',
        navigationTarget: 'FriendRequests',
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      // Should not throw
      expect(() => {
        NotificationHandler.handleForegroundNotification(remoteMessage);
      }).not.toThrow();
    });

    it('should handle venue share notification in foreground', () => {
      const payload: TestNotificationPayload = {
        type: 'venue_share',
        title: 'Venue Shared',
        body: 'Jane shared The Coffee Shop with you',
        actorId: 'user-456',
        navigationTarget: 'VenueDetail',
        navigationParams: {
          venueId: 'venue-789',
          venueName: 'The Coffee Shop',
        },
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      expect(() => {
        NotificationHandler.handleForegroundNotification(remoteMessage);
      }).not.toThrow();
    });

    it('should handle invalid notification data gracefully in foreground', () => {
      const invalidMessage = {
        messageId: 'test-invalid',
        data: {}, // Missing required fields
        sentTime: Date.now(),
      } as FirebaseMessagingTypes.RemoteMessage;

      // Should not throw even with invalid data
      expect(() => {
        NotificationHandler.handleForegroundNotification(invalidMessage);
      }).not.toThrow();
    });
  });

  describe('Background Notifications', () => {
    it('should handle friend accepted notification in background', async () => {
      const payload: TestNotificationPayload = {
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: 'Mike accepted your friend request',
        actorId: 'user-789',
        navigationTarget: 'Profile',
        navigationParams: { userId: 'user-789' },
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      await expect(
        NotificationHandler.handleBackgroundNotification(remoteMessage)
      ).resolves.not.toThrow();
    });

    it('should handle collection follow notification in background', async () => {
      const payload: TestNotificationPayload = {
        type: 'collection_follow',
        title: 'New Follower',
        body: 'Sarah followed your collection',
        actorId: 'user-101',
        navigationTarget: 'CollectionDetail',
        navigationParams: { collectionId: 'collection-202' },
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      await expect(
        NotificationHandler.handleBackgroundNotification(remoteMessage)
      ).resolves.not.toThrow();
    });

    it('should handle invalid notification data gracefully in background', async () => {
      const invalidMessage = {
        messageId: 'test-invalid',
        data: {}, // Missing required fields
        sentTime: Date.now(),
      } as FirebaseMessagingTypes.RemoteMessage;

      await expect(
        NotificationHandler.handleBackgroundNotification(invalidMessage)
      ).resolves.not.toThrow();
    });
  });

  describe('Notification Tap (App Closed/Background)', () => {
    it('should navigate to friend requests on friend request tap', async () => {
      const payload: TestNotificationPayload = {
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'Test notification',
        navigationTarget: 'FriendRequests',
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      await NotificationHandler.handleNotificationTap(remoteMessage);

      expect(mockNavigationHandler).toHaveBeenCalledWith('FriendRequests');
    });

    it('should navigate to profile on friend accepted tap', async () => {
      const payload: TestNotificationPayload = {
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: 'Test notification',
        actorId: 'user-123',
        navigationTarget: 'Profile',
        navigationParams: { actorId: 'user-123' },
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      await NotificationHandler.handleNotificationTap(remoteMessage);

      expect(mockNavigationHandler).toHaveBeenCalledWith('Profile', {
        userId: 'user-123',
      });
    });

    it('should navigate to venue detail on venue share tap', async () => {
      const payload: TestNotificationPayload = {
        type: 'venue_share',
        title: 'Venue Shared',
        body: 'Test notification',
        navigationTarget: 'VenueDetail',
        navigationParams: {
          venueId: 'venue-456',
          venueName: 'Test Venue',
        },
      };

      const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

      await NotificationHandler.handleNotificationTap(remoteMessage);

      expect(mockNavigationHandler).toHaveBeenCalledWith('VenueDetail', {
        venueId: 'venue-456',
        venueName: 'Test Venue',
      });
    });

    it('should handle tap with invalid data gracefully', async () => {
      const invalidMessage = {
        messageId: 'test-invalid',
        data: {}, // Missing required fields
        sentTime: Date.now(),
      } as FirebaseMessagingTypes.RemoteMessage;

      await expect(
        NotificationHandler.handleNotificationTap(invalidMessage)
      ).resolves.not.toThrow();

      // Should not navigate with invalid data
      expect(mockNavigationHandler).not.toHaveBeenCalled();
    });
  });

  describe('Navigation from Notifications', () => {
    it('should navigate correctly for all notification types', () => {
      const testCases = [
        { type: 'friend_request' as const, expectedScreen: 'FriendRequests', params: {} },
        { type: 'friend_accepted' as const, expectedScreen: 'Profile', params: { actorId: 'user-1' } },
        { type: 'venue_share' as const, expectedScreen: 'VenueDetail', params: { venueId: 'venue-1' } },
        { type: 'collection_follow' as const, expectedScreen: 'CollectionDetail', params: { collectionId: 'col-1' } },
        { type: 'activity_like' as const, expectedScreen: 'ActivityDetail', params: { activityId: 'act-1' } },
      ];

      testCases.forEach(({ type, expectedScreen, params }) => {
        mockNavigationHandler.mockClear();
        
        NotificationHandler.navigateFromNotification(type, params);

        expect(mockNavigationHandler).toHaveBeenCalled();
        const [screen] = mockNavigationHandler.mock.calls[0];
        expect(screen).toBe(expectedScreen);
      });
    });

    it('should handle navigation without handler set', () => {
      // Remove navigation handler
      NotificationHandler.setNavigationHandler(null as any);

      // Should not throw
      expect(() => {
        NotificationHandler.navigateFromNotification('friend_request', {});
      }).not.toThrow();
    });
  });

  describe('Comprehensive App State Tests', () => {
    it('should handle all notification types in all states', async () => {
      const testPayloads = NotificationTestHelper.getTestPayloads();

      for (const payload of testPayloads) {
        const remoteMessage = NotificationTestHelper.createMockRemoteMessage(payload);

        // Test foreground
        expect(() => {
          NotificationHandler.handleForegroundNotification(remoteMessage);
        }).not.toThrow();

        // Test background
        await expect(
          NotificationHandler.handleBackgroundNotification(remoteMessage)
        ).resolves.not.toThrow();

        // Test tap
        await expect(
          NotificationHandler.handleNotificationTap(remoteMessage)
        ).resolves.not.toThrow();
      }
    });
  });
});
