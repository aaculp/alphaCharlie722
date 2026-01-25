/**
 * useAddFriendMutation and useRemoveFriendMutation Hooks
 * 
 * React Query mutation hooks for managing friendships.
 * Automatically invalidates friends and activity feed queries on success.
 * 
 * Validates: Requirements 5.5
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { FriendsService } from '../../services/api/friends';
import type { FriendRequest, Friendship } from '../../types/social.types';

// ============================================================================
// Add Friend (Send Friend Request)
// ============================================================================

/**
 * Data required for sending friend request
 */
export interface SendFriendRequestData {
  fromUserId: string;
  toUserId: string;
}

/**
 * Options for useAddFriendMutation hook
 */
export interface UseAddFriendMutationOptions {
  onSuccess?: (data: FriendRequest, variables: SendFriendRequestData) => void;
  onError?: (error: Error, variables: SendFriendRequestData) => void;
}

/**
 * Send friend request
 * 
 * @param data - Friend request data
 * @returns Created friend request
 */
async function sendFriendRequest(data: SendFriendRequestData): Promise<FriendRequest> {
  const { fromUserId, toUserId } = data;
  return await FriendsService.sendFriendRequest(fromUserId, toUserId);
}

/**
 * Hook for sending friend requests
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates friends query for both users
 * - Invalidates activity feed for both users
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const sendRequest = useAddFriendMutation({
 *   onSuccess: () => {
 *     showSuccessToast('Friend request sent');
 *   },
 *   onError: (error) => {
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * sendRequest.mutate({
 *   fromUserId: currentUserId,
 *   toUserId: otherUserId,
 * });
 * ```
 */
export function useAddFriendMutation(
  options?: UseAddFriendMutationOptions
): UseMutationResult<FriendRequest, Error, SendFriendRequestData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (data, variables) => {
      // Invalidate friends queries for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.fromUserId),
        exact: true, // Only invalidate this user's friends list
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.toUserId),
        exact: true, // Only invalidate this user's friends list
      });

      // Invalidate activity feeds for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.fromUserId),
        exact: true, // Only invalidate this user's activity feed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.toUserId),
        exact: true, // Only invalidate this user's activity feed
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Send friend request error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}

// ============================================================================
// Accept Friend Request
// ============================================================================

/**
 * Data required for accepting friend request
 */
export interface AcceptFriendRequestData {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}

/**
 * Options for useAcceptFriendRequestMutation hook
 */
export interface UseAcceptFriendRequestMutationOptions {
  onSuccess?: (data: Friendship, variables: AcceptFriendRequestData) => void;
  onError?: (error: Error, variables: AcceptFriendRequestData) => void;
}

/**
 * Accept friend request
 * 
 * @param data - Accept request data
 * @returns Created friendship
 */
async function acceptFriendRequest(data: AcceptFriendRequestData): Promise<Friendship> {
  return await FriendsService.acceptFriendRequest(data.requestId);
}

/**
 * Hook for accepting friend requests
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 */
export function useAcceptFriendRequestMutation(
  options?: UseAcceptFriendRequestMutationOptions
): UseMutationResult<Friendship, Error, AcceptFriendRequestData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: (data, variables) => {
      // Invalidate friends queries for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.fromUserId),
        exact: true, // Only invalidate this user's friends list
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.toUserId),
        exact: true, // Only invalidate this user's friends list
      });

      // Invalidate activity feeds for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.fromUserId),
        exact: true, // Only invalidate this user's activity feed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.toUserId),
        exact: true, // Only invalidate this user's activity feed
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Accept friend request error:', error);
      options?.onError?.(error, variables);
    },
  });
}

// ============================================================================
// Remove Friend
// ============================================================================

/**
 * Data required for removing friend
 */
export interface RemoveFriendData {
  userId: string;
  friendId: string;
}

/**
 * Options for useRemoveFriendMutation hook
 */
export interface UseRemoveFriendMutationOptions {
  onSuccess?: (variables: RemoveFriendData) => void;
  onError?: (error: Error, variables: RemoveFriendData) => void;
}

/**
 * Remove friend
 * 
 * @param data - Remove friend data
 */
async function removeFriend(data: RemoveFriendData): Promise<void> {
  const { userId, friendId } = data;
  await FriendsService.removeFriend(userId, friendId);
}

/**
 * Hook for removing friends
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates friends query for both users
 * - Invalidates activity feed for both users
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const removeFriend = useRemoveFriendMutation({
 *   onSuccess: () => {
 *     showSuccessToast('Friend removed');
 *   },
 *   onError: (error) => {
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * removeFriend.mutate({
 *   userId: currentUserId,
 *   friendId: friendToRemoveId,
 * });
 * ```
 */
export function useRemoveFriendMutation(
  options?: UseRemoveFriendMutationOptions
): UseMutationResult<void, Error, RemoveFriendData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: (data, variables) => {
      // Invalidate friends queries for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.userId),
        exact: true, // Only invalidate this user's friends list
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.friends(variables.friendId),
        exact: true, // Only invalidate this user's friends list
      });

      // Invalidate activity feeds for both users
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.userId),
        exact: true, // Only invalidate this user's activity feed
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityFeed.byUser(variables.friendId),
        exact: true, // Only invalidate this user's activity feed
      });

      // Call custom success callback if provided
      options?.onSuccess?.(variables);
    },
    onError: (error, variables) => {
      console.error('Remove friend error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}
