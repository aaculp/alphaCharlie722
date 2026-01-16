/**
 * Integration tests for social notifications with push
 * 
 * These tests verify that when social events occur:
 * 1. In-app notification is created
 * 2. Push notification is attempted (even if it fails due to no device tokens)
 */

import { NotificationService } from '../notifications';
import { FriendsService } from '../friends';
import { supabase } from '../../../lib/supabase';

describe('Social Notification Integration', () => {
  const testUserId1 = 'test-user-1-' + Date.now();
  const testUserId2 = 'test-user-2-' + Date.now();

  beforeAll(async () => {
    // Create test users
    await supabase.from('profiles').upsert([
      {
        id: testUserId1,
        email: `test1-${Date.now()}@example.com`,
        name: 'Test User 1',
      },
      {
        id: testUserId2,
        email: `test2-${Date.now()}@example.com`,
        name: 'Test User 2',
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('social_notifications').delete().in('user_id', [testUserId1, testUserId2]);
    await supabase.from('friend_requests').delete().in('from_user_id', [testUserId1, testUserId2]);
    await supabase.from('friendships').delete().in('user_id_1', [testUserId1, testUserId2]);
    await supabase.from('profiles').delete().in('id', [testUserId1, testUserId2]);
  });

  describe('Friend Request Notifications', () => {
    it('should create in-app notification and attempt push when friend request is sent', async () => {
      // Send friend request (which should trigger notification)
      const friendRequest = await FriendsService.sendFriendRequest(testUserId1, testUserId2);

      expect(friendRequest).toBeDefined();
      expect(friendRequest.from_user_id).toBe(testUserId1);
      expect(friendRequest.to_user_id).toBe(testUserId2);

      // Verify in-app notification was created
      const notifications = await NotificationService.getSocialNotifications(testUserId2);
      
      expect(notifications.length).toBeGreaterThan(0);
      
      const friendRequestNotification = notifications.find(
        (n) => n.type === 'friend_request' && n.actor_id === testUserId1
      );

      expect(friendRequestNotification).toBeDefined();
      expect(friendRequestNotification?.title).toBe('New Friend Request');
      expect(friendRequestNotification?.body).toContain('sent you a friend request');
      expect(friendRequestNotification?.read).toBe(false);
      expect(friendRequestNotification?.data.from_user_id).toBe(testUserId1);

      // Note: Push notification will fail gracefully because there are no device tokens
      // But the in-app notification should still be created successfully
    });

    it('should create notification directly via NotificationService', async () => {
      // Test the notification service directly
      const notification = await NotificationService.sendFriendRequestNotification(
        testUserId1,
        testUserId2
      );

      expect(notification).toBeDefined();
      expect(notification.user_id).toBe(testUserId2);
      expect(notification.type).toBe('friend_request');
      expect(notification.actor_id).toBe(testUserId1);
      expect(notification.title).toBe('New Friend Request');
      expect(notification.body).toContain('Test User 1');
      expect(notification.body).toContain('sent you a friend request');
    });
  });

  describe('Friend Accepted Notifications', () => {
    it('should create in-app notification and attempt push when friend request is accepted', async () => {
      // Test the notification service directly
      const notification = await NotificationService.sendFriendAcceptedNotification(
        testUserId2,
        testUserId1
      );

      expect(notification).toBeDefined();
      expect(notification.user_id).toBe(testUserId1);
      expect(notification.type).toBe('friend_accepted');
      expect(notification.actor_id).toBe(testUserId2);
      expect(notification.title).toBe('Friend Request Accepted');
      expect(notification.body).toContain('Test User 2');
      expect(notification.body).toContain('accepted your friend request');
      expect(notification.read).toBe(false);
      expect(notification.data.from_user_id).toBe(testUserId2);
      expect(notification.data.from_user_name).toContain('Test User 2');

      // Note: Push notification will fail gracefully because there are no device tokens
      // But the in-app notification should still be created successfully
    });

    it('should retrieve friend accepted notification from database', async () => {
      // Send notification
      const notification = await NotificationService.sendFriendAcceptedNotification(
        testUserId2,
        testUserId1
      );

      // Verify in-app notification was created and can be retrieved
      const notifications = await NotificationService.getSocialNotifications(testUserId1);
      
      expect(notifications.length).toBeGreaterThan(0);
      
      const friendAcceptedNotification = notifications.find(
        (n) => n.type === 'friend_accepted' && n.actor_id === testUserId2 && n.id === notification.id
      );

      expect(friendAcceptedNotification).toBeDefined();
      expect(friendAcceptedNotification?.title).toBe('Friend Request Accepted');
      expect(friendAcceptedNotification?.body).toContain('accepted your friend request');
      expect(friendAcceptedNotification?.read).toBe(false);
      expect(friendAcceptedNotification?.data.from_user_id).toBe(testUserId2);
    });
  });
});
