/**
 * useVenuesQuery Hook
 * 
 * React Query hook for fetching venue lists with optional filters.
 * Provides automatic caching, loading states, and refetch capabilities.
 * 
 * Features:
 * - Automatic caching with 30s stale time (from query client defaults)
 * - Support for location, category, and flash offer filters
 * - Loading and error state management
 * - Manual refetch capability
 * - Type-safe query key generation
 * 
 * Usage:
 * ```tsx
 * const { venues, isLoading, isFetching, isError, error, refetch } = useVenuesQuery({
 *   filters: { category: 'restaurant', hasFlashOffers: true }
 * });
 * ```
 * 
 * Validates Requirements: 2.1
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { VenueService } from '../../services/api/venues';
import type { Venue, VenueQueryOptions } from '../../types/venue.types';

/**
 * Filter options for venue queries
 * Extends VenueQueryOptions with additional filter capabilities
 */
export interface VenueFilters extends VenueQueryOptions {
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  category?: string;
  hasFlashOffers?: boolean;
}

/**
 * Options for useVenuesQuery hook
 */
export interface UseVenuesQueryOptions {
  filters?: VenueFilters;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Return type for useVenuesQuery hook
 * Provides venues data and query state information
 */
export interface UseVenuesQueryResult {
  venues: Venue[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Query hook for fetching venue lists
 * 
 * @param options - Query options including filters and enabled state
 * @returns Venues data and query state
 * 
 * @example
 * // Fetch all venues
 * const { venues, isLoading } = useVenuesQuery();
 * 
 * @example
 * // Fetch venues with filters
 * const { venues, isLoading } = useVenuesQuery({
 *   filters: { category: 'restaurant' }
 * });
 * 
 * @example
 * // Fetch nearby venues with location filter
 * const { venues, isLoading } = useVenuesQuery({
 *   filters: {
 *     location: { lat: 40.7128, lng: -74.0060, radius: 5 }
 *   }
 * });
 */
export function useVenuesQuery(
  options?: UseVenuesQueryOptions
): UseVenuesQueryResult {
  const { filters, enabled = true, staleTime } = options || {};

  const query = useQuery({
    // Use queryKeys.venues.list(filters) for cache key
    queryKey: queryKeys.venues.list(filters),
    
    // Query function that fetches venues based on filters
    queryFn: async () => {
      // If location filter is provided, use nearby venues endpoint
      if (filters?.location) {
        const { lat, lng, radius } = filters.location;
        return VenueService.getNearbyVenues(lat, lng, radius, filters.limit);
      }
      
      // Otherwise use standard getVenues with filters
      return VenueService.getVenues(filters);
    },
    
    // Allow disabling the query
    enabled,
    
    // Allow overriding stale time if needed
    ...(staleTime !== undefined && { staleTime }),
  });

  return {
    venues: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
}
