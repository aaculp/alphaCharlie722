/**
 * Property-Based Tests for Collection Mutation Hooks
 * 
 * Feature: react-query-integration
 * Property 10: Collection mutation invalidation
 * 
 * Validates: Requirements 6.3, 6.4, 6.5
 * 
 * Tests verify that collection mutations correctly invalidate related queries
 * using property-based testing with fast-check.
 */

import fc from 'fast-check';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useFollowCollectionMutation,
  useUnfollowCollectionMutation,
} from '../useCollectionMutations';
import { useAddVenueToCollectionMutation } from '../useAddVenueToCollectionMutation';
import { CollectionsService } from '../../../services/api/collections';
import { supabase } from '../../../lib/supabase';
import { queryKeys } from '../../../lib/queryKeys';
import type { Collection } from '../../../types/social.types';
import React from 'react';

// Mock the services
jest.mock('../../../services/api/collections');
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockCollectionsService = CollectionsService as jest.Mocked<typeof CollectionsService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

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

// Helper to populate query cache with collection data
function populateCache(
  queryClient: QueryClient,
  userId: string,
  collectionId?: string,
  collections?: Collection[],
  collection?: Collection
) {
  if (collections) {
    queryClient.setQueryData(queryKeys.collections.byUser(userId), collections);
  }
  if (collection && collectionId) {
    queryClient.setQueryData(queryKeys.collections.detail(collectionId), collection);
  }
}

