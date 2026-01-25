import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { CheckInService } from '../services/api/checkins';
import { queryKeys } from '../lib/queryKeys';
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
 * Custom hook for fetching user's check-in history using React Query
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
  
  // Use React Query for automatic cache invalidation
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: [...queryKeys.checkIns.byUser(userId || ''), { daysBack }],
    queryFn: async () => {
      if (!userId) {
        return { checkIns: [], hasMore: false };
      }

      const response = await CheckInService.getUserCheckInHistory({
        userId,
        limit: 50,
        offset: 0,
        daysBack
      });

      return {
        checkIns: response.checkIns,
        hasMore: response.hasMore,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  const refetch = async () => {
    await queryRefetch();
  };

  // Placeholder for pagination - can be enhanced later with infinite query
  const loadMore = async () => {
    // TODO: Implement pagination with useInfiniteQuery if needed
    console.log('Load more not yet implemented with React Query');
  };

  return {
    checkIns: data?.checkIns || [],
    loading: isLoading,
    refreshing: false, // React Query handles this internally
    loadingMore: false, // Not implemented yet
    error: error as Error | null,
    hasMore: data?.hasMore || false,
    loadMore,
    refetch,
  };
}
