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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useVenues: Starting fetch...', { featured, limit });

      let result: Venue[];

      // Add a timeout to prevent infinite loading
      const fetchPromise = (async () => {
        console.log('📡 useVenues: Calling VenueService...');
        if (featured) {
          return await VenueService.getFeaturedVenues(limit);
        } else {
          return await VenueService.getVenues({
            search,
            category,
            location,
            limit,
            offset,
          });
        }
      })();

      const timeoutPromise = new Promise<Venue[]>((_, reject) => {
        setTimeout(() => {
          console.log('⏱️ useVenues: Timeout reached after 10s');
          reject(new Error('Request timeout - check network connection'));
        }, 10000);
      });

      result = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('✅ useVenues: Fetch successful, got', result.length, 'venues');
      setVenues(result);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch venues');
      setError(fetchError);
      console.error('Error fetching venues:', fetchError);
      // Set empty venues on error so UI can show empty state
      setVenues([]);
    } finally {
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
