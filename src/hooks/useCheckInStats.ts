import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckInService } from '../services/api/checkins';
import { useDebounce } from './useDebounce';
import type { VenueCheckInStats } from '../types';

export interface UseCheckInStatsOptions {
  venueIds: string | string[];
  enabled?: boolean;
}

export interface UseCheckInStatsReturn {
  stats: Map<string, VenueCheckInStats>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching check-in statistics for venues
 * 
 * @param options - Options including venue IDs and enabled flag
 * @returns Check-in stats map, loading state, and error state
 * 
 * @example
 * ```tsx
 * // Single venue
 * const { stats, loading } = useCheckInStats({ 
 *   venueIds: 'venue-123' 
 * });
 * 
 * // Multiple venues
 * const { stats, loading } = useCheckInStats({ 
 *   venueIds: ['venue-1', 'venue-2', 'venue-3'] 
 * });
 * 
 * // Conditional fetching
 * const { stats } = useCheckInStats({ 
 *   venueIds: venueId, 
 *   enabled: !!venueId 
 * });
 * ```
 */
export function useCheckInStats(options: UseCheckInStatsOptions): UseCheckInStatsReturn {
  const { venueIds, enabled = true } = options;
  const { user } = useAuth();
  
  const [stats, setStats] = useState<Map<string, VenueCheckInStats>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Normalize venue IDs to array
  const venueIdsArray = Array.isArray(venueIds) ? venueIds : [venueIds];
  
  // Debounce venue IDs to prevent excessive API calls
  const debouncedVenueIds = useDebounce(venueIdsArray, 300);

  const fetchStats = useCallback(async () => {
    if (!enabled || debouncedVenueIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = user?.id;
      const statsArray = await CheckInService.getMultipleVenueStats(
        debouncedVenueIds,
        userId
      );

      // Convert array to Map for easy lookup
      const statsMap = new Map<string, VenueCheckInStats>();
      statsArray.forEach(stat => {
        statsMap.set(stat.venue_id, stat);
      });

      setStats(statsMap);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch check-in stats');
      setError(fetchError);
      console.error('Error fetching check-in stats:', fetchError);
    } finally {
      setLoading(false);
    }
  }, [debouncedVenueIds, user, enabled]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
