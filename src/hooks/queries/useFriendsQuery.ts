/**
 * useFriendsQuery Hook
 * 
 * React Query hook for fetching a user's friends list.
 * Provides automatic caching, background refetching, and loading/error states.
 * 
 * Validates: Requirements 5.2
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { FriendsService } from '../../services/api/friends';
import type { SocialProfile, PaginationOptions } from '../../types/social.types';

/**
 * Options for useFriendsQuery hook
 */
export interface UseFriendsQueryOptions extends PaginationOptions {
  userId: string;
  enabled?: boolean;
}

/**
 * Fetch friends list for a user
 * 
 * @param userId - ID of the user whose friends to fetch
 * @param options - Pagination options
 * @returns Array of social profiles for friends
 */
async function fetchFriends(
  userId: string,
  options?: PaginationOptions
): Promise<SocialProfile[]> {
  return await FriendsService.getFriends(userId, options);
}

/**
 * Hook for fetching a user's friends list
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetching on window focus
 * - Loading and error state management
 * - Type-safe query key generation
 * - Pagination support
 * 
 * @param options - Query options including userId, pagination, and enabled flag
 * @returns Query result with friends array and states
 * 
 * @example
 * ```tsx
 * const { data: friends, isLoading, isError, error, refetch } = useFriendsQuery({
 *   userId: 'user-123',
 *   limit: 50,
 *   offset: 0,
 *   enabled: true,
 * });
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * if (!friends || friends.length === 0) return <EmptyState />;
 * 
 * return <FriendsList friends={friends} />;
 * ```
 */
export function useFriendsQuery(
  options: UseFriendsQueryOptions
): UseQueryResult<SocialProfile[], Error> {
  const { userId, enabled = true, limit, offset } = options;

  return useQuery({
    queryKey: queryKeys.users.friends(userId),
    queryFn: () => fetchFriends(userId, { limit, offset }),
    enabled: enabled && !!userId,
    staleTime: 30000, // 30 seconds
  });
}
