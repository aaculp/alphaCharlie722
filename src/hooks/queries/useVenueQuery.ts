/**
 * useVenueQuery Hook
 * 
 * React Query hook for fetching single venue details.
 * Provides automatic caching, loading states, and refetch capabilities.
 * 
 * Features:
 * - Automatic caching with 30s stale time (from query client defaults)
 * - Loading and error state management
 * - Manual refetch capability
 * - Type-safe query key generation
 * - Optional query enabling/disabling
 * 
 * Usage:
 * ```tsx
 * const { venue, isLoading, isFetching, isError, error, refetch } = useVenueQuery({
 *   venueId: 'venue-123'
 * });
 * ```
 * 
 * Validates Requirements: 2.2
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { VenueService } from '../../services/api/venues';
import type { Venue } from '../../types/venue.types';

/**
 * Options for useVenueQuery hook
 */
export interface UseVenueQueryOptions {
  venueId: string;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Return type for useVenueQuery hook
 * Provides venue data and query state information
 */
export interface UseVenueQueryResult {
  venue: Venue | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Query hook for fetching single venue details
 * 
 * @param options - Query options including venueId and enabled state
 * @returns Venue data and query state
 * 
 * @example
 * // Fetch venue by ID
 * const { venue, isLoading } = useVenueQuery({ venueId: 'venue-123' });
 * 
 * @example
 * // Conditionally fetch venue
 * const { venue, isLoading } = useVenueQuery({
 *   venueId: 'venue-123',
 *   enabled: !!venueId
 * });
 * 
 * @example
 * // Fetch with custom stale time
 * const { venue, isLoading } = useVenueQuery({
 *   venueId: 'venue-123',
 *   staleTime: 60000 // 1 minute
 * });
 */
export function useVenueQuery(
  options: UseVenueQueryOptions
): UseVenueQueryResult {
  const { venueId, enabled = true, staleTime } = options;

  const query = useQuery({
    // Use queryKeys.venues.detail(venueId) for cache key
    queryKey: queryKeys.venues.detail(venueId),
    
    // Query function that fetches single venue by ID
    queryFn: async () => {
      return VenueService.getVenueById(venueId);
    },
    
    // Allow disabling the query
    enabled,
    
    // Allow overriding stale time if needed
    ...(staleTime !== undefined && { staleTime }),
  });

  return {
    venue: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
}
