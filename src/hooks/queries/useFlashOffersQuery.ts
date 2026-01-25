/**
 * useFlashOffersQuery Hook
 * 
 * React Query hook for fetching flash offers with time-sensitive configuration.
 * Provides automatic caching, aggressive refetching, and loading states.
 * 
 * Features:
 * - Aggressive caching with 10s stale time (time-sensitive data)
 * - Automatic refetch on window focus
 * - Polling with 30s refetch interval
 * - Loading and error state management
 * - Manual refetch capability
 * - Type-safe query key generation
 * 
 * Usage:
 * ```tsx
 * const { flashOffers, isLoading, isFetching, isError, error, refetch } = useFlashOffersQuery({
 *   venueId: 'venue-123'
 * });
 * ```
 * 
 * Validates Requirements: 4.1, 4.2, 4.5
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { FlashOfferService } from '../../services/api/flashOffers';
import type { FlashOffer } from '../../types/flashOffer.types';

/**
 * Options for useFlashOffersQuery hook
 */
export interface UseFlashOffersQueryOptions {
  venueId?: string;
  enabled?: boolean;
}

/**
 * Return type for useFlashOffersQuery hook
 * Provides flash offers data and query state information
 */
export interface UseFlashOffersQueryResult {
  flashOffers: FlashOffer[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Query hook for fetching flash offers
 * 
 * Configured with aggressive refetching for time-sensitive data:
 * - staleTime: 10 seconds (data considered fresh for only 10s)
 * - refetchOnWindowFocus: true (refetch when app returns to foreground)
 * - refetchInterval: 30 seconds (poll for new offers every 30s)
 * 
 * @param options - Query options including venueId and enabled state
 * @returns Flash offers data and query state
 * 
 * @example
 * // Fetch flash offers for a specific venue
 * const { flashOffers, isLoading } = useFlashOffersQuery({
 *   venueId: 'venue-123'
 * });
 * 
 * @example
 * // Conditionally fetch flash offers
 * const { flashOffers, isLoading } = useFlashOffersQuery({
 *   venueId: venueId,
 *   enabled: !!venueId
 * });
 * 
 * @example
 * // Manual refetch
 * const { flashOffers, refetch } = useFlashOffersQuery({
 *   venueId: 'venue-123'
 * });
 * 
 * // Later...
 * await refetch();
 */
export function useFlashOffersQuery(
  options?: UseFlashOffersQueryOptions
): UseFlashOffersQueryResult {
  const { venueId, enabled = true } = options || {};

  const query = useQuery({
    // Use queryKeys.flashOffers.byVenue(venueId) for cache key
    queryKey: queryKeys.flashOffers.byVenue(venueId || '', undefined),
    
    // Query function that fetches flash offers
    queryFn: async () => {
      if (!venueId) {
        return [];
      }
      
      // Get offers for the specific venue
      const result = await FlashOfferService.getVenueOffers(venueId, 'active');
      return result.offers;
    },
    
    // Time-sensitive configuration for flash offers
    // Requirement 4.2: Set staleTime to 10 seconds
    staleTime: 10000, // 10 seconds
    
    // Requirement 4.5: Enable refetchOnWindowFocus
    refetchOnWindowFocus: true,
    
    // Requirement 4.5: Set refetchInterval to 30 seconds for polling
    refetchInterval: 30000, // 30 seconds
    
    // Allow disabling the query
    enabled: enabled && !!venueId,
  });

  return {
    flashOffers: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
}
