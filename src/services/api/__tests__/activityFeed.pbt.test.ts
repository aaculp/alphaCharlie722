/**
 * Property-Based Tests for ActivityFeedService
 * 
 * These tests use fast-check to verify universal properties across many generated inputs.
 * Each test runs 100 iterations with random data to ensure correctness.
 * 
 * Feature: social-friend-system
 */

import * as fc from 'fast-check';
import { ActivityFeedService } from '../activityFeed';
import { FriendsService } from '../friends';
import { supabase } from '../../../lib/supabase';
import type { PrivacyLevel } from '../../../types/social.types';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a valid UUID v4
 */
const uuidArbitrary = () =>
  fc.uuid().map((uuid) => uuid.toLowerCase());

/**
 * Generate a privacy level
 */
const privacyLevelArbitrary = (): fc.Arbitrary<PrivacyLevel> =>
  fc.constantFrom<PrivacyLevel>('public', 'friends', 'close_friends', 'private');

/**
 * Generate an activity type
 */
const activityTypeArbitrary = () =>
  fc.constantFrom('checkin', 'favorite', 'collection_created', 'collection_updated');

/**
 * Generate an activity entry
 */
const activityArbitrary = () =>
  fc.record({
    user_id: uuidArbitrary(),
    activity_type: activityTypeArbitrary(),
    venue_id: fc.option(uuidArbitrary(), { nil: null }),
    collection_id: fc.option(uuidArbitrary(), { nil: null }),
    privacy_level: privacyLevelArbitrary(),
    metadata: fc.constant({}),
  });

/**
 * Clean up test data after each test
 */
