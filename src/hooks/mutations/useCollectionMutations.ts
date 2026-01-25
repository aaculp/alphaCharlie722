/**
 * useCollectionMutations Hooks
 * 
 * React Query mutation hooks for collection operations:
 * - Create collection
 * - Delete collection
 * - Follow collection
 * - Unfollow collection
 * 
 * Automatically invalidates appropriate queries for each mutation type.
 * 
 * Validates: Requirements 6.4, 6.5
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { CollectionsService } from '../../services/api/collections';
import { supabase } from '../../lib/supabase';
import type { Collection, CollectionCreate } from '../../types/social.types';

// ============================================================================
// Create Collection Mutation
// ============================================================================

/**
 * Data required for creating a collection
 */
export interface CreateCollectionData {
  userId: string;
  name: string;
  description?: string;
  privacy_level?: 'public' | 'friends' | 'close_friends' | 'private';
}

/**
 * Options for useCreateCollectionMutation hook
 */
export interface UseCreateCollectionMutationOptions {
  onSuccess?: (data: Collection, variables: CreateCollectionData) => void;
  onError?: (error: Error, variables: CreateCollectionData) => void;
}

/**
 * Create a new collection
 * 
 * @param data - Collection creation data
 * @returns The created collection
 */
async function createCollection(data: CreateCollectionData): Promise<Collection> {
  const collectionData: CollectionCreate = {
    user_id: data.userId,
    name: data.name,
    description: data.description,
    privacy_level: data.privacy_level,
  };
  
  return await CollectionsService.createCollection(collectionData);
}

/**
 * Hook for creating a new collection
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates user collections list query to show new collection
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const createCollection = useCreateCollectionMutation({
 *   onSuccess: (collection) => {
 *     console.log('Collection created:', collection);
 *     showSuccessToast('Collection created successfully');
 *   },
 *   onError: (error) => {
 *     console.error('Create failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Create collection
 * createCollection.mutate({
 *   userId: 'user-123',
 *   name: 'My Favorite Cafes',
 *   description: 'Best coffee spots in town',
 *   privacy_level: 'friends',
 * });
 * ```
 */
export function useCreateCollectionMutation(
  options?: UseCreateCollectionMutationOptions
): UseMutationResult<Collection, Error, CreateCollectionData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: (data, variables) => {
      // Invalidate user collections query to show new collection
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.byUser(variables.userId),
        exact: true, // Only invalidate this user's collections
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Create collection error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}

// ============================================================================
// Delete Collection Mutation
// ============================================================================

/**
 * Data required for deleting a collection
 */
export interface DeleteCollectionData {
  collectionId: string;
  userId: string;
}

/**
 * Options for useDeleteCollectionMutation hook
 */
export interface UseDeleteCollectionMutationOptions {
  onSuccess?: (data: void, variables: DeleteCollectionData) => void;
  onError?: (error: Error, variables: DeleteCollectionData) => void;
}

/**
 * Delete a collection
 * 
 * @param data - Collection deletion data
 * @returns void on success
 */
async function deleteCollection(data: DeleteCollectionData): Promise<void> {
  await CollectionsService.deleteCollection(data.collectionId);
}

/**
 * Hook for deleting a collection
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates collection detail query for the deleted collection
 * - Invalidates user collections list query to remove deleted collection
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const deleteCollection = useDeleteCollectionMutation({
 *   onSuccess: () => {
 *     console.log('Collection deleted');
 *     showSuccessToast('Collection deleted successfully');
 *   },
 *   onError: (error) => {
 *     console.error('Delete failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Delete collection
 * deleteCollection.mutate({
 *   collectionId: 'collection-123',
 *   userId: 'user-456',
 * });
 * ```
 */
export function useDeleteCollectionMutation(
  options?: UseDeleteCollectionMutationOptions
): UseMutationResult<void, Error, DeleteCollectionData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: (data, variables) => {
      // Invalidate collection detail query
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
        exact: true, // Only invalidate this specific collection
      });

      // Invalidate user collections query to remove deleted collection
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.byUser(variables.userId),
        exact: true, // Only invalidate this user's collections
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Delete collection error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}

