/**
 * Property-Based Tests for NotificationService
 * 
 * These tests use fast-check to verify universal properties across many generated inputs.
 * Each test runs 100 iterations with random data to ensure correctness.
 * 
 * Feature: social-friend-system
 */

import * as fc from 'fast-check';
import { NotificationService } from '../notifications';
import { FriendsService } from '../friends';
import { supabase } from '../../../lib/supabase';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a valid UUID v4
 */
const uuidArbitrary = () =>
  fc.uuid().map((uuid) => uuid.toLowerCase());

/**
 * Generate a pair of distinct user IDs
 */
const distinctUserPairArbitrary = () =>
  fc
    .tuple(uuidArbitrary(), uuidArbitrary())
    .filter(([id1, id2]) => id1 !== id2);

/**
 * Clean up test data after each test
 */
async function cleanupTestData(userIds: string[]) {
  try {
    // Delete notifications
    await supabase
      .from('social_notifications')
      .delete()
      .in('user_id', userIds);

    await supabase
      .from('social_notifications')
      .delete()
      .in('actor_id', userIds);

    // Delete notification preferences
    await supabase
      .from('notification_preferences')
      .delete()
      .in('user_id', userIds);

    // Delete friend requests
    await supabase
      .from('friend_requests')
      .delete()
      .in('from_user_id', userIds);

    await supabase
      .from('friend_requests')
      .delete()
      .in('to_user_id', userIds);

    // Delete friendships
    await supabase
      .from('friendships')
      .delete()
      .in('user_id_1', userIds);

    await supabase
      .from('friendships')
      .delete()
      .in('user_id_2', userIds);

    // Delete test profiles
    await supabase
      .from('profiles')
      .delete()
      .in('id', userIds);
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

/**
 * Create test user profiles
 */
async function createTestUsers(userIds: string[]) {
  try {
    const profiles = userIds.map((id, index) => ({
      id,
      email: `test-user-${id}@example.com`,
      name: `Test User ${index + 1}`,
    }));

    await supabase.from('profiles').upsert(profiles);
  } catch (error) {
    console.warn('User creation warning:', error);
  }
}

// ============================================================================
// Property Tests
// ============================================================================

describe('NotificationService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 40: Friend request notification
   * Feature: social-friend-system, Property 40: Friend request notification
   * Validates: Requirements 9.1
   * 
   * For any friend request, a notification should be created for the recipient
   * with type 'friend_request'.
   */
  describe('Property 40: Friend request notification', () => {
    it('should create a friend_request notification for the recipient', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([fromUserId, toUserId]) => {
          try {
            // Setup: Create test users
            await createTestUsers([fromUserId, toUserId]);

            // Act: Send friend request notification
            const notification = await NotificationService.sendFriendRequestNotification(
              fromUserId,
              toUserId
            );

            // Assert: Verify notification was created correctly
            expect(notification).toBeDefined();
            expect(notification.user_id).toBe(toUserId);
            expect(notification.type).toBe('friend_request');
            expect(notification.actor_id).toBe(fromUserId);
            expect(notification.title).toBe('New Friend Request');
            expect(notification.body).toContain('sent you a friend request');
            expect(notification.read).toBe(false);
            expect(notification.read_at).toBeNull();
            expect(notification.id).toBeDefined();
            expect(notification.created_at).toBeDefined();

            // Verify notification data contains correct information
            expect(notification.data).toBeDefined();
            expect(notification.data.from_user_id).toBe(fromUserId);
            expect(notification.data.from_user_name).toBeDefined();

            // Verify in database
            const { data: dbNotification, error } = await supabase
              .from('social_notifications')
              .select('*')
              .eq('id', notification.id)
              .single();

            expect(error).toBeNull();
            expect(dbNotification).toBeDefined();
            expect(dbNotification?.user_id).toBe(toUserId);
            expect(dbNotification?.type).toBe('friend_request');
            expect(dbNotification?.actor_id).toBe(fromUserId);
            expect(dbNotification?.read).toBe(false);

            // Verify recipient can retrieve the notification
            const notifications = await NotificationService.getSocialNotifications(toUserId);
            const foundNotification = notifications.find((n) => n.id === notification.id);
            expect(foundNotification).toBeDefined();
            expect(foundNotification?.type).toBe('friend_request');

            return true;
          } finally {
            // Cleanup
            await cleanupTestData([fromUserId, toUserId]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