async function cleanupTestData(userIds: string[], activityIds: string[] = []) {
  try {
    // Delete activities
    if (activityIds.length > 0) {
      await supabase
        .from('activity_feed')
        .delete()
        .in('id', activityIds);
    }

    // Delete activities by user
    if (userIds.length > 0) {
      await supabase
        .from('activity_feed')
        .delete()
        .in('user_id', userIds);
    }

    // Delete friendships
    await supabase
      .from('friendships')
      .delete()
      .in('user_id_1', userIds);

    await supabase
      .from('friendships')
      .delete()
      .in('user_id_2', userIds);

    // Delete friend requests
    await supabase
      .from('friend_requests')
      .delete()
      .in('from_user_id', userIds);

    await supabase
      .from('friend_requests')
      .delete()
      .in('to_user_id', userIds);
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

/**
 * Create a friendship between two users
 */
async function createFriendship(userId1: string, userId2: string, isCloseFriend: boolean = false) {
  const [orderedId1, orderedId2] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  await supabase.from('friendships').insert({
    user_id_1: orderedId1,
    user_id_2: orderedId2,
    is_close_friend_1: isCloseFriend && userId1 === orderedId1,
    is_close_friend_2: isCloseFriend && userId2 === orderedId1,
  });
}

/**
 * Check if a viewer has permission to see an activity based on privacy level and relationship
 */
async function hasPrivacyAccess(
  viewerId: string,
  activityUserId: string,
  privacyLevel: PrivacyLevel
): Promise<boolean> {
  // User can always see their own activities
  if (viewerId === activityUserId) {
    return true;
  }

  // Private activities are never visible to others
  if (privacyLevel === 'private') {
    return false;
  }

  // Public activities are visible to everyone
  if (privacyLevel === 'public') {
    return true;
  }

  // Check friendship status for friends and close_friends privacy
  const friendshipStatus = await FriendsService.checkFriendship(viewerId, activityUserId);

  if (privacyLevel === 'friends') {
    return friendshipStatus.type === 'friends';
  }

  if (privacyLevel === 'close_friends') {
    return friendshipStatus.type === 'friends' && friendshipStatus.isCloseFriend;
  }

  return false;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('ActivityFeedService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(120000);

  /**
   * Property 19: Activity feed privacy filtering
   * Feature: social-friend-system, Property 19: Activity feed privacy filtering
   * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6
   * 
   * For any activity feed query by a viewer, all returned activities should be
   * visible to that viewer based on the activity's privacy_level and the viewer's
   * relationship to the activity creator (friend, close friend, follower, or self).
   */
  describe('Property 19: Activity feed privacy filtering', () => {
    it('should only return activities visible to the viewer based on privacy and relationships', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(), // viewerId
          fc.array(activityArbitrary(), { minLength: 1, maxLength: 10 }), // activities
          async (viewerId, activities) => {
            const activityIds: string[] = [];
            const allUserIds = new Set<string>([viewerId]);

            try {
              // Setup: Create test users
              activities.forEach((activity) => allUserIds.add(activity.user_id));
              await createTestUsers(Array.from(allUserIds));

              // Setup: Create some friendships and close friendships
              const activityUserIds = activities.map((a) => a.user_id);
              const uniqueActivityUserIds = Array.from(new Set(activityUserIds));

              // Make viewer friends with some users (50% chance)
              for (const userId of uniqueActivityUserIds) {
                if (userId !== viewerId && Math.random() > 0.5) {
                  const isCloseFriend = Math.random() > 0.7; // 30% of friends are close friends
                  await createFriendship(viewerId, userId, isCloseFriend);
                }
              }

              // Setup: Insert activities into database
              const activityInserts = activities.map((activity) => ({
                user_id: activity.user_id,
                activity_type: activity.activity_type,
                venue_id: activity.venue_id,
                collection_id: activity.collection_id,
                group_outing_id: null,
                privacy_level: activity.privacy_level,
                metadata: activity.metadata,
              }));

              const { data: insertedActivities, error: insertError } = await supabase
                .from('activity_feed')
                .insert(activityInserts)
                .select();

              if (insertError) {
                throw new Error(`Failed to insert activities: ${insertError.message}`);
              }

              if (insertedActivities) {
                activityIds.push(...insertedActivities.map((a) => a.id));
              }

              // Act: Query activity feed as viewer
              const feedResponse = await ActivityFeedService.getActivityFeed(viewerId, {
                limit: 100,
              });

              // Assert: Verify all returned activities are visible to viewer
              for (const activity of feedResponse.activities) {
                const hasAccess = await hasPrivacyAccess(
                  viewerId,
                  activity.user_id,
                  activity.privacy_level
                );

                // If activity was returned, viewer must have access
                expect(hasAccess).toBe(true);
              }

              // Assert: Verify no activities that should be visible are missing
              // (This is harder to test comprehensively, but we can check a few cases)
              const publicActivities = activities.filter((a) => a.privacy_level === 'public');
              const ownActivities = activities.filter((a) => a.user_id === viewerId);

              // All public activities should be visible
              const returnedActivityUserIds = feedResponse.activities.map((a) => a.user_id);
              for (const publicActivity of publicActivities) {
                if (insertedActivities?.some((ia) => ia.user_id === publicActivity.user_id)) {
                  expect(returnedActivityUserIds).toContain(publicActivity.user_id);
                }
              }

              // All own activities should be visible (regardless of privacy)
              for (const ownActivity of ownActivities) {
                if (insertedActivities?.some((ia) => ia.user_id === ownActivity.user_id)) {
                  expect(returnedActivityUserIds).toContain(ownActivity.user_id);
                }
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(Array.from(allUserIds), activityIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 50: Activity feed chronological ordering
   * Feature: social-friend-system, Property 50: Activity feed chronological ordering
   * Validates: Requirements 3.1
   * 
   * For any activity feed query, activities should be returned in descending
   * order by created_at timestamp (most recent first).
   */
  describe('Property 50: Activity feed chronological ordering', () => {
    it('should return activities in descending chronological order', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(), // viewerId
          fc.array(activityArbitrary(), { minLength: 2, maxLength: 15 }), // activities
          async (viewerId, activities) => {
            const activityIds: string[] = [];
            const allUserIds = new Set<string>([viewerId]);

            try {
              // Setup: Create test users
              activities.forEach((activity) => allUserIds.add(activity.user_id));
              await createTestUsers(Array.from(allUserIds));

              // Setup: Make all activities public so they're all visible
              const publicActivities = activities.map((a) => ({
                ...a,
                privacy_level: 'public' as PrivacyLevel,
              }));

              // Setup: Insert activities with different timestamps
              const now = Date.now();
              const activityInserts = publicActivities.map((activity, index) => ({
                user_id: activity.user_id,
                activity_type: activity.activity_type,
                venue_id: activity.venue_id,
                collection_id: activity.collection_id,
                group_outing_id: null,
                privacy_level: activity.privacy_level,
                metadata: activity.metadata,
                // Create timestamps in reverse order to test sorting
                created_at: new Date(now - index * 1000).toISOString(),
              }));

              const { data: insertedActivities, error: insertError } = await supabase
                .from('activity_feed')
                .insert(activityInserts)
                .select();

              if (insertError) {
                throw new Error(`Failed to insert activities: ${insertError.message}`);
              }

              if (insertedActivities) {
                activityIds.push(...insertedActivities.map((a) => a.id));
              }

              // Act: Query activity feed
              const feedResponse = await ActivityFeedService.getActivityFeed(viewerId, {
                limit: 100,
              });

              // Assert: Verify activities are in descending chronological order
              const returnedActivities = feedResponse.activities;

              if (returnedActivities.length > 1) {
                for (let i = 0; i < returnedActivities.length - 1; i++) {
                  const currentTimestamp = new Date(returnedActivities[i].created_at).getTime();
                  const nextTimestamp = new Date(returnedActivities[i + 1].created_at).getTime();

                  // Current activity should be more recent (or equal) than next activity
                  expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
                }
              }

              return true;
            } finally {
              // Cleanup
              await cleanupTestData(Array.from(allUserIds), activityIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