// ============================================================================
// Follow Collection Mutation
// ============================================================================

/**
 * Data required for following a collection
 */
export interface FollowCollectionData {
  collectionId: string;
  userId: string;
}

/**
 * Options for useFollowCollectionMutation hook
 */
export interface UseFollowCollectionMutationOptions {
  onSuccess?: (data: void, variables: FollowCollectionData) => void;
  onError?: (error: Error, variables: FollowCollectionData) => void;
}

/**
 * Follow a collection
 * 
 * @param data - Follow data including collectionId and userId
 * @returns void on success
 */
async function followCollection(data: FollowCollectionData): Promise<void> {
  const { error } = await supabase
    .from('collection_follows')
    .insert({
      collection_id: data.collectionId,
      user_id: data.userId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to follow collection: ${error.message}`);
  }
}

/**
 * Hook for following a collection
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates collection detail query to update follower count and follow status
 * - Invalidates user collections query to update followed collections
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const followCollection = useFollowCollectionMutation({
 *   onSuccess: () => {
 *     console.log('Collection followed');
 *     showSuccessToast('Following collection');
 *   },
 *   onError: (error) => {
 *     console.error('Follow failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Follow collection
 * followCollection.mutate({
 *   collectionId: 'collection-123',
 *   userId: 'user-456',
 * });
 * ```
 */
export function useFollowCollectionMutation(
  options?: UseFollowCollectionMutationOptions
): UseMutationResult<void, Error, FollowCollectionData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followCollection,
    onSuccess: (data, variables) => {
      // Invalidate collection detail query to update follower count
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
        exact: true, // Only invalidate this specific collection
      });

      // Invalidate user collections query to update follow status
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.byUser(variables.userId),
        exact: true, // Only invalidate this user's collections
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Follow collection error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}

// ============================================================================
// Unfollow Collection Mutation
// ============================================================================

/**
 * Data required for unfollowing a collection
 */
export interface UnfollowCollectionData {
  collectionId: string;
  userId: string;
}

/**
 * Options for useUnfollowCollectionMutation hook
 */
export interface UseUnfollowCollectionMutationOptions {
  onSuccess?: (data: void, variables: UnfollowCollectionData) => void;
  onError?: (error: Error, variables: UnfollowCollectionData) => void;
}

/**
 * Unfollow a collection
 * 
 * @param data - Unfollow data including collectionId and userId
 * @returns void on success
 */
async function unfollowCollection(data: UnfollowCollectionData): Promise<void> {
  const { error } = await supabase
    .from('collection_follows')
    .delete()
    .eq('collection_id', data.collectionId)
    .eq('user_id', data.userId);

  if (error) {
    throw new Error(`Failed to unfollow collection: ${error.message}`);
  }
}

/**
 * Hook for unfollowing a collection
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates collection detail query to update follower count and follow status
 * - Invalidates user collections query to update followed collections
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const unfollowCollection = useUnfollowCollectionMutation({
 *   onSuccess: () => {
 *     console.log('Collection unfollowed');
 *     showSuccessToast('Unfollowed collection');
 *   },
 *   onError: (error) => {
 *     console.error('Unfollow failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Unfollow collection
 * unfollowCollection.mutate({
 *   collectionId: 'collection-123',
 *   userId: 'user-456',
 * });
 * ```
 */
export function useUnfollowCollectionMutation(
  options?: UseUnfollowCollectionMutationOptions
): UseMutationResult<void, Error, UnfollowCollectionData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowCollection,
    onSuccess: (data, variables) => {
      // Invalidate collection detail query to update follower count
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
        exact: true, // Only invalidate this specific collection
      });

      // Invalidate user collections query to update follow status
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.byUser(variables.userId),
        exact: true, // Only invalidate this user's collections
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Unfollow collection error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}
