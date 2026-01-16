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

  /**
   * Property 41: Friend accepted notification
   * Feature: social-push-notifications, Property 7: In-App Notification Creation
   * Validates: Requirements 4.1, 4.2
   * 
   * For any friend acceptance, a notification should be created for the original requester
   * with type 'friend_accepted'.
   */
  describe('Property 41: Friend accepted notification', () => {
    it('should create a friend_accepted notification for the original requester', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([accepterId, requesterId]) => {
          try {
            // Setup: Create test users
            await createTestUsers([accepterId, requesterId]);

            // Act: Send friend accepted notification
            const notification = await NotificationService.sendFriendAcceptedNotification(
              accepterId,
              requesterId
            );

            // Assert: Verify notification was created correctly
            expect(notification).toBeDefined();
            expect(notification.user_id).toBe(requesterId);
            expect(notification.type).toBe('friend_accepted');
            expect(notification.actor_id).toBe(accepterId);
            expect(notification.title).toBe('Friend Request Accepted');
            expect(notification.body).toContain('accepted your friend request');
            expect(notification.read).toBe(false);
            expect(notification.read_at).toBeNull();
            expect(notification.id).toBeDefined();
            expect(notification.created_at).toBeDefined();

            // Verify notification data contains correct information
            expect(notification.data).toBeDefined();
            expect(notification.data.from_user_id).toBe(accepterId);
            expect(notification.data.from_user_name).toBeDefined();

            // Verify in database
            const { data: dbNotification, error } = await supabase
              .from('social_notifications')
              .select('*')
              .eq('id', notification.id)
              .single();

            expect(error).toBeNull();
            expect(dbNotification).toBeDefined();
            expect(dbNotification?.user_id).toBe(requesterId);
            expect(dbNotification?.type).toBe('friend_accepted');
            expect(dbNotification?.actor_id).toBe(accepterId);
            expect(dbNotification?.read).toBe(false);

            // Verify requester can retrieve the notification
            const notifications = await NotificationService.getSocialNotifications(requesterId);
            const foundNotification = notifications.find((n) => n.id === notification.id);
            expect(foundNotification).toBeDefined();
            expect(foundNotification?.type).toBe('friend_accepted');

            return true;
          } finally {
            // Cleanup
            await cleanupTestData([accepterId, requesterId]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: In-App Notification Creation (Venue Share)
   * Feature: social-push-notifications, Property 7: In-App Notification Creation
   * Validates: Requirements 5.1
   * 
   * For any venue share, an in-app notification should be created in the database
   * with type 'venue_share'.
   */
  describe('Property 7: In-App Notification Creation (Venue Share)', () => {
    it('should create a venue_share notification for the recipient', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(uuidArbitrary(), uuidArbitrary(), uuidArbitrary())
            .filter(([fromUserId, toUserId, venueId]) => 
              fromUserId !== toUserId && fromUserId !== venueId && toUserId !== venueId
            ),
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          async ([fromUserId, toUserId, venueId], message) => {
            try {
              // Setup: Create test users and venue
              await createTestUsers([fromUserId, toUserId]);
              
              // Create test venue
              await supabase.from('venues').upsert({
                id: venueId,
                name: `Test Venue ${venueId.substring(0, 8)}`,
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128,
                longitude: -74.0060,
              });

              // Create venue share
              const { data: shareData, error: shareError } = await supabase
                .from('venue_shares')
                .insert({
                  from_user_id: fromUserId,
                  to_user_id: toUserId,
                  venue_id: venueId,
                  message: message,
                  viewed: false,
                })
                .select()
                .single();

              expect(shareError).toBeNull();
              expect(shareData).toBeDefined();

              // Act: Send venue share notification
              const notification = await NotificationService.sendVenueShareNotification(shareData);

              // Assert: Verify notification was created correctly
              expect(notification).toBeDefined();
              expect(notification.user_id).toBe(toUserId);
              expect(notification.type).toBe('venue_share');
              expect(notification.actor_id).toBe(fromUserId);
              expect(notification.reference_id).toBe(shareData.id);
              expect(notification.title).toBe('Venue Shared');
              expect(notification.body).toContain('shared');
              expect(notification.body).toContain('with you');
              expect(notification.read).toBe(false);
              expect(notification.id).toBeDefined();
              expect(notification.created_at).toBeDefined();

              // Verify notification data contains correct information
              expect(notification.data).toBeDefined();
              expect(notification.data.from_user_id).toBe(fromUserId);
              expect(notification.data.from_user_name).toBeDefined();
              expect(notification.data.venue_id).toBe(venueId);
              expect(notification.data.venue_name).toBeDefined();
              expect(notification.data.share_id).toBe(shareData.id);
              if (message) {
                expect(notification.data.message).toBe(message);
              }

              // Verify in database
              const { data: dbNotification, error } = await supabase
                .from('social_notifications')
                .select('*')
                .eq('id', notification.id)
                .single();

              expect(error).toBeNull();
              expect(dbNotification).toBeDefined();
              expect(dbNotification?.user_id).toBe(toUserId);
              expect(dbNotification?.type).toBe('venue_share');
              expect(dbNotification?.actor_id).toBe(fromUserId);
              expect(dbNotification?.reference_id).toBe(shareData.id);
              expect(dbNotification?.read).toBe(false);

              // Verify recipient can retrieve the notification
              const notifications = await NotificationService.getSocialNotifications(toUserId);
              const foundNotification = notifications.find((n) => n.id === notification.id);
              expect(foundNotification).toBeDefined();
              expect(foundNotification?.type).toBe('venue_share');

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([fromUserId, toUserId]);
              await supabase.from('venues').delete().eq('id', venueId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Navigation Data Inclusion (Venue Share)
   * Feature: social-push-notifications, Property 10: Navigation Data Inclusion
   * Validates: Requirements 5.6, 5.7
   * 
   * For any venue share notification, it should include the necessary data to navigate
   * to the venue detail screen when tapped.
   */
  describe('Property 10: Navigation Data Inclusion (Venue Share)', () => {
    it('should include venue_id in notification data for navigation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(uuidArbitrary(), uuidArbitrary(), uuidArbitrary())
            .filter(([fromUserId, toUserId, venueId]) => 
              fromUserId !== toUserId && fromUserId !== venueId && toUserId !== venueId
            ),
          async ([fromUserId, toUserId, venueId]) => {
            try {
              // Setup: Create test users and venue
              await createTestUsers([fromUserId, toUserId]);
              
              await supabase.from('venues').upsert({
                id: venueId,
                name: `Test Venue ${venueId.substring(0, 8)}`,
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                latitude: 40.7128,
                longitude: -74.0060,
              });

              // Create venue share
              const { data: shareData, error: shareError } = await supabase
                .from('venue_shares')
                .insert({
                  from_user_id: fromUserId,
                  to_user_id: toUserId,
                  venue_id: venueId,
                  message: null,
                  viewed: false,
                })
                .select()
                .single();

              expect(shareError).toBeNull();

              // Act: Send venue share notification
              const notification = await NotificationService.sendVenueShareNotification(shareData);

              // Assert: Verify navigation data is included
              expect(notification.data).toBeDefined();
              expect(notification.data.venue_id).toBe(venueId);
              expect(notification.data.venue_name).toBeDefined();
              expect(notification.data.venue_address).toBeDefined();
              expect(notification.data.share_id).toBe(shareData.id);
              
              // Verify all required fields for navigation are present
              expect(notification.data.from_user_id).toBe(fromUserId);
              expect(notification.data.from_user_name).toBeDefined();

              return true;
            } finally {
              // Cleanup
              await cleanupTestData([fromUserId, toUserId]);
              await supabase.from('venues').delete().eq('id', venueId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
