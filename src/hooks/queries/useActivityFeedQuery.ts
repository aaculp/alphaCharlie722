/**
 * useActivityFeedQuery Hook
 * 
 * React Query hook for fetching activity feed with infinite scroll pagination.
 * Provides automatic caching, background refetching, and loading/error states.
 * 
 * Validates: Requirements 5.3, 13.2
 */

import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { ActivityFeedService } from '../../services/api/activityFeed';
import type {
  ActivityFeedEntry,
  ActivityFeedOptions,
  ActivityFeedResponse,
} from '../../types/social.types';

/**
 * Options for useActivityFeedQuery hook
 */
export interface UseActivityFeedQueryOptions {
  userId: string;
  enabled?: boolean;
  limit?: number;
  filter?: 'all' | 'checkins' | 'favorites' | 'collections';
}

/**
 * Fetch activity feed page
 * 
 * @param userId - ID of the user viewing the feed
 * @param options - Query options including pagination and filtering
 * @returns Activity feed response with activities and pagination info
 */
async function fetchActivityFeed(
  userId: string,
  options: ActivityFeedOptions
): Promise<ActivityFeedResponse> {
  return await ActivityFeedService.getActivityFeed(userId, options);
}

/**
 * Hook for fetching activity feed with infinite scroll pagination
 * 
 * Features:
 * - Infinite scroll pagination with useInfiniteQuery
 * - Automatic caching with 30s stale time
 * - Background refetching on window focus
 * - Loading and error state management
 * - Type-safe query key generation
 * - Activity type filtering
 * 
 * @param options - Query options including userId, filter, and enabled flag
 * @returns Infinite query result with paginated activities and states
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   isError,
 *   error,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useActivityFeedQuery({
 *   userId: 'user-123',
 *   limit: 20,
 *   filter: 'all',
 *   enabled: true,
 * });
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorMessage error={error} />;
 * 
 * const activities = data?.pages.flatMap(page => page.activities) || [];
 * 
 * return (
 *   <FlatList
 *     data={activities}
 *     renderItem={({ item }) => <ActivityItem activity={item} />}
 *     onEndReached={() => hasNextPage && fetchNextPage()}
 *     ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
 *   />
 * );
 * ```
 */
export function useActivityFeedQuery(
  options: UseActivityFeedQueryOptions
): UseInfiniteQueryResult<ActivityFeedResponse, Error> {
  const { userId, enabled = true, limit = 20, filter = 'all' } = options;

  return useInfiniteQuery({
    queryKey: queryKeys.activityFeed.byUser(userId),
    queryFn: ({ pageParam = 0 }) =>
      fetchActivityFeed(userId, {
        limit,
        offset: pageParam,
        filter,
      }),
    enabled: enabled && !!userId,
    staleTime: 30000, // 30 seconds
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Calculate next offset based on all pages loaded so far
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.activities.length,
        0
      );
      
      // Return next offset if there are more pages, otherwise undefined
      return lastPage.hasMore ? totalLoaded : undefined;
    },
  });
}
