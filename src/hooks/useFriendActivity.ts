import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFeedService } from '../services/api/activityFeed';
import type {
  ActivityFeedEntry,
  ActivityFeedOptions,
  ActivityFeedResponse,
} from '../types/social.types';

export interface UseFriendActivityOptions {
  autoLoad?: boolean;
  limit?: number;
  filter?: 'all' | 'checkins' | 'favorites' | 'collections';
}

export interface UseFriendActivityReturn {
  activities: ActivityFeedEntry[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing friend activity feed
 * 
 * @param options - Configuration options
 * @returns Activity feed data, loading states, error state, and pagination functions
 * 
 * @example
 * ```tsx
 * const {
 *   activities,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   refetch,
 * } = useFriendActivity({
 *   limit: 20,
 *   filter: 'checkins',
 * });
 * 
 * // Load more activities
 * if (hasMore && !loading) {
 *   await loadMore();
 * }
 * 
 * // Refresh the feed
 * await refetch();
 * ```
 */
export function useFriendActivity(
  options: UseFriendActivityOptions = {}
): UseFriendActivityReturn {
  const { autoLoad = true, limit = 50, filter = 'all' } = options;
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);

  // Load activity feed
  const loadActivityFeed = useCallback(
    async (isLoadMore: boolean = false) => {
      if (!user?.id) {
        setActivities([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const currentOffset = isLoadMore ? offset : 0;

        const feedOptions: ActivityFeedOptions = {
          limit,
          offset: currentOffset,
          filter,
        };

        const response: ActivityFeedResponse = await ActivityFeedService.getActivityFeed(
          user.id,
          feedOptions
        );

        if (isLoadMore) {
          // Append to existing activities
          setActivities((prev) => [...prev, ...response.activities]);
        } else {
          // Replace activities
          setActivities(response.activities);
        }

        setHasMore(response.hasMore);
        setTotal(response.total);
        setOffset(currentOffset + response.activities.length);
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error('Failed to load activity feed');
        setError(loadError);
        console.error('Error loading activity feed:', loadError);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, limit, filter, offset]
  );

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadActivityFeed(false);
    }
  }, [autoLoad, filter]); // Re-load when filter changes

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }

    await loadActivityFeed(true);
  }, [hasMore, loadingMore, loading, loadActivityFeed]);

  // Refetch activity feed (reset to first page)
  const refetch = useCallback(async () => {
    setOffset(0);
    await loadActivityFeed(false);
  }, [loadActivityFeed]);

  return {
    activities,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refetch,
  };
}
