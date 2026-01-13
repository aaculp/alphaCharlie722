import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckInService } from '../services/api/checkins';
import type { CheckInWithVenue } from '../types';

export interface UseCheckInHistoryOptions {
  userId?: string;
  enabled?: boolean;
  daysBack?: number;
}

export interface UseCheckInHistoryReturn {
  checkIns: CheckInWithVenue[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching user's check-in history
 * 
 * @param options - Options including userId, enabled flag, and daysBack filter
 * @returns Check-in history data, loading states, and pagination functions
 * 
 * @example
 * ```tsx
 * const { checkIns, loading, refetch, loadMore, hasMore } = useCheckInHistory({
 *   enabled: true,
 *   daysBack: 30
 * });
 * ```
 */
export function useCheckInHistory(options: UseCheckInHistoryOptions = {}): UseCheckInHistoryReturn {
  const { userId: providedUserId, enabled = true, daysBack = 30 } = options;
  const { user } = useAuth();
  
  // Use provided userId or fall back to authenticated user
  const userId = providedUserId || user?.id;
  
  const [checkIns, setCheckIns] = useState<CheckInWithVenue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);

  const fetchCheckIns = useCallback(async (isRefresh: boolean = false, isLoadMore: boolean = false) => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      const currentOffset = isRefresh ? 0 : offset;
      
      const response = await CheckInService.getUserCheckInHistory({
        userId,
        limit: 50,
        offset: currentOffset,
        daysBack
      });

      if (isRefresh) {
        // Replace all check-ins on refresh
        setCheckIns(response.checkIns);
        setOffset(response.checkIns.length);
      } else if (isLoadMore) {
        // Append check-ins on load more
        setCheckIns(prev => [...prev, ...response.checkIns]);
        setOffset(prev => prev + response.checkIns.length);
      } else {
        // Initial load
        setCheckIns(response.checkIns);
        setOffset(response.checkIns.length);
      }

      setHasMore(response.hasMore);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch check-in history');
      setError(fetchError);
      console.error('Error fetching check-in history:', fetchError);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId, enabled, daysBack, offset]);

  // Initial fetch
  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    const initialFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await CheckInService.getUserCheckInHistory({
          userId,
          limit: 50,
          offset: 0,
          daysBack
        });

        setCheckIns(response.checkIns);
        setOffset(response.checkIns.length);
        setHasMore(response.hasMore);
      } catch (err) {
        const fetchError = err instanceof Error ? err : new Error('Failed to fetch check-in history');
        setError(fetchError);
        console.error('Error fetching check-in history:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [userId, enabled, daysBack]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    setOffset(0); // Reset offset
    await fetchCheckIns(true, false);
  }, [fetchCheckIns]);

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    await fetchCheckIns(false, true);
  }, [hasMore, loadingMore, loading, fetchCheckIns]);

  return {
    checkIns,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
