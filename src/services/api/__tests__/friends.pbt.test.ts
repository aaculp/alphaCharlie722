/**
 * Property-Based Tests for FriendsService
 * 
 * These tests use fast-check to verify universal properties across many generated inputs.
 * Each test runs 100 iterations with random data to ensure correctness.
 * 
 * Feature: social-friend-system
 */

import * as fc from 'fast-check';
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

describe('FriendsService Property-Based Tests', () => {
  // Increase timeout for property tests
  jest.setTimeout(60000);

  /**
   * Property 1: Friend request creation
   * Feature: social-friend-system, Property 1: Friend request creation
   * Validates: Requirements 1.2
   * 
   * For any two distinct users, when a friend request is sent,
   * a pending friend_request record should be created with the correct
   * from_user_id and to_user_id.
   */
  describe('Property 1: Friend request creation', () => {
    it('should create a pending friend request with correct user IDs', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([fromUserId, toUserId]) => {
          try {
            // Setup: Create test users
            await createTestUsers([fromUserId, toUserId]);

            // Act: Send friend request
            const friendRequest = await FriendsService.sendFriendRequest(
              fromUserId,
              toUserId
            );

            // Assert: Verify friend request was created correctly
            expect(friendRequest).toBeDefined();
            expect(friendRequest.from_user_id).toBe(fromUserId);
            expect(friendRequest.to_user_id).toBe(toUserId);
            expect(friendRequest.status).toBe('pending');
            expect(friendRequest.id).toBeDefined();
            expect(friendRequest.created_at).toBeDefined();

            // Verify in database
            const { data: dbRequest, error } = await supabase
              .from('friend_requests')
              .select('*')
              .eq('id', friendRequest.id)
              .single();

            expect(error).toBeNull();
            expect(dbRequest).toBeDefined();
            expect(dbRequest?.from_user_id).toBe(fromUserId);
            expect(dbRequest?.to_user_id).toBe(toUserId);
            expect(dbRequest?.status).toBe('pending');

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
   * Property 2: No duplicate friend requests
   * Feature: social-friend-system, Property 2: No duplicate friend requests
   * Validates: Requirements 1.8
   * 
   * For any two users, attempting to create multiple friend requests
   * between them should result in only one pending request existing.
   */
  describe('Property 2: No duplicate friend requests', () => {
    it('should prevent duplicate friend requests between same users', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([fromUserId, toUserId]) => {
          try {
            // Setup: Create test users
            await createTestUsers([fromUserId, toUserId]);

            // Act: Send first friend request
            const firstRequest = await FriendsService.sendFriendRequest(
              fromUserId,
              toUserId
            );

            expect(firstRequest).toBeDefined();

            // Act: Attempt to send duplicate friend request
            let duplicateError: Error | null = null;
            try {
              await FriendsService.sendFriendRequest(fromUserId, toUserId);
            } catch (error) {
              duplicateError = error as Error;
            }

            // Assert: Second request should fail
            expect(duplicateError).toBeDefined();
            expect(duplicateError?.message).toContain('already');

            // Verify only one pending request exists in database
            const { data: requests, error } = await supabase
              .from('friend_requests')
              .select('*')
              .eq('from_user_id', fromUserId)
              .eq('to_user_id', toUserId)
              .eq('status', 'pending');

            expect(error).toBeNull();
            expect(requests).toBeDefined();
            expect(requests?.length).toBe(1);

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
   * Property 3: No self-friend requests
   * Feature: social-friend-system, Property 3: No self-friend requests
   * Validates: Requirements 1.9
   * 
   * For any user, attempting to send a friend request to themselves
   * should be rejected.
   */
  describe('Property 3: No self-friend requests', () => {
    it('should reject friend requests to self', async () => {
      await fc.assert(
        fc.asyncProperty(uuidArbitrary(), async (userId) => {
          try {
            // Setup: Create test user
            await createTestUsers([userId]);

            // Act: Attempt to send friend request to self
            let selfRequestError: Error | null = null;
            try {
              await FriendsService.sendFriendRequest(userId, userId);
            } catch (error) {
              selfRequestError = error as Error;
            }

            // Assert: Request should be rejected
            expect(selfRequestError).toBeDefined();
            expect(selfRequestError?.message).toContain('yourself');

            // Verify no self-friend request exists in database
            const { data: requests, error } = await supabase
              .from('friend_requests')
              .select('*')
              .eq('from_user_id', userId)
              .eq('to_user_id', userId);

            expect(error).toBeNull();
            expect(requests).toBeDefined();
            expect(requests?.length).toBe(0);

            return true;
          } finally {
            // Cleanup
            await cleanupTestData([userId]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Friendship removal is bidirectional
   * Feature: social-friend-system, Property 6: Friendship removal is bidirectional
   * Validates: Requirements 1.7
   * 
   * For any friendship, when one user removes the friend,
   * the friendship should be deleted for both users.
   */
  describe('Property 6: Friendship removal is bidirectional', () => {
    it('should remove friendship for both users when one removes the other', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([userId1, userId2]) => {
          try {
            // Setup: Create test users
            await createTestUsers([userId1, userId2]);

            // Setup: Create a friendship
            const [orderedId1, orderedId2] =
              userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

            await supabase.from('friendships').insert({
              user_id_1: orderedId1,
              user_id_2: orderedId2,
              is_close_friend_1: false,
              is_close_friend_2: false,
            });

            // Verify friendship exists
            const { data: beforeRemoval } = await supabase
              .from('friendships')
              .select('*')
              .eq('user_id_1', orderedId1)
              .eq('user_id_2', orderedId2)
              .single();

            expect(beforeRemoval).toBeDefined();

            // Act: Remove friend from one side
            await FriendsService.removeFriend(userId1, userId2);

            // Assert: Friendship should not exist for either user
            const { data: afterRemoval, error } = await supabase
              .from('friendships')
              .select('*')
              .eq('user_id_1', orderedId1)
              .eq('user_id_2', orderedId2)
              .maybeSingle();

            expect(error).toBeNull();
            expect(afterRemoval).toBeNull();

            // Verify neither user sees the other as a friend
            const status1 = await FriendsService.checkFriendship(userId1, userId2);
            const status2 = await FriendsService.checkFriendship(userId2, userId1);

            expect(status1.type).toBe('none');
            expect(status2.type).toBe('none');

            return true;
          } finally {
            // Cleanup
            await cleanupTestData([userId1, userId2]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Close friend designation
   * Feature: social-friend-system, Property 7: Close friend designation
   * Validates: Requirements 1.10, 1.13
   * 
   * For any friendship, when a user designates the friend as close,
   * the appropriate close_friend flag should be set without affecting
   * the other user's designation.
   */
  describe('Property 7: Close friend designation', () => {
    it('should set close friend flag correctly without affecting other user', async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserPairArbitrary(), async ([userId1, userId2]) => {
          try {
            // Setup: Create test users
            await createTestUsers([userId1, userId2]);

            // Setup: Create a friendship
            const [orderedId1, orderedId2] =
              userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

            await supabase.from('friendships').insert({
              user_id_1: orderedId1,
              user_id_2: orderedId2,
              is_close_friend_1: false,
              is_close_friend_2: false,
            });

            // Act: User1 designates User2 as close friend
            await FriendsService.addCloseFriend(userId1, userId2);

            // Assert: Verify close friend flag is set correctly
            const { data: friendship, error } = await supabase
              .from('friendships')
              .select('*')
              .eq('user_id_1', orderedId1)
              .eq('user_id_2', orderedId2)
              .single();

            expect(error).toBeNull();
            expect(friendship).toBeDefined();

            // Check which flag should be set based on user order
            if (userId1 === orderedId1) {
              expect(friendship?.is_close_friend_1).toBe(true);
              expect(friendship?.is_close_friend_2).toBe(false);
            } else {
              expect(friendship?.is_close_friend_1).toBe(false);
              expect(friendship?.is_close_friend_2).toBe(true);
            }

            // Verify using service method
            const isClose1to2 = await FriendsService.isCloseFriend(userId1, userId2);
            const isClose2to1 = await FriendsService.isCloseFriend(userId2, userId1);

            expect(isClose1to2).toBe(true);
            expect(isClose2to1).toBe(false);

            return true;
          } finally {
            // Cleanup
            await cleanupTestData([userId1, userId2]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
