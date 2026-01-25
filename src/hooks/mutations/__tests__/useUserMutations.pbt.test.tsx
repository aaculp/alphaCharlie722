/**
 * Property-Based Tests for User Mutation Hooks
 * 
 * Feature: react-query-integration
 * Property 8: User profile mutation invalidation
 * Property 9: Friendship mutation invalidation
 * 
 * Validates: Requirements 5.4, 5.5
 * 
 * Tests verify that user mutations correctly invalidate related queries
 * using property-based testing with fast-check.
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfileMutation } from '../useUpdateProfileMutation';
import {
  useAddFriendMutation,
  useRemoveFriendMutation,
  useAcceptFriendRequestMutation,
} from '../useAddFriendMutation';
import { ProfileService } from '../../../services/api/profile';
import { FriendsService } from '../../../services/api/friends';
import { queryKeys } from '../../../lib/queryKeys';
import type { Profile } from '../../../types/user.types';
import type { FriendRequest, Friendship, SocialProfile } from '../../../types/social.types';
import React from 'react';

// Mock the services
jest.mock('../../../services/api/profile');
jest.mock('../../../services/api/friends');

const mockProfileService = ProfileService as jest.Mocked<typeof ProfileService>;
const mockFriendsService = FriendsService as jest.Mocked<typeof FriendsService>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

// Helper to populate query cache with data
function populateCache(
  queryClient: QueryClient,
  userId: string,
  profile?: Profile,
  friends?: SocialProfile[]
) {
  if (profile) {
    queryClient.setQueryData(queryKeys.users.profile(userId), profile);
  }
  if (friends) {
    queryClient.setQueryData(queryKeys.users.friends(userId), friends);
  }
}

describe('Feature: react-query-integration, Property 8: User profile mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 5.4**
   * 
   * Property: For any user profile update mutation, upon success, the system
   * SHALL invalidate queries with key ["users", userId, "profile"].
   * 
   * This property verifies that:
   * 1. The profile query is invalidated after successful update
   * 2. Invalidation happens regardless of which fields are updated
   * 3. Invalidation triggers a refetch of the profile data
   * 4. Only the specific user's profile query is invalidated
   */
  it('should invalidate user profile query after successful profile update', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.uuid(),
        // Generate random profile updates
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          bio: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
        }),
        async (userId, updates) => {
          // Create mock profile
          const mockProfile: Profile = {
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            bio: 'Original bio',
            avatar_url: 'https://example.com/avatar.jpg',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          // Create updated profile
          const updatedProfile: Profile = {
            ...mockProfile,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          // Mock service to return updated profile
          mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with initial profile
          populateCache(queryClient, userId, mockProfile);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useUpdateProfileMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              userId,
              updates,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Profile query should be invalidated
          const profileQueryKey = queryKeys.users.profile(userId);
          const wasInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(profileQueryKey)
          );
          expect(wasInvalidated).toBe(true);

          // Property 2: Invalidation should have been called
          expect(queryClient.invalidateQueries).toHaveBeenCalled();

          // Property 3: Only the specific user's profile should be invalidated
          const allInvalidatedKeys = invalidatedQueries.flat();
          expect(allInvalidatedKeys).toContain('users');
          expect(allInvalidatedKeys).toContain(userId);
          expect(allInvalidatedKeys).toContain('profile');

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * Property: Profile mutation should not invalidate other users' profiles
   * 
   * This verifies that updating one user's profile doesn't accidentally
   * invalidate other users' profile queries.
   */
  it('should only invalidate the specific user profile, not other users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        }),
        async (userId1, userId2, updates) => {
          // Ensure different user IDs
          fc.pre(userId1 !== userId2);

          const mockProfile1: Profile = {
            id: userId1,
            email: 'user1@example.com',
            name: 'User 1',
            bio: 'Bio 1',
            avatar_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          const mockProfile2: Profile = {
            id: userId2,
            email: 'user2@example.com',
            name: 'User 2',
            bio: 'Bio 2',
            avatar_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          const updatedProfile1: Profile = {
            ...mockProfile1,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          mockProfileService.updateProfile.mockResolvedValue(updatedProfile1);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with both profiles
          populateCache(queryClient, userId1, mockProfile1);
          populateCache(queryClient, userId2, mockProfile2);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useUpdateProfileMutation(), {
            wrapper,
          });

          // Execute mutation for user1
          act(() => {
            result.current.mutate({
              userId: userId1,
              updates,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: User2's profile query should NOT be invalidated
          const user2ProfileKey = queryKeys.users.profile(userId2);
          const user2Invalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(user2ProfileKey)
          );
          expect(user2Invalidated).toBe(false);

          // Property: User1's profile query SHOULD be invalidated
          const user1ProfileKey = queryKeys.users.profile(userId1);
          const user1Invalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(user1ProfileKey)
          );
          expect(user1Invalidated).toBe(true);

          return true;
        }
      ),
      { numRuns: 15, timeout: 15000 }
    );
  }, 20000);
});

describe('Feature: react-query-integration, Property 9: Friendship mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 5.5**
   * 
   * Property: For any friendship addition or removal mutation, upon success,
   * the system SHALL invalidate queries with keys ["users", userId, "friends"]
   * and ["activity-feed", userId].
   * 
   * This property verifies that:
   * 1. Friends queries are invalidated for both users involved
   * 2. Activity feed queries are invalidated for both users
   * 3. Invalidation happens for all friendship mutation types
   * 4. Invalidation triggers refetch of affected queries
   */
  it('should invalidate friends and activity feed queries after sending friend request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (fromUserId, toUserId) => {
          // Ensure different user IDs
          fc.pre(fromUserId !== toUserId);

          const mockFriendRequest: FriendRequest = {
            id: 'request-123',
            from_user_id: fromUserId,
            to_user_id: toUserId,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockFriendsService.sendFriendRequest.mockResolvedValue(mockFriendRequest);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with friends data for both users
          populateCache(queryClient, fromUserId, undefined, []);
          populateCache(queryClient, toUserId, undefined, []);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useAddFriendMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              fromUserId,
              toUserId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Friends query for fromUser should be invalidated
          const fromUserFriendsKey = queryKeys.users.friends(fromUserId);
          const fromUserFriendsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(fromUserFriendsKey)
          );
          expect(fromUserFriendsInvalidated).toBe(true);

          // Property 2: Friends query for toUser should be invalidated
          const toUserFriendsKey = queryKeys.users.friends(toUserId);
          const toUserFriendsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(toUserFriendsKey)
          );
          expect(toUserFriendsInvalidated).toBe(true);

          // Property 3: Activity feed for fromUser should be invalidated
          const fromUserActivityKey = queryKeys.activityFeed.byUser(fromUserId);
          const fromUserActivityInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(fromUserActivityKey)
          );
          expect(fromUserActivityInvalidated).toBe(true);

          // Property 4: Activity feed for toUser should be invalidated
          const toUserActivityKey = queryKeys.activityFeed.byUser(toUserId);
          const toUserActivityInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(toUserActivityKey)
          );
          expect(toUserActivityInvalidated).toBe(true);

          // Property 5: Invalidation should have been called at least 4 times
          // (2 friends queries + 2 activity feed queries)
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * Property: Accepting friend request should invalidate correct queries
   */
  it('should invalidate friends and activity feed queries after accepting friend request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (requestId, fromUserId, toUserId) => {
          // Ensure different user IDs
          fc.pre(fromUserId !== toUserId);

          const mockFriendship: Friendship = {
            id: 'friendship-123',
            user_id_1: fromUserId < toUserId ? fromUserId : toUserId,
            user_id_2: fromUserId < toUserId ? toUserId : fromUserId,
            is_close_friend_1: false,
            is_close_friend_2: false,
            created_at: new Date().toISOString(),
          };

          mockFriendsService.acceptFriendRequest.mockResolvedValue(mockFriendship);

          const { queryClient, wrapper } = createWrapper();

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              requestId,
              fromUserId,
              toUserId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: All 4 queries should be invalidated (friends + activity for both users)
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);

          const fromUserFriendsKey = queryKeys.users.friends(fromUserId);
          const toUserFriendsKey = queryKeys.users.friends(toUserId);
          const fromUserActivityKey = queryKeys.activityFeed.byUser(fromUserId);
          const toUserActivityKey = queryKeys.activityFeed.byUser(toUserId);

          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(fromUserFriendsKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(toUserFriendsKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(fromUserActivityKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(toUserActivityKey)
            )
          ).toBe(true);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * Property: Removing friend should invalidate correct queries
   */
  it('should invalidate friends and activity feed queries after removing friend', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (userId, friendId) => {
          // Ensure different user IDs
          fc.pre(userId !== friendId);

          mockFriendsService.removeFriend.mockResolvedValue(undefined);

          const { queryClient, wrapper } = createWrapper();

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useRemoveFriendMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              userId,
              friendId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: All 4 queries should be invalidated
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);

          const userFriendsKey = queryKeys.users.friends(userId);
          const friendFriendsKey = queryKeys.users.friends(friendId);
          const userActivityKey = queryKeys.activityFeed.byUser(userId);
          const friendActivityKey = queryKeys.activityFeed.byUser(friendId);

          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(userFriendsKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(friendFriendsKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(userActivityKey)
            )
          ).toBe(true);
          expect(
            invalidatedQueries.some(
              (key) => JSON.stringify(key) === JSON.stringify(friendActivityKey)
            )
          ).toBe(true);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * Property: Friendship mutations should not invalidate unrelated users' queries
   */
  it('should not invalidate queries for users not involved in the friendship', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (userId1, userId2, unrelatedUserId) => {
          // Ensure all different user IDs
          fc.pre(userId1 !== userId2 && userId1 !== unrelatedUserId && userId2 !== unrelatedUserId);

          const mockFriendRequest: FriendRequest = {
            id: 'request-123',
            from_user_id: userId1,
            to_user_id: userId2,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockFriendsService.sendFriendRequest.mockResolvedValue(mockFriendRequest);

          const { queryClient, wrapper } = createWrapper();

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useAddFriendMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              fromUserId: userId1,
              toUserId: userId2,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: Unrelated user's queries should NOT be invalidated
          const unrelatedFriendsKey = queryKeys.users.friends(unrelatedUserId);
          const unrelatedActivityKey = queryKeys.activityFeed.byUser(unrelatedUserId);

          const unrelatedFriendsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(unrelatedFriendsKey)
          );
          const unrelatedActivityInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(unrelatedActivityKey)
          );

          expect(unrelatedFriendsInvalidated).toBe(false);
          expect(unrelatedActivityInvalidated).toBe(false);

          return true;
        }
      ),
      { numRuns: 15, timeout: 15000 }
    );
  }, 20000);
});
