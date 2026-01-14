import { useState, useEffect, useCallback, useRef } from 'react';
import { VenueService } from '../services/api/venues';
import type { Venue } from '../types';

export interface UseNewVenuesOptions {
  limit?: number;
  enabled?: boolean;
}

export interface UseNewVenuesReturn {
  venues: Venue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching new venues in the spotlight period (last 30 days)
 * 
 * @param options - Options for fetching new venues
 * @returns New venues data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * // Fetch new venues with default limit (10)
 * const { venues, loading, error, refetch } = useNewVenues();
 * 
 * // Fetch new venues with custom limit
 * const { venues, loading } = useNewVenues({ limit: 5 });
 * ```
 */
export function useNewVenues(options: UseNewVenuesOptions = {}): UseNewVenuesReturn {
  const { limit = 10, enabled = true } = options;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchVenues = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) {
      console.log('⏭️ Skipping new venues fetch - already in progress');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🆕 Fetching new venues...', { limit, timestamp: new Date().toISOString() });
      const result = await VenueService.getNewVenues(limit);
      console.log('✅ New venues fetched:', { 
        count: result.length,
        venues: result.map(v => ({ 
          id: v.id, 
          name: v.name, 
          signup_date: (v as any).signup_date 
        }))
      });
      setVenues(result);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch new venues');
      setError(fetchError);
      console.error('❌ Failed to fetch new venues:', err, {
        timestamp: new Date().toISOString(),
      });
      // Set empty venues on error so UI can show empty state
      setVenues([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const refetch = useCallback(async () => {
    await fetchVenues();
  }, [fetchVenues]);

  return {
    venues,
    loading,
    error,
    refetch,
  };
}