describe('Feature: react-query-integration, Property 10: Collection mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 6.3**
   * 
   * Property: For any add venue to collection mutation, upon success,
   * the system SHALL invalidate the affected collection query and the
   * user's collections list query.
   * 
   * This property verifies that:
   * 1. Collection detail query is invalidated to show updated venue list
   * 2. User collections query is invalidated to update venue counts
   * 3. Invalidation happens regardless of the venue or collection
   * 4. Invalidation triggers refetch of affected queries
   */
  it('should invalidate collection detail and user collections after adding venue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (collectionId, venueId, userId) => {
          // Mock service to succeed
          mockCollectionsService.addVenueToCollection.mockResolvedValue(undefined);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with collection data
          const mockCollection: Collection = {
            id: collectionId,
            user_id: userId,
            name: 'Test Collection',
            description: 'Test description',
            privacy_level: 'friends',
            cover_image_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            venue_count: 5,
            follower_count: 10,
          };

          populateCache(queryClient, userId, collectionId, [mockCollection], mockCollection);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useAddVenueToCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              collectionId,
              venueId,
              userId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Collection detail query should be invalidated
          const collectionDetailKey = queryKeys.collections.detail(collectionId);
          const detailInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(collectionDetailKey)
          );
          expect(detailInvalidated).toBe(true);

          // Property 2: User collections query should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userCollectionsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userCollectionsInvalidated).toBe(true);

          // Property 3: Invalidation should have been called exactly 2 times
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * **Validates: Requirements 6.4**
   * 
   * Property: For any create collection mutation, upon success,
   * the system SHALL invalidate the user's collections list query.
   * 
   * This property verifies that:
   * 1. User collections query is invalidated to show new collection
   * 2. Invalidation happens regardless of collection properties
   * 3. Invalidation triggers refetch of collections list
   */
  it('should invalidate user collections after creating collection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
        fc.constantFrom('public', 'friends', 'close_friends', 'private'),
        async (userId, name, description, privacy_level) => {
          const mockCollection: Collection = {
            id: 'new-collection-id',
            user_id: userId,
            name,
            description: description || null,
            privacy_level,
            cover_image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            venue_count: 0,
            follower_count: 0,
          };

          mockCollectionsService.createCollection.mockResolvedValue(mockCollection);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with existing collections
          populateCache(queryClient, userId, undefined, []);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useCreateCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              userId,
              name,
              description,
              privacy_level,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: User collections query should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userCollectionsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userCollectionsInvalidated).toBe(true);

          // Property 2: Invalidation should have been called exactly once
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * **Validates: Requirements 6.4**
   * 
   * Property: For any delete collection mutation, upon success,
   * the system SHALL invalidate the collection detail query and
   * the user's collections list query.
   * 
   * This property verifies that:
   * 1. Collection detail query is invalidated
   * 2. User collections query is invalidated to remove deleted collection
   * 3. Invalidation happens regardless of collection state
   */
  it('should invalidate collection detail and user collections after deleting collection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (collectionId, userId) => {
          mockCollectionsService.deleteCollection.mockResolvedValue(undefined);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with collection data
          const mockCollection: Collection = {
            id: collectionId,
            user_id: userId,
            name: 'Test Collection',
            description: 'Test description',
            privacy_level: 'friends',
            cover_image_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            venue_count: 5,
            follower_count: 10,
          };

          populateCache(queryClient, userId, collectionId, [mockCollection], mockCollection);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useDeleteCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              collectionId,
              userId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Collection detail query should be invalidated
          const collectionDetailKey = queryKeys.collections.detail(collectionId);
          const detailInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(collectionDetailKey)
          );
          expect(detailInvalidated).toBe(true);

          // Property 2: User collections query should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userCollectionsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userCollectionsInvalidated).toBe(true);

          // Property 3: Invalidation should have been called exactly 2 times
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * **Validates: Requirements 6.5**
   * 
   * Property: For any follow collection mutation, upon success,
   * the system SHALL invalidate the collection detail query and
   * the user's collections list query.
   * 
   * This property verifies that:
   * 1. Collection detail query is invalidated to update follower count
   * 2. User collections query is invalidated to update follow status
   * 3. Invalidation happens regardless of collection or user
   */
  it('should invalidate collection detail and user collections after following collection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (collectionId, userId) => {
          // Mock Supabase insert
          const mockInsert = jest.fn().mockReturnValue({
            error: null,
          });
          mockSupabase.from = jest.fn().mockReturnValue({
            insert: mockInsert,
          });

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with collection data
          const mockCollection: Collection = {
            id: collectionId,
            user_id: 'other-user-id',
            name: 'Test Collection',
            description: 'Test description',
            privacy_level: 'public',
            cover_image_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            venue_count: 5,
            follower_count: 10,
            is_following: false,
          };

          populateCache(queryClient, userId, collectionId, [], mockCollection);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useFollowCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              collectionId,
              userId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Collection detail query should be invalidated
          const collectionDetailKey = queryKeys.collections.detail(collectionId);
          const detailInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(collectionDetailKey)
          );
          expect(detailInvalidated).toBe(true);

          // Property 2: User collections query should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userCollectionsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userCollectionsInvalidated).toBe(true);

          // Property 3: Invalidation should have been called exactly 2 times
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * **Validates: Requirements 6.5**
   * 
   * Property: For any unfollow collection mutation, upon success,
   * the system SHALL invalidate the collection detail query and
   * the user's collections list query.
   * 
   * This property verifies that:
   * 1. Collection detail query is invalidated to update follower count
   * 2. User collections query is invalidated to update follow status
   * 3. Invalidation happens regardless of collection or user
   */
  it('should invalidate collection detail and user collections after unfollowing collection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (collectionId, userId) => {
          // Mock Supabase delete
          const mockDelete = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                error: null,
              }),
            }),
          });
          mockSupabase.from = jest.fn().mockReturnValue({
            delete: mockDelete,
          });

          const { queryClient, wrapper } = createWrapper();

          // Populate cache with collection data
          const mockCollection: Collection = {
            id: collectionId,
            user_id: 'other-user-id',
            name: 'Test Collection',
            description: 'Test description',
            privacy_level: 'public',
            cover_image_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            venue_count: 5,
            follower_count: 10,
            is_following: true,
          };

          populateCache(queryClient, userId, collectionId, [], mockCollection);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useUnfollowCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              collectionId,
              userId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property 1: Collection detail query should be invalidated
          const collectionDetailKey = queryKeys.collections.detail(collectionId);
          const detailInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(collectionDetailKey)
          );
          expect(detailInvalidated).toBe(true);

          // Property 2: User collections query should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userCollectionsInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userCollectionsInvalidated).toBe(true);

          // Property 3: Invalidation should have been called exactly 2 times
          expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);

          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 20000);

  /**
   * Property: Collection mutations should not invalidate unrelated users' queries
   * 
   * This verifies that mutations only invalidate queries for the users involved,
   * not for unrelated users.
   */
  it('should not invalidate queries for unrelated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        async (collectionId, venueId, userId, unrelatedUserId) => {
          // Ensure different user IDs
          fc.pre(userId !== unrelatedUserId);

          mockCollectionsService.addVenueToCollection.mockResolvedValue(undefined);

          const { queryClient, wrapper } = createWrapper();

          // Populate cache for both users
          const mockCollection: Collection = {
            id: collectionId,
            user_id: userId,
            name: 'Test Collection',
            description: 'Test description',
            privacy_level: 'friends',
            cover_image_url: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            venue_count: 5,
            follower_count: 10,
          };

          populateCache(queryClient, userId, collectionId, [mockCollection], mockCollection);
          populateCache(queryClient, unrelatedUserId, undefined, []);

          // Track invalidation
          const invalidatedQueries: string[][] = [];
          const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
          queryClient.invalidateQueries = jest.fn((options: any) => {
            if (options?.queryKey) {
              invalidatedQueries.push(options.queryKey);
            }
            return originalInvalidate(options);
          });

          const { result } = renderHook(() => useAddVenueToCollectionMutation(), {
            wrapper,
          });

          // Execute mutation
          act(() => {
            result.current.mutate({
              collectionId,
              venueId,
              userId,
            });
          });

          // Wait for mutation to complete
          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Property: Unrelated user's collections query should NOT be invalidated
          const unrelatedCollectionsKey = queryKeys.collections.byUser(unrelatedUserId);
          const unrelatedInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(unrelatedCollectionsKey)
          );
          expect(unrelatedInvalidated).toBe(false);

          // Property: Only the involved user's queries should be invalidated
          const userCollectionsKey = queryKeys.collections.byUser(userId);
          const userInvalidated = invalidatedQueries.some(
            (key) => JSON.stringify(key) === JSON.stringify(userCollectionsKey)
          );
          expect(userInvalidated).toBe(true);

          return true;
        }
      ),
      { numRuns: 15, timeout: 15000 }
    );
  }, 20000);
});
