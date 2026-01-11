import { useState, useEffect, useCallback } from 'react';
import { VenueService } from '../services/api/venues';
import type { Venue } from '../types';

export interface UseVenuesOptions {
  featured?: boolean;
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export interface UseVenuesReturn {
  venues: Venue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing venue data
 * 
 * @param options - Options for fetching venues
 * @returns Venues data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * // Fetch featured venues
 * const { venues, loading, error, refetch } = useVenues({ 
 *   featured: true, 
 *   limit: 10 
 * });
 * 
 * // Fetch venues with search
 * const { venues, loading } = useVenues({ 
 *   search: 'coffee', 
 *   category: 'cafe' 
 * });
 * ```
 */
export function useVenues(options: UseVenuesOptions = {}): UseVenuesReturn {
  const {
    featured = false,
    search,
    category,
    location,
    limit,
    offset,
    enabled = true,
  } = options;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVenues = useCallback(async () => {
    if (!enabled) {
      console.log('⏸️ useVenues: Fetch disabled');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 useVenues: Starting fetch...', { 
        featured, 
        limit,
        timestamp: new Date().toISOString() 
      });
      setLoading(true);
      setError(null);

      console.log('📡 useVenues: Calling VenueService...');
      const startTime = Date.now();
      
      const result = featured
        ? await VenueService.getFeaturedVenues(limit)
        : await VenueService.getVenues({
            search,
            category,
            location,
            limit,
            offset,
          });

      const duration = Date.now() - startTime;
      console.log('✅ useVenues: Fetch successful, got', result.length, 'venues in', duration, 'ms');
      setVenues(result);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch venues');
      setError(fetchError);
      console.error('❌ useVenues: Fetch failed:', fetchError.message);
      console.error('❌ Full error:', err);
      // Set empty venues on error so UI can show empty state
      setVenues([]);
    } finally {
      console.log('🏁 useVenues: Fetch complete, setting loading to false');
      setLoading(false);
    }
  }, [featured, search, category, location, limit, offset, enabled]);

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
